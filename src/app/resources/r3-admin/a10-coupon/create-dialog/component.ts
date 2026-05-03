import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { AdminCouponRow } from '../interface';
import { AdminCouponService } from '../service';

@Component({
    selector: 'app-admin-coupon-create-dialog',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
    ],
})
export class AdminCouponCreateDialogComponent implements OnInit {
    resData = new EventEmitter<AdminCouponRow>();
    form: UntypedFormGroup;
    isSaving = false;

    constructor(
        private _dialogRef: MatDialogRef<AdminCouponCreateDialogComponent>,
        private _formBuilder: FormBuilder,
        private _snackBarService: SnackbarService,
        private _service: AdminCouponService,
    ) {}

    ngOnInit(): void {
        this.form = this._formBuilder.group({
            generate_code: [false],
            code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(64)]],
            discount_percent: [null, [Validators.required]],
            note: [''],
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
    }

    submit(): void {
        const generateCode = !!this.form.get('generate_code')?.value;
        const code = String(this.form.get('code')?.value ?? '').trim();
        const pct = Number(this.form.get('discount_percent')?.value);
        if (!generateCode && (!code || code.length < 2)) {
            this._snackBarService.openSnackBar('Enter a coupon code (at least 2 characters).', GlobalConstants.error);
            return;
        }
        if (!Number.isFinite(pct) || pct < 0.01 || pct > 100) {
            this._snackBarService.openSnackBar('Discount percent must be between 0.01 and 100.', GlobalConstants.error);
            return;
        }
        this._dialogRef.disableClose = true;
        this.isSaving = true;
        const noteRaw = String(this.form.get('note')?.value ?? '').trim();
        const note = noteRaw ? noteRaw : undefined;
        const payload = generateCode
            ? { auto_generate_code: true as const, discount_percent: pct, is_active: true as const, note }
            : { code, discount_percent: pct, is_active: true as const, note };
        this._service.create(payload).subscribe({
            next: (response) => {
                this.isSaving = false;
                this._dialogRef.disableClose = false;
                this.resData.emit(response.data);
                this._snackBarService.openSnackBar(response.message || 'Saved.', GlobalConstants.success);
                this._dialogRef.close();
            },
            error: (err: HttpErrorResponse) => {
                this._dialogRef.disableClose = false;
                this.isSaving = false;
                this._snackBarService.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    closeDialog(): void {
        this._dialogRef.close();
    }
}
