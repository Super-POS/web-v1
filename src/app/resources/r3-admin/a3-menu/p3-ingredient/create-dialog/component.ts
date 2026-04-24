import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { IngredientItem } from '../interface';
import { ProductIngredientService } from '../service';

@Component({
    selector: 'create-product-ingredient',
    templateUrl: './template.html',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
})
export class CreateDialogComponent implements OnInit {
    resData = new EventEmitter<IngredientItem>();

    private _dialogRef = inject(MatDialogRef<CreateDialogComponent>);
    private _formBuilder = inject(UntypedFormBuilder);
    private _service = inject(ProductIngredientService);
    private _snackBarService = inject(SnackbarService);

    isSaving = false;

    form = this._formBuilder.group({
        name: [null, [Validators.required]],
        unit: [''],
        quantity: [1, [Validators.required, Validators.min(0.0001)]],
    });

    constructor() {}

    ngOnInit(): void {}

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this._dialogRef.disableClose = true;
        this.isSaving = true;

        this._service.create({
            name: this.form.value.name ?? '',
            unit: this.form.value.unit ?? '',
            quantity: Number(this.form.value.quantity),
        }).subscribe({
            next: (response) => {
                this.resData.emit(response.data);
                this._snackBarService.openSnackBar(response.message, GlobalConstants.success);
                this.isSaving = false;
                this._dialogRef.close();
            },
            error: (err: HttpErrorResponse) => {
                this.isSaving = false;
                this._dialogRef.disableClose = false;
                this._snackBarService.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    closeDialog(): void {
        this._dialogRef.close();
    }
}
