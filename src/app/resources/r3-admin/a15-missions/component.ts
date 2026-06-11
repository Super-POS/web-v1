import { NgClass, NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { PosBreadcrumbComponent, PosListPageComponent } from 'app/shared/list-page';
import {
    AdminMission,
    CreateMissionPayload,
    MissionParticipant,
    MissionRequirementType,
    UpdateMissionPayload,
} from './interface';
import { AdminMissionService } from './service';

@Component({
    selector: 'admin-missions',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        NgClass, NgFor, NgIf,
        FormsModule,
        MatButtonModule, MatCheckboxModule, MatIconModule, MatInputModule,
        MatProgressSpinnerModule, MatSelectModule, MatTableModule, MatTooltipModule,
        PosBreadcrumbComponent, PosListPageComponent,
    ],
})
export class AdminMissionsComponent implements OnInit {
    private _service  = inject(AdminMissionService);
    private _snackBar = inject(SnackbarService);
    private _cdr      = inject(ChangeDetectorRef);

    readonly displayedColumns   = ['title', 'type', 'reward', 'dates', 'status', 'action'];
    readonly participantColumns = ['customer', 'progress', 'status', 'accepted_at'];
    readonly requirementTypes: MissionRequirementType[] = [
        'purchase_count', 'visit_count', 'referral', 'event', 'custom',
    ];

    missions : AdminMission[] = [];
    isLoading                 = false;

    showAddForm      = false;
    addTitle         = '';
    addDesc          = '';
    addType          : MissionRequirementType = 'purchase_count';
    addTarget        = 1;
    addRewardPoints  = 0;
    addStartDate     = '';
    addEndDate       = '';
    addActive        = true;
    isAdding         = false;

    editingId        : number | null          = null;
    editTitle        = '';
    editDesc         = '';
    editType         : MissionRequirementType = 'purchase_count';
    editTarget       = 1;
    editRewardPoints = 0;
    editStartDate    = '';
    editEndDate      = '';
    editActive       = true;
    isSaving         = false;

    deletingId       : number | null = null;

    viewingParticipantsMission : AdminMission | null  = null;
    participants               : MissionParticipant[] = [];
    isLoadingParticipants      = false;

    ngOnInit(): void { this.load(); }

    load(): void {
        this.isLoading = true;
        this._cdr.markForCheck();
        this._service.list().subscribe({
            next: (res) => {
                this.missions  = res.data ?? [];
                this.isLoading = false;
                this._cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this._snackBar.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                this._cdr.markForCheck();
            },
        });
    }

    openAddForm(): void {
        this.cancelEdit();
        this.addTitle        = '';
        this.addDesc         = '';
        this.addType         = 'purchase_count';
        this.addTarget       = 1;
        this.addRewardPoints = 0;
        this.addStartDate    = '';
        this.addEndDate      = '';
        this.addActive       = true;
        this.showAddForm     = true;
        this._cdr.markForCheck();
    }

    cancelAdd(): void {
        this.showAddForm = false;
        this._cdr.markForCheck();
    }

    submitAdd(): void {
        const payload: CreateMissionPayload = {
            title           : this.addTitle.trim(),
            requirement_type: this.addType,
            target_value    : this.addTarget,
            reward_points   : this.addRewardPoints,
            is_active       : this.addActive,
        };
        if (this.addDesc.trim()) payload.description = this.addDesc.trim();
        if (this.addStartDate)   payload.start_date  = this.addStartDate;
        if (this.addEndDate)     payload.end_date    = this.addEndDate;

        this.isAdding = true;
        this._service.create(payload).subscribe({
            next: (res) => {
                this.missions    = [...this.missions, res.data];
                this.showAddForm = false;
                this.isAdding    = false;
                this._snackBar.openSnackBar(res.message ?? 'Mission created.', GlobalConstants.success);
                this._cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isAdding = false;
                this._snackBar.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                this._cdr.markForCheck();
            },
        });
    }

    startEdit(mission: AdminMission): void {
        this.cancelAdd();
        this.closeParticipants();
        this.editingId        = mission.id;
        this.editTitle        = mission.title;
        this.editDesc         = mission.description ?? '';
        this.editType         = mission.requirement_type;
        this.editTarget       = mission.target_value;
        this.editRewardPoints = mission.reward_points;
        this.editStartDate    = mission.start_date ?? '';
        this.editEndDate      = mission.end_date ?? '';
        this.editActive       = mission.is_active;
        this._cdr.markForCheck();
    }

    cancelEdit(): void {
        this.editingId = null;
        this._cdr.markForCheck();
    }

