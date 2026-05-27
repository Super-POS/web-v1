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
import { ErpExpenseCategory } from '../../interface';
import { ErpPlService } from '../../service';

@Component({
    selector: 'erp-update-category-dialog',
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
export class ErpUpdateCategoryDialogComponent implements OnInit {
    resData = new EventEmitter<ErpExpenseCategory>();
    form: UntypedFormGroup;
    isSaving = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: ErpExpenseCategory,
        private _dialogRef: MatDialogRef<ErpUpdateCategoryDialogComponent>,
        private _fb: FormBuilder,
        private _snackBar: SnackbarService,
        private _service: ErpPlService,
    ) {}

    ngOnInit(): void {
        this.form = this._fb.group({
            name: [this.data.name, Validators.required],
            type: [this.data.type, Validators.required],
            description: [this.data.description ?? ''],
        });
    }

    submit(): void {
        if (this.form.invalid) { return; }
        this._dialogRef.disableClose = true;
        this.isSaving = true;
        const body = this.form.getRawValue();
        this._service.updateCategory(this.data.id, body).subscribe({
            next: (res) => {
                this.isSaving = false;
                this._dialogRef.disableClose = false;
                this.resData.emit(res.data);
                this._snackBar.openSnackBar(res.message || 'Updated.', GlobalConstants.success);
                this._dialogRef.close();
            },
            error: (err: HttpErrorResponse) => {
                this._dialogRef.disableClose = false;
                this.isSaving = false;
                this._snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    closeDialog(): void { this._dialogRef.close(); }
}
