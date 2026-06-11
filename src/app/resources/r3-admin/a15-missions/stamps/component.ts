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
import { AdminStamp, CreateStampPayload, StampCategory, UpdateStampPayload } from './interface';
import { AdminStampService } from './service';

@Component({
    selector: 'admin-stamps',
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
export class AdminStampsComponent implements OnInit {
    private _service  = inject(AdminStampService);
    private _snackBar = inject(SnackbarService);
    private _cdr      = inject(ChangeDetectorRef);

    readonly displayedColumns                  = ['name', 'category', 'trigger', 'points', 'status', 'action'];
    readonly categories: StampCategory[]       = ['drink', 'event', 'referral', 'visit', 'custom'];

    stamps   : AdminStamp[] = [];
    isLoading               = false;

    showAddForm  = false;
    addName      = '';
    addCategory  : StampCategory = 'drink';
    addTrigger   = '';
    addPoints    = 0;
    addActive    = true;
    isAdding     = false;

    editingId    : number | null = null;
    editName     = '';
    editCategory : StampCategory = 'drink';
    editTrigger  = '';
    editPoints   = 0;
    editActive   = true;
    isSaving     = false;

    deletingId   : number | null = null;

    ngOnInit(): void { this.load(); }

    load(): void {
        this.isLoading = true;
        this._cdr.markForCheck();
        this._service.list().subscribe({
            next: (res) => {
                this.stamps    = res.data ?? [];
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
        this.addName     = '';
        this.addCategory = 'drink';
        this.addTrigger  = '';
        this.addPoints   = 0;
        this.addActive   = true;
        this.showAddForm = true;
        this._cdr.markForCheck();
    }

    cancelAdd(): void {
        this.showAddForm = false;
        this._cdr.markForCheck();
    }

    submitAdd(): void {
        const payload: CreateStampPayload = {
            name             : this.addName.trim(),
            category         : this.addCategory,
            trigger_condition: this.addTrigger.trim(),
            bonus_points     : this.addPoints,
            is_active        : this.addActive,
        };
        this.isAdding = true;
        this._service.create(payload).subscribe({
            next: (res) => {
                this.stamps      = [...this.stamps, res.data];
                this.showAddForm = false;
                this.isAdding    = false;
                this._snackBar.openSnackBar(res.message ?? 'Stamp created.', GlobalConstants.success);
                this._cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isAdding = false;
                this._snackBar.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                this._cdr.markForCheck();
            },
        });
    }

    startEdit(stamp: AdminStamp): void {
        this.cancelAdd();
        this.editingId   = stamp.id;
        this.editName    = stamp.name;
        this.editCategory = stamp.category;
        this.editTrigger = stamp.trigger_condition;
        this.editPoints  = stamp.bonus_points;
        this.editActive  = stamp.is_active;
        this._cdr.markForCheck();
    }

    cancelEdit(): void {
        this.editingId = null;
        this._cdr.markForCheck();
    }

    saveEdit(stamp: AdminStamp): void {
        const payload: UpdateStampPayload = {};
        if (this.editName.trim()     !== stamp.name)               payload.name               = this.editName.trim();
        if (this.editCategory        !== stamp.category)           payload.category           = this.editCategory;
        if (this.editTrigger.trim()  !== stamp.trigger_condition)  payload.trigger_condition  = this.editTrigger.trim();
        if (this.editPoints          !== stamp.bonus_points)       payload.bonus_points       = this.editPoints;
        if (this.editActive          !== stamp.is_active)          payload.is_active          = this.editActive;

        if (!Object.keys(payload).length) { this.cancelEdit(); return; }

        this.isSaving = true;
        this._service.update(stamp.id, payload).subscribe({
            next: (res) => {
                const idx = this.stamps.findIndex(s => s.id === stamp.id);
                if (idx >= 0) this.stamps[idx] = res.data;
                this.stamps    = [...this.stamps];
                this.editingId = null;
                this.isSaving  = false;
                this._snackBar.openSnackBar(res.message ?? 'Stamp updated.', GlobalConstants.success);
                this._cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isSaving = false;
                this._snackBar.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                this._cdr.markForCheck();
            },
        });
    }

    deleteStamp(stamp: AdminStamp): void {
        if (this.deletingId !== null) return;
        this.deletingId = stamp.id;
        this._cdr.markForCheck();
        this._service.remove(stamp.id).subscribe({
            next: (res) => {
                this.stamps     = this.stamps.filter(s => s.id !== stamp.id);
                this.deletingId = null;
                this._snackBar.openSnackBar(res.message ?? 'Stamp deleted.', GlobalConstants.success);
                this._cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.deletingId = null;
                this._snackBar.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                this._cdr.markForCheck();
            },
        });
    }

    categoryBadgeClass(category: StampCategory): string {
        const map: Record<StampCategory, string> = {
            drink   : 'bg-teal-100   text-teal-800   dark:bg-teal-900   dark:text-teal-200',
            event   : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            referral: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            visit   : 'bg-green-100  text-green-800  dark:bg-green-900  dark:text-green-200',
            custom  : 'bg-gray-100   text-gray-600   dark:bg-gray-700   dark:text-gray-400',
        };
        return map[category] ?? map.custom;
    }

    categoryLabel(category: StampCategory): string {
        const map: Record<StampCategory, string> = {
            drink   : 'Drink',
            event   : 'Event',
            referral: 'Referral',
            visit   : 'Visit',
            custom  : 'Custom',
        };
        return map[category] ?? category;
    }
}
