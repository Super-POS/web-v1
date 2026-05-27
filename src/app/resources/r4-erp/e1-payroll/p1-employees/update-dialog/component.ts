import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { ErpEmployee } from '../../interface';
import { ErpPayrollService } from '../../service';

@Component({
    selector: 'erp-employee-update-dialog',
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
export class ErpEmployeeUpdateDialogComponent implements OnInit {
    resData = new EventEmitter<ErpEmployee>();
    form: UntypedFormGroup;
    isSaving = false;

    contractTypes = [
        { value: 'full_time',  label: 'Full Time' },
        { value: 'part_time',  label: 'Part Time' },
        { value: 'contract',   label: 'Contract' },
        { value: 'internship', label: 'Internship' },
    ];

    statusOptions = [
        { value: 'active',   label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: ErpEmployee,
        private _dialogRef: MatDialogRef<ErpEmployeeUpdateDialogComponent>,
        private _fb: FormBuilder,
        private _snackBar: SnackbarService,
        private _service: ErpPayrollService,
    ) {}

    ngOnInit(): void {
        this.form = this._fb.group({
            position:      [this.data.position, [Validators.required]],
            department:    [this.data.department, [Validators.required]],
            base_salary:   [this.data.base_salary, [Validators.required, Validators.min(0)]],
            hourly_rate:   [this.data.hourly_rate, [Validators.required, Validators.min(0)]],
            contract_type: [this.data.contract_type, [Validators.required]],
            bank_account:  [this.data.bank_account || ''],
            bank_name:     [this.data.bank_name || ''],
            notes:         [this.data.notes || ''],
            status:        [this.data.status, [Validators.required]],
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
        const body: Partial<ErpEmployee> = {
            position:      value.position,
            department:    value.department,
            base_salary:   Number(value.base_salary),
            hourly_rate:   Number(value.hourly_rate),
            contract_type: value.contract_type,
            bank_account:  value.bank_account || undefined,
            bank_name:     value.bank_name || undefined,
            notes:         value.notes || undefined,
            status:        value.status,
        };
        this._service.updateEmployee(this.data.id, body).subscribe({
            next: (res) => {
                this.isSaving = false;
                this._dialogRef.disableClose = false;
                this.resData.emit(res.data);
                this._snackBar.openSnackBar(res.message || 'Employee updated.', GlobalConstants.success);
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
