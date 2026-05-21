import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { AdminCouponRow, CouponUserOption } from '../interface';
import { AdminCouponService } from '../service';

@Component({
    selector: 'app-admin-coupon-update-dialog',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatChipsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
    ],
})
export class AdminCouponUpdateDialogComponent implements OnInit, OnDestroy {
    resData = new EventEmitter<AdminCouponRow>();
    form: UntypedFormGroup;
    isSaving = false;

    userSearch = new UntypedFormControl('');
    userSuggestions: CouponUserOption[] = [];
    isSearchingUsers = false;
    selectedUsers: CouponUserOption[] = [];

    private _destroy$ = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: AdminCouponRow,
        private _dialogRef: MatDialogRef<AdminCouponUpdateDialogComponent>,
        private _formBuilder: FormBuilder,
        private _snackBar: SnackbarService,
        private _service: AdminCouponService,
    ) {}

    private _toDatetimeLocal(iso: string | null | undefined): string {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    ngOnInit(): void {
        this.selectedUsers = (this.data.assigned_users ?? []).map((u) => ({
            id: u.id,
            name: u.name,
            phone: '',
        }));

        this.form = this._formBuilder.group({
            code: [this.data.code, [Validators.required, Validators.minLength(2), Validators.maxLength(64)]],
            discount_percent: [Number(this.data.discount_percent), [Validators.required]],
            note: [this.data.note ?? ''],
            usage_limit: [this.data.usage_limit ?? null],
            expires_at: [this._toDatetimeLocal(this.data.expires_at)],
        });

        this.userSearch.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this._destroy$),
        ).subscribe((q: string) => {
            const query = (typeof q === 'string' ? q : '').trim();
            if (!query) {
                this.userSuggestions = [];
                return;
            }
            this.isSearchingUsers = true;
            this._service.searchUsers(query).subscribe({
                next: (res) => {
                    const ids = new Set(this.selectedUsers.map((u) => u.id));
                    this.userSuggestions = (res.data ?? []).filter((u) => !ids.has(u.id));
                    this.isSearchingUsers = false;
                },
                error: () => {
                    this.userSuggestions = [];
                    this.isSearchingUsers = false;
                },
            });
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    onUserSelected(event: MatAutocompleteSelectedEvent): void {
        const user = event.option.value as CouponUserOption;
        if (!this.selectedUsers.find((u) => u.id === user.id)) {
            this.selectedUsers = [...this.selectedUsers, user];
        }
        this.userSearch.setValue('', { emitEvent: false });
        this.userSuggestions = [];
    }

    removeUser(userId: number): void {
        this.selectedUsers = this.selectedUsers.filter((u) => u.id !== userId);
    }

    displayUserName(): string {
        return '';
    }

    submit(): void {
        const code = String(this.form.get('code')?.value ?? '').trim();
        const pct = Number(this.form.get('discount_percent')?.value);
        if (!code || code.length < 2) {
            this._snackBar.openSnackBar('Enter a coupon code (at least 2 characters).', GlobalConstants.error);
            return;
        }
        if (!Number.isFinite(pct) || pct < 0.01 || pct > 100) {
            this._snackBar.openSnackBar('Discount percent must be between 0.01 and 100.', GlobalConstants.error);
            return;
        }
        this._dialogRef.disableClose = true;
        this.isSaving = true;
        const noteRaw = String(this.form.get('note')?.value ?? '').trim();
        const note = noteRaw ? noteRaw : null;
        const usageLimitRaw = this.form.get('usage_limit')?.value;
        const usage_limit = usageLimitRaw != null && usageLimitRaw !== '' ? Number(usageLimitRaw) : null;
        const expiresRaw = String(this.form.get('expires_at')?.value ?? '').trim();
        const expires_at = expiresRaw ? new Date(expiresRaw).toISOString() : null;
        const assigned_user_ids = this.selectedUsers.map((u) => u.id);
        this._service.update(this.data.id, { code, discount_percent: pct, note, usage_limit, expires_at, assigned_user_ids }).subscribe({
            next: (response) => {
                this.isSaving = false;
                this._dialogRef.disableClose = false;
                this.resData.emit(response.data);
                this._snackBar.openSnackBar(response.message || 'Updated.', GlobalConstants.success);
                this._dialogRef.close();
            },
            error: (err: HttpErrorResponse) => {
                this._dialogRef.disableClose = false;
                this.isSaving = false;
                this._snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    closeDialog(): void {
        this._dialogRef.close();
    }
}
