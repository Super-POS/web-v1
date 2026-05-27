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
import { ErpExpense, ErpExpenseCategory } from '../../interface';
import { ErpPlService } from '../../service';

@Component({
    selector: 'erp-create-expense-dialog',
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
export class ErpCreateExpenseDialogComponent implements OnInit {
    resData = new EventEmitter<ErpExpense>();
    form: UntypedFormGroup;
    isSaving = false;
    categories: ErpExpenseCategory[] = [];
    isLoadingCategories = false;

    constructor(
        private _dialogRef: MatDialogRef<ErpCreateExpenseDialogComponent>,
        private _fb: FormBuilder,
        private _snackBar: SnackbarService,
        private _service: ErpPlService,
    ) {}

    ngOnInit(): void {
        const today = new Date().toISOString().split('T')[0];
        this.form = this._fb.group({
            category_id: [null, Validators.required],
            amount: [null, [Validators.required, Validators.min(0.01)]],
            currency: ['USD'],
            description: [''],
            date: [today, Validators.required],
            reference: [''],
        });

        this._loadCategories();
    }

    private _loadCategories(): void {
        this.isLoadingCategories = true;
        this._service.listCategories().subscribe({
            next: (res) => {
                this.categories = res.data || [];
                this.isLoadingCategories = false;
            },
            error: () => {
                this.categories = [];
                this.isLoadingCategories = false;
            },
        });
    }

    submit(): void {
        if (this.form.invalid) { return; }
        this._dialogRef.disableClose = true;
        this.isSaving = true;
        const val = this.form.getRawValue();
        const body = {
            category_id: Number(val.category_id),
            amount: Number(val.amount),
            currency: val.currency || 'USD',
            description: val.description || undefined,
            date: val.date,
            reference: val.reference || undefined,
        };
        this._service.createExpense(body).subscribe({
            next: (res) => {
                this.isSaving = false;
                this._dialogRef.disableClose = false;
                this.resData.emit(res.data);
                this._snackBar.openSnackBar(res.message || 'Saved.', GlobalConstants.success);
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
