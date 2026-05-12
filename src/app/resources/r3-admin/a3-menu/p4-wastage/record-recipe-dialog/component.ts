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
    RecipeOption,
    RecipeWastageRecord,
    WASTAGE_REASONS,
} from '../interface';
import { MenuWastageService } from '../service';

@Component({
    selector: 'record-recipe-wastage-dialog',
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
export class RecordRecipeWastageDialogComponent implements OnInit {
    resData = new EventEmitter<RecipeWastageRecord>();

    private _dialogRef = inject(MatDialogRef<RecordRecipeWastageDialogComponent>);
    private _formBuilder = inject(UntypedFormBuilder);
    private _service = inject(MenuWastageService);
    private _snackBarService = inject(SnackbarService);

    isLoading = false;
    isSaving = false;

    allRecipes: RecipeOption[] = [];
    filteredRecipes: RecipeOption[] = [];
    selectedRecipe: RecipeOption | null = null;

    /** Displayed text in the search box — not submitted directly. */
    productSearch = new UntypedFormControl('');

    readonly wastageReasons = WASTAGE_REASONS;

    form = this._formBuilder.group({
        menu_id: [null as number | null, [Validators.required]],
        quantity: [null as number | null, [Validators.required, Validators.min(0.0001)]],
        reason: [null as string | null, [Validators.required]],
        note: ['' as string | null],
    });

    ngOnInit(): void {
        this.isLoading = true;
        this._service.getRecipeOptions().subscribe({
            next: (res) => {
                this.allRecipes = res.data ?? [];
                this.filteredRecipes = [...this.allRecipes];
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
            },
        });

        this.productSearch.valueChanges.subscribe((value: string | RecipeOption) => {
            const q = (typeof value === 'string' ? value : '').toLowerCase().trim();
            this.filteredRecipes = q
                ? this.allRecipes.filter((r) =>
                    r.name.toLowerCase().includes(q) ||
                    (r.code ?? '').toLowerCase().includes(q) ||
                    (r.type?.name ?? '').toLowerCase().includes(q)
                  )
                : [...this.allRecipes];

            // If the user clears the input, clear selection too
            if (typeof value === 'string' && value.trim() === '') {
                this.selectedRecipe = null;
                this.form.patchValue({ menu_id: null });
            }
        });
    }

    onRecipeSelected(event: MatAutocompleteSelectedEvent): void {
        const recipe = event.option.value as RecipeOption;
        this.selectedRecipe = recipe;
        this.form.patchValue({ menu_id: recipe.id });
    }

    displayRecipeName(recipe: RecipeOption | null): string {
        return recipe?.name ?? '';
    }

    clearProductSearch(): void {
        this.productSearch.setValue('');
        this.selectedRecipe = null;
        this.form.patchValue({ menu_id: null });
    }

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this._dialogRef.disableClose = true;
        this.isSaving = true;

        this._service.recordRecipeWastage({
            menu_id: Number(this.form.value.menu_id),
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
