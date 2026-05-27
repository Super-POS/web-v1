import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { ErpPayrollPeriod } from '../../interface';
import { ErpPayrollService } from '../../service';

@Component({
    selector: 'erp-generate-payroll-dialog',
    standalone: true,
    templateUrl: './template.html',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
    ],
})
export class ErpGeneratePayrollDialogComponent implements OnInit {
    resData = new EventEmitter<ErpPayrollPeriod>();
    form: UntypedFormGroup;
    isSaving = false;

    constructor(
        private _dialogRef: MatDialogRef<ErpGeneratePayrollDialogComponent>,
        private _fb: FormBuilder,
        private _snackBar: SnackbarService,
        private _service: ErpPayrollService,
    ) {}

    ngOnInit(): void {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        this.form = this._fb.group({
            period_start: [firstDay, [Validators.required]],
            period_end:   [lastDay, [Validators.required]],
            notes:        [''],
        });
    }

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.isSaving = true;
        this._dialogRef.disableClose = true;
        const value = this.form.getRawValue();
        const body = {
            period_start: value.period_start,
            period_end:   value.period_end,
            notes:        value.notes || undefined,
        };
        this._service.generatePayroll(body).subscribe({
            next: (res) => {
                this.isSaving = false;
                this._dialogRef.disableClose = false;
                this.resData.emit(res.data);
                this._snackBar.openSnackBar(res.message || 'Payroll generated.', GlobalConstants.success);
                this._dialogRef.close();
            },
            error: (err: HttpErrorResponse) => {
                this.isSaving = false;
                this._dialogRef.disableClose = false;
                this._snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    closeDialog(): void { this._dialogRef.close(); }
}
