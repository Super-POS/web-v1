import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Inject, inject } from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { IngredientItem } from '../interface';
import { MenuIngredientService } from '../service';

@Component({
    selector: 'restock-menu-ingredient',
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
export class RestockDialogComponent {
    resData = new EventEmitter<IngredientItem>();

    private _dialogRef = inject(MatDialogRef<RestockDialogComponent>);
    private _formBuilder = inject(UntypedFormBuilder);
    private _service = inject(MenuIngredientService);
    private _snackBarService = inject(SnackbarService);

    isSaving = false;

    form = this._formBuilder.group({
        add: [null as number | null, [Validators.required, Validators.min(0.0001)]],
    });

    constructor(@Inject(MAT_DIALOG_DATA) public data: IngredientItem) {}

    currentQty(): number {
        return Number(this.data.quantity);
    }

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const add = Number(this.form.value.add);
        if (!Number.isFinite(add) || add <= 0) {
            return;
        }

        this._dialogRef.disableClose = true;
        this.isSaving = true;

        this._service.restock(this.data.id, { add }).subscribe({
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