    saveEdit(mission: AdminMission): void {
        const payload: UpdateMissionPayload = {};
        if (this.editTitle.trim()  !== mission.title)              payload.title            = this.editTitle.trim();
        if ((this.editDesc.trim() || null) !== mission.description) payload.description     = this.editDesc.trim() || undefined;
        if (this.editType          !== mission.requirement_type)   payload.requirement_type = this.editType;
        if (this.editTarget        !== mission.target_value)       payload.target_value     = this.editTarget;
        if (this.editRewardPoints  !== mission.reward_points)      payload.reward_points    = this.editRewardPoints;
        if ((this.editStartDate || null) !== mission.start_date)   payload.start_date       = this.editStartDate || undefined;
        if ((this.editEndDate   || null) !== mission.end_date)     payload.end_date         = this.editEndDate   || undefined;
        if (this.editActive !== mission.is_active)                  payload.is_active        = this.editActive;

        if (!Object.keys(payload).length) { this.cancelEdit(); return; }

        this.isSaving = true;
        this._service.update(mission.id, payload).subscribe({
            next: (res) => {
                const idx = this.missions.findIndex(m => m.id === mission.id);
                if (idx >= 0) this.missions[idx] = res.data;
                this.missions  = [...this.missions];
                this.editingId = null;
                this.isSaving  = false;
                this._snackBar.openSnackBar(res.message ?? 'Mission updated.', GlobalConstants.success);
                this._cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isSaving = false;
                this._snackBar.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                this._cdr.markForCheck();
            },
        });
    }

    deleteMission(mission: AdminMission): void {
        if (this.deletingId !== null) return;
        this.deletingId = mission.id;
        this._cdr.markForCheck();
        this._service.remove(mission.id).subscribe({
            next: (res) => {
                this.missions   = this.missions.filter(m => m.id !== mission.id);
                this.deletingId = null;
                if (this.viewingParticipantsMission?.id === mission.id) this.closeParticipants();
                this._snackBar.openSnackBar(res.message ?? 'Mission deleted.', GlobalConstants.success);
                this._cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.deletingId = null;
                this._snackBar.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                this._cdr.markForCheck();
            },
        });
    }

    viewParticipants(mission: AdminMission): void {
        this.cancelEdit();
        this.viewingParticipantsMission = mission;
        this.participants               = [];
        this.isLoadingParticipants      = true;
        this._cdr.markForCheck();
        this._service.participants(mission.id).subscribe({
            next: (res) => {
                this.participants          = res.data ?? [];
                this.isLoadingParticipants = false;
                this._cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isLoadingParticipants = false;
                this._snackBar.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                this._cdr.markForCheck();
            },
        });
    }

    closeParticipants(): void {
        this.viewingParticipantsMission = null;
        this.participants               = [];
        this._cdr.markForCheck();
    }

    requirementTypeLabel(type: MissionRequirementType): string {
        const map: Record<MissionRequirementType, string> = {
            purchase_count: 'Purchases',
            visit_count   : 'Visits',
            referral      : 'Referral',
            event         : 'Event',
            custom        : 'Custom',
        };
        return map[type] ?? type;
    }

    requirementTypeBadgeClass(type: MissionRequirementType): string {
        const map: Record<MissionRequirementType, string> = {
            purchase_count: 'bg-blue-100   text-blue-800   dark:bg-blue-900   dark:text-blue-200',
            visit_count   : 'bg-green-100  text-green-800  dark:bg-green-900  dark:text-green-200',
            referral      : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            event         : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            custom        : 'bg-gray-100   text-gray-600   dark:bg-gray-700   dark:text-gray-400',
        };
        return map[type] ?? map.custom;
    }

    participantStatusLabel(status: MissionParticipant['status']): string {
        const map: Record<MissionParticipant['status'], string> = {
            accepted   : 'Accepted',
            in_progress: 'In Progress',
            completed  : 'Completed',
            rewarded   : 'Rewarded',
        };
        return map[status] ?? status;
    }

    participantStatusClass(status: MissionParticipant['status']): string {
        const map: Record<MissionParticipant['status'], string> = {
            accepted   : 'bg-gray-100   text-gray-600   dark:bg-gray-700   dark:text-gray-400',
            in_progress: 'bg-blue-100   text-blue-800   dark:bg-blue-900   dark:text-blue-200',
            completed  : 'bg-green-100  text-green-800  dark:bg-green-900  dark:text-green-200',
            rewarded   : 'bg-amber-100  text-amber-800  dark:bg-amber-900  dark:text-amber-200',
        };
        return map[status] ?? map.accepted;
    }

    formatDate(date: string | null): string {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}
