import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
    selector: 'app-admin-coupon-create-dialog',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatCheckboxModule,
        MatChipsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
    ],
})
export class AdminCouponCreateDialogComponent implements OnInit, OnDestroy {
    resData = new EventEmitter<AdminCouponRow>();
    form: UntypedFormGroup;
    isSaving = false;

    userSearch = new UntypedFormControl('');
    userSuggestions: CouponUserOption[] = [];
    isSearchingUsers = false;
    selectedUsers: CouponUserOption[] = [];

    private _destroy$ = new Subject<void>();

    constructor(
        private _dialogRef: MatDialogRef<AdminCouponCreateDialogComponent>,
        private _formBuilder: FormBuilder,
        private _snackBar: SnackbarService,
        private _service: AdminCouponService,
    ) {}

    ngOnInit(): void {
        this.form = this._formBuilder.group({
            generate_code: [false],
            code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(64)]],
            discount_percent: [null, [Validators.required]],
            note: [''],
            usage_limit: [null],
            expires_at: [''],
        });

        this.form.get('generate_code')?.valueChanges.subscribe((gen: boolean) => {
            const codeCtrl = this.form.get('code');
            if (gen) {
                codeCtrl?.clearValidators();
                codeCtrl?.setValue('');
                codeCtrl?.disable({ emitEvent: false });
            } else {
                codeCtrl?.enable({ emitEvent: false });
                codeCtrl?.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(64)]);
            }
            codeCtrl?.updateValueAndValidity({ emitEvent: false });
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
        const generateCode = !!this.form.get('generate_code')?.value;
        const code = String(this.form.get('code')?.value ?? '').trim();
        const pct = Number(this.form.get('discount_percent')?.value);
        if (!generateCode && (!code || code.length < 2)) {
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
        const note = noteRaw ? noteRaw : undefined;
        const usageLimitRaw = this.form.get('usage_limit')?.value;
        const usage_limit = usageLimitRaw != null && usageLimitRaw !== '' ? Number(usageLimitRaw) : null;
        const expiresRaw = String(this.form.get('expires_at')?.value ?? '').trim();
        const expires_at = expiresRaw ? new Date(expiresRaw).toISOString() : null;
        const assigned_user_ids = this.selectedUsers.map((u) => u.id);
        const payload = generateCode
            ? { auto_generate_code: true as const, discount_percent: pct, is_active: true as const, note, usage_limit, expires_at, assigned_user_ids }
            : { code, discount_percent: pct, is_active: true as const, note, usage_limit, expires_at, assigned_user_ids };
        this._service.create(payload).subscribe({
            next: (response) => {
                this.isSaving = false;
                this._dialogRef.disableClose = false;
                this.resData.emit(response.data);
                this._snackBar.openSnackBar(response.message || 'Saved.', GlobalConstants.success);
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
