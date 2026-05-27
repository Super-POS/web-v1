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
import { ErpEmployee } from '../../interface';
import { ErpPayrollService } from '../../service';

@Component({
    selector: 'erp-employee-create-dialog',
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
export class ErpEmployeeCreateDialogComponent implements OnInit {
    resData = new EventEmitter<ErpEmployee>();
    form: UntypedFormGroup;
    isSaving = false;

    contractTypes = [
        { value: 'full_time',  label: 'Full Time' },
        { value: 'part_time',  label: 'Part Time' },
        { value: 'contract',   label: 'Contract' },
        { value: 'internship', label: 'Internship' },
    ];

    constructor(
        private _dialogRef: MatDialogRef<ErpEmployeeCreateDialogComponent>,
        private _fb: FormBuilder,
        private _snackBar: SnackbarService,
        private _service: ErpPayrollService,
    ) {}

    ngOnInit(): void {
        this.form = this._fb.group({
            user_id:       [null, [Validators.required]],
            position:      ['', [Validators.required]],
            department:    ['', [Validators.required]],
            base_salary:   [null, [Validators.required, Validators.min(0)]],
            hourly_rate:   [null, [Validators.required, Validators.min(0)]],
            hire_date:     ['', [Validators.required]],
            contract_type: ['full_time', [Validators.required]],
            bank_account:  [''],
            bank_name:     [''],
            notes:         [''],
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
            user_id:       Number(value.user_id),
            position:      value.position,
            department:    value.department,
            base_salary:   Number(value.base_salary),
            hourly_rate:   Number(value.hourly_rate),
            hire_date:     value.hire_date,
            contract_type: value.contract_type,
            bank_account:  value.bank_account || undefined,
            bank_name:     value.bank_name || undefined,
            notes:         value.notes || undefined,
        };
        this._service.createEmployee(body).subscribe({
            next: (res) => {
                this.isSaving = false;
                this._dialogRef.disableClose = false;
                this.resData.emit(res.data);
                this._snackBar.openSnackBar(res.message || 'Employee created.', GlobalConstants.success);
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
