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
import { ErpAttendance } from '../../interface';
import { ErpPayrollService } from '../../service';

@Component({
    selector: 'erp-mark-attendance-dialog',
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
export class ErpMarkAttendanceDialogComponent implements OnInit {
    resData = new EventEmitter<ErpAttendance>();
    form: UntypedFormGroup;
    isSaving = false;

    statusOptions = [
        { value: 'present',  label: 'Present' },
        { value: 'absent',   label: 'Absent' },
        { value: 'late',     label: 'Late' },
        { value: 'half_day', label: 'Half Day' },
        { value: 'holiday',  label: 'Holiday' },
        { value: 'on_leave', label: 'On Leave' },
    ];

    constructor(
        private _dialogRef: MatDialogRef<ErpMarkAttendanceDialogComponent>,
        private _fb: FormBuilder,
        private _snackBar: SnackbarService,
        private _service: ErpPayrollService,
    ) {}

    ngOnInit(): void {
        const today = new Date().toISOString().slice(0, 10);
        this.form = this._fb.group({
            employee_id:     [null, [Validators.required]],
            date:            [today, [Validators.required]],
            clock_in:        [''],
            clock_out:       [''],
            overtime_hours:  [null],
            status:          ['present', [Validators.required]],
            notes:           [''],
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
        const body: Partial<ErpAttendance> = {
            employee_id:    Number(value.employee_id),
            date:           value.date,
            clock_in:       value.clock_in || undefined,
            clock_out:      value.clock_out || undefined,
            overtime_hours: value.overtime_hours != null ? Number(value.overtime_hours) : undefined,
            status:         value.status,
            notes:          value.notes || undefined,
        };
        this._service.markAttendance(body).subscribe({
            next: (res) => {
                this.isSaving = false;
                this._dialogRef.disableClose = false;
                this.resData.emit(res.data);
                this._snackBar.openSnackBar(res.message || 'Attendance marked.', GlobalConstants.success);
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
