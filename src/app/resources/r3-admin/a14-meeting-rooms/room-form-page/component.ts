import { NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { Subject, takeUntil } from 'rxjs';
import {
    AdminMeetingRoomRow,
    MEETING_ROOM_STATUSES,
    MEETING_ROOM_TYPES,
} from '../interface';
import { AdminMeetingRoomService } from '../service';
import { PosBreadcrumbComponent } from 'app/shared/list-page';

@Component({
    selector: 'app-admin-meeting-room-form-page',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        NgIf,
        NgFor,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        PosBreadcrumbComponent,
    ],
})
export class AdminMeetingRoomFormPageComponent implements OnInit, OnDestroy {
    private readonly _unsub = new Subject<void>();
    private readonly _formBuilder = inject(FormBuilder);
    private readonly _snackBar = inject(SnackbarService);
    private readonly _service = inject(AdminMeetingRoomService);
    private readonly _router = inject(Router);
    private readonly _route = inject(ActivatedRoute);

    form!: UntypedFormGroup;
    formReady = false;
    isSaving = false;
    isLoading = false;
    roomId: number | null = null;
    isEditMode = false;

    actionLabel = 'Create room';

    readonly roomTypes = MEETING_ROOM_TYPES;
    readonly roomStatuses = MEETING_ROOM_STATUSES;

    get pageTitle(): string {
        return this.isEditMode ? 'Edit meeting room' : 'Create meeting room';
    }

    get breadcrumbSegments(): string[] {
        return ['Admin', 'Meeting rooms', this.isEditMode ? 'Edit' : 'Create'];
    }

    ngOnInit(): void {
        this._route.paramMap.pipe(takeUntil(this._unsub)).subscribe(() => {
            this.initRouteState();
            this.initForm();
        });
    }

    ngOnDestroy(): void {
        this._unsub.next();
        this._unsub.complete();
    }

    private initRouteState(): void {
        const rawId = this._route.snapshot.paramMap.get('id');
        this.roomId = rawId ? Number(rawId) : null;
        this.isEditMode = Number.isFinite(this.roomId ?? NaN) && (this.roomId ?? 0) > 0;
        this.actionLabel = this.isEditMode ? 'Save changes' : 'Create room';
    }

    private initForm(): void {
        this.formReady = false;
        if (this.isEditMode && this.roomId) {
            this.loadRoom(this.roomId);
            return;
        }
        this.bootstrapForm();
    }

    private loadRoom(id: number): void {
        this.isLoading = true;
        this._service.getById(id).subscribe({
            next: (res) => {
                this.isLoading = false;
                this.bootstrapForm(res.data);
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this._snackBar.openSnackBar(
                    err?.error?.message ?? 'Failed to load room.',
                    GlobalConstants.error,
                );
                this.goBack();
            },
        });
    }

    private bootstrapForm(row?: AdminMeetingRoomRow): void {
        this.form = this._formBuilder.group({
            name: [row?.name ?? '', [Validators.required, Validators.maxLength(100)]],
            description: [row?.description ?? ''],
            capacity: [row?.capacity ?? 4, [Validators.required, Validators.min(1)]],
            price_per_hour: [
                row?.price_per_hour != null && row.price_per_hour !== ''
                    ? Number(row.price_per_hour)
                    : null,
            ],
            type: [row?.type ?? 'standard', Validators.required],
            status: [row?.status ?? 'available', Validators.required],
            notes: [row?.notes ?? ''],
        });
        this.formReady = true;
    }

    goBack(): void {
        this._router.navigate(['/admin/meeting-rooms']);
    }

    save(): void {
        if (this.form.invalid || this.isSaving) {
            this.form.markAllAsTouched();
            return;
        }
        const v = this.form.getRawValue();
        const payload = {
            name: String(v.name).trim(),
            description: v.description?.trim() ? String(v.description).trim() : null,
            capacity: Math.max(1, Math.floor(Number(v.capacity) || 1)),
            price_per_hour:
                v.price_per_hour != null && v.price_per_hour !== '' && Number.isFinite(Number(v.price_per_hour))
                    ? Number(v.price_per_hour)
                    : null,
            type: v.type,
            status: v.status,
            notes: v.notes?.trim() ? String(v.notes).trim() : null,
        };

        this.isSaving = true;
        const req = this.isEditMode && this.roomId
            ? this._service.update(this.roomId, payload)
            : this._service.create(payload);

        req.subscribe({
            next: (res) => {
                this.isSaving = false;
                this._snackBar.openSnackBar(res.message ?? 'Saved.', GlobalConstants.success);
                this.goBack();
            },
            error: (err: HttpErrorResponse) => {
                this.isSaving = false;
                this._snackBar.openSnackBar(
                    err?.error?.message ?? GlobalConstants.genericError,
                    GlobalConstants.error,
                );
            },
        });
    }
}
