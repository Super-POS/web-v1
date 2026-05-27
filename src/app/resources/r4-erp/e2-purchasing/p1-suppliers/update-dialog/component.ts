import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { ErpSupplier } from '../../interface';
import { ErpPurchasingService } from '../../service';

@Component({
    selector: 'erp-supplier-update-dialog',
    standalone: true,
    templateUrl: './template.html',
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
export class ErpSupplierUpdateDialogComponent implements OnInit {
    resData = new EventEmitter<ErpSupplier>();
    form: UntypedFormGroup;
    isSaving = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: ErpSupplier,
        private _dialogRef: MatDialogRef<ErpSupplierUpdateDialogComponent>,
        private _fb: FormBuilder,
        private _snackBar: SnackbarService,
        private _service: ErpPurchasingService,
    ) {}

    ngOnInit(): void {
        this.form = this._fb.group({
            name: [this.data.name, Validators.required],
            contact_person: [this.data.contact_person ?? ''],
            phone: [this.data.phone ?? ''],
            email: [this.data.email ?? ''],
            address: [this.data.address ?? ''],
            payment_terms: [this.data.payment_terms ?? ''],
            notes: [this.data.notes ?? ''],
            is_active: [this.data.is_active],
        });
    }

    submit(): void {
        if (this.form.invalid) { return; }
        this._dialogRef.disableClose = true;
        this.isSaving = true;
        const body = this.form.getRawValue();
        this._service.updateSupplier(this.data.id, body).subscribe({
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
