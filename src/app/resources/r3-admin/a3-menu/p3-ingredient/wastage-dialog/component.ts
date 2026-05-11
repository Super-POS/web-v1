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
import { MatSelectModule } from '@angular/material/select';

import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { IngredientItem, WASTAGE_REASONS } from '../interface';
import { MenuIngredientService } from '../service';

@Component({
    selector: 'wastage-menu-ingredient',
    templateUrl: './template.html',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
})
export class WastageDialogComponent {
    resData = new EventEmitter<IngredientItem>();

    private _dialogRef = inject(MatDialogRef<WastageDialogComponent>);
    private _formBuilder = inject(UntypedFormBuilder);
    private _service = inject(MenuIngredientService);
    private _snackBarService = inject(SnackbarService);

    isSaving = false;

    readonly wastageReasons = WASTAGE_REASONS;

    form = this._formBuilder.group({
        amount: [null as number | null, [Validators.required, Validators.min(0.0001)]],
        reason: [null as string | null, [Validators.required]],
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

        const amount = Number(this.form.value.amount);
        const reason = this.form.value.reason as string;

        if (!Number.isFinite(amount) || amount <= 0) {
            return;
        }

        this._dialogRef.disableClose = true;
        this.isSaving = true;

        this._service.wastage(this.data.id, { amount, reason }).subscribe({
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
