import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import {
    IngredientOption,
    IngredientWastageRecord,
    WASTAGE_REASONS,
} from '../interface';
import { MenuWastageService } from '../service';

@Component({
    selector: 'record-ingredient-wastage-dialog',
    templateUrl: './template.html',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
})
export class RecordIngredientWastageDialogComponent implements OnInit {
    resData = new EventEmitter<IngredientWastageRecord>();

    private _dialogRef = inject(MatDialogRef<RecordIngredientWastageDialogComponent>);
    private _formBuilder = inject(UntypedFormBuilder);
    private _service = inject(MenuWastageService);
    private _snackBarService = inject(SnackbarService);

    isLoading = false;
    isSaving = false;

    allIngredients: IngredientOption[] = [];
    filteredIngredients: IngredientOption[] = [];
    selectedIngredientItem: IngredientOption | null = null;

    /** Displayed text in the search box — not submitted directly. */
    ingredientSearch = new UntypedFormControl('');

    readonly wastageReasons = WASTAGE_REASONS;

    form = this._formBuilder.group({
        ingredient_id: [null as number | null, [Validators.required]],
        quantity: [null as number | null, [Validators.required, Validators.min(0.0001)]],
        reason: [null as string | null, [Validators.required]],
        note: ['' as string | null],
    });

    ngOnInit(): void {
        this.isLoading = true;
        this._service.getIngredientOptions().subscribe({
            next: (res) => {
                this.allIngredients = res.data ?? [];
                this.filteredIngredients = [...this.allIngredients];
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
            },
        });

        this.ingredientSearch.valueChanges.subscribe((value: string | IngredientOption) => {
            const q = (typeof value === 'string' ? value : '').toLowerCase().trim();
            this.filteredIngredients = q
                ? this.allIngredients.filter((i) =>
                    i.name.toLowerCase().includes(q) ||
                    (i.unit ?? '').toLowerCase().includes(q)
                  )
                : [...this.allIngredients];

            if (typeof value === 'string' && value.trim() === '') {
                this.selectedIngredientItem = null;
                this.form.patchValue({ ingredient_id: null });
            }
        });
    }

    onIngredientSelected(event: MatAutocompleteSelectedEvent): void {
        const ing = event.option.value as IngredientOption;
        this.selectedIngredientItem = ing;
        this.form.patchValue({ ingredient_id: ing.id });
    }

    displayIngredientName(ing: IngredientOption | null): string {
        return ing?.name ?? '';
    }

    clearIngredientSearch(): void {
        this.ingredientSearch.setValue('');
        this.selectedIngredientItem = null;
        this.form.patchValue({ ingredient_id: null });
    }

    selectedIngredient(): IngredientOption | null {
        return this.selectedIngredientItem;
    }

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this._dialogRef.disableClose = true;
        this.isSaving = true;

        this._service.recordIngredientWastage({
            ingredient_id: Number(this.form.value.ingredient_id),
            quantity: Number(this.form.value.quantity),
            reason: this.form.value.reason as string,
            note: this.form.value.note || undefined,
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
