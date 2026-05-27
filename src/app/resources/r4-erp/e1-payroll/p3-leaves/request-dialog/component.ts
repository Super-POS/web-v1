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
import { MatSelectModule } from '@angular/material/select';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { ErpLeave } from '../../interface';
import { ErpPayrollService } from '../../service';

@Component({
    selector: 'erp-request-leave-dialog',
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
        MatSelectModule,
    ],
})
export class ErpRequestLeaveDialogComponent implements OnInit {
    resData = new EventEmitter<ErpLeave>();
    form: UntypedFormGroup;
    isSaving = false;

    leaveTypes = [
        { value: 'annual',    label: 'Annual' },
        { value: 'sick',      label: 'Sick' },
        { value: 'unpaid',    label: 'Unpaid' },
        { value: 'maternity', label: 'Maternity' },
        { value: 'paternity', label: 'Paternity' },
        { value: 'other',     label: 'Other' },
    ];

    constructor(
        private _dialogRef: MatDialogRef<ErpRequestLeaveDialogComponent>,
        private _fb: FormBuilder,
        private _snackBar: SnackbarService,
        private _service: ErpPayrollService,
    ) {}

    ngOnInit(): void {
        this.form = this._fb.group({
            employee_id: [null, [Validators.required]],
            type:        ['annual', [Validators.required]],
            start_date:  ['', [Validators.required]],
            end_date:    ['', [Validators.required]],
            days:        [null, [Validators.required, Validators.min(1)]],
            reason:      [''],
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
        const body: Partial<ErpLeave> = {
            employee_id: Number(value.employee_id),
            type:        value.type,
            start_date:  value.start_date,
            end_date:    value.end_date,
            days:        Number(value.days),
            reason:      value.reason || undefined,
        };
        this._service.requestLeave(body).subscribe({
            next: (res) => {
                this.isSaving = false;
                this._dialogRef.disableClose = false;
                this.resData.emit(res.data);
                this._snackBar.openSnackBar(res.message || 'Leave requested.', GlobalConstants.success);
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
