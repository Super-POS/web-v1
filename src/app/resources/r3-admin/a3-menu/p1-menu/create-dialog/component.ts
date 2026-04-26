
// ================================================================================>> Core Library
import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

// ================================================================================>> Thrid Party Library
// Material
import { HttpErrorResponse } from '@angular/common/http';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { env } from 'envs/env';

import { PortraitComponent } from 'helper/components/portrait/component';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { Subject } from 'rxjs';
import { Data } from '../interface';
import { MenuService } from '../service';
import { MenuIngredientService } from '../../p3-ingredient/service';
import { IngredientItem } from '../../p3-ingredient/interface';
@Component({
    selector: 'app-menu-form-dialog',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: true,
    imports: [
        RouterModule,
        FormsModule,
        MatIconModule,
        CommonModule,
        MatTooltipModule,
        AsyncPipe,
        MatProgressSpinnerModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatAutocompleteModule,
        MatDatepickerModule,
        MatButtonModule,
        MatMenuModule,
        MatDividerModule,
        MatRadioModule,
        MatDialogModule,
        PortraitComponent
    ]
})
export class MenuFormDialogComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // EventEmitter to emit response data after create or update operations
    ResponseData = new EventEmitter<Data>();

    // Form related properties
    menuForm: UntypedFormGroup;

    // Flag to indicate whether the form is currently being saved
    saving: boolean = false;

    // Default image for the menu item
    src: string = 'icons/image.jpg';
    /** Stock ingredients for recipe lines */
    ingredients: IngredientItem[] = [];

    // Constructor with dependency injection
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { title: string, menu: Data, setup: any },
        private dialogRef: MatDialogRef<MenuFormDialogComponent>,
        private formBuilder: UntypedFormBuilder,
        private snackBarService: SnackbarService,
        private menuService: MenuService,
        private _ingredientService: MenuIngredientService,
    ) { }

    // ngOnInit method
    ngOnInit(): void {
        this.data.menu != null ? this.src = `${env.FILE_BASE_URL}${this.data.menu.image}` : '';
        this._ingredientService.getData().subscribe({
            next: (res) => (this.ingredients = res.data ?? []),
        });
        this.ngBuilderForm();
    }

    get recipeRows(): FormArray {
        return this.menuForm?.get('recipes') as FormArray;
    }

    addRecipeRow(): void {
        this.recipeRows.push(this._recipeGroup());
    }

    removeRecipeRow(index: number): void {
        this.recipeRows.removeAt(index);
    }

    private _recipeGroup(
        r?: { ingredient_id: number; quantity: number },
    ): UntypedFormGroup {
        return this.formBuilder.group({
            ingredient_id: [r?.ingredient_id ?? null, Validators.required],
            quantity: [
                r?.quantity ?? null,
                [Validators.required, Validators.min(0.0001)],
            ],
        });
    }

    private _buildPayload(): {
        code: string;
        name: string;
        type_id: number;
        image: string;
        unit_price: number;
        recipes: { ingredient_id: number; quantity: number }[];
    } | null {
        const raw = this.menuForm.getRawValue();
        const seen = new Set<number>();
        const lines = (raw.recipes ?? [])
            .filter(
                (row: { ingredient_id: number | null; quantity: number | null }) =>
                    row?.ingredient_id != null && Number(row.quantity) > 0,
            )
            .map((row: { ingredient_id: number; quantity: number }) => ({
                ingredient_id: Number(row.ingredient_id),
                quantity: Number(row.quantity),
            }));
        const recipes: { ingredient_id: number; quantity: number }[] = [];
        for (const line of lines) {
            if (seen.has(line.ingredient_id)) {
                this.snackBarService.openSnackBar('Duplicate ingredient in recipe; keep one row per ingredient.', GlobalConstants.error);
                return null;
            }
            seen.add(line.ingredient_id);
            recipes.push(line);
        }
        return { ...raw, recipes };
    }

    // srcChange method
    srcChange(base64: string): void {
        // Set the 'image' form control value with the provided base64 image data
        this.menuForm.get('image').setValue(base64);
    }

    onFileChange(event: any): void {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.src = e.target.result; // Preview image
                this.menuForm.get('image')?.setValue(e.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            this.snackBarService.openSnackBar('Please select an image file.', GlobalConstants.error);
        }
    }

    // ngBuilderForm method
    ngBuilderForm(): void {
        const existing = this.data?.menu?.recipes ?? [];
        const recipeArray = this.formBuilder.array(
            existing.length
                ? existing.map((r) => this._recipeGroup(r))
                : [],
        ) as FormArray;
        this.menuForm = this.formBuilder.group({
            code: [this.data?.menu?.code || null, [Validators.required]],
            name: [this.data?.menu?.name || null, [Validators.required]],
            type_id: [this.data?.menu?.type?.id || null, [Validators.required]],
            image: [null, this.data.menu == null ? Validators.required : []],
            unit_price: [this.data?.menu?.unit_price || null, [Validators.required]],
            recipes: recipeArray,
        });
    }

    // submit method
    submit() {
        // If data.menu is null, call create(); otherwise, call update()
        this.data.menu == null ? this.create() : this.update();
    }

    // create method
    create(): void {
        const body = this._buildPayload();
        if (!body) {
            return;
        }
        this.dialogRef.disableClose = true;
        this.saving = true;
        this.menuService.create(body).subscribe({

            next: response => {
                const result: Data = {
                    id: response.data.id,
                    code: response.data.code,
                    name: response.data.name,
                    image: response.data.image,
                    unit_price: response.data.unit_price,
                    total_sale: response.data.total_sale,
                    created_at: response.data.created_at,
                    type: {
                        id: response.data.type_id,
                        name: this.data.setup.find(v => v.id === response.data.type_id)?.name || ''
                    },
                    creator: {
                        id: response.data.creator.id,
                        name: response.data.creator.name,
                        avatar: response.data.creator.avatar || '',
                    },
                    recipes: (response.data as { recipes?: Data['recipes'] }).recipes,
                };
                this.ResponseData.emit(result);

                // Close the dialog
                this.dialogRef.close();

                // Set saving to false to indicate that the create operation is completed
                this.saving = false;

                // Show a success message using the snackBarService
                this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
            },

            error: (err: HttpErrorResponse) => {

                // Re-enable closing the dialog in case of an error
                this.dialogRef.disableClose = false;

                // Set saving to false to indicate that the create operation is completed (even if it failed)
                this.saving = false;

                // Extract error information from the response
                const errors: { type: string, message: string }[] | undefined = err.error?.errors;
                let message: string = err.error?.message ?? GlobalConstants.genericError;

                // If there are field-specific errors, join them into a single message
                if (errors && errors.length > 0) {
                    message = errors.map((obj) => obj.message).join(', ');
                }

                // Show an error message using the snackBarService
                this.snackBarService.openSnackBar(message, GlobalConstants.error);
            }
        });
    }

    // update method
    update(): void {
        const body = this._buildPayload();
        if (!body) {
            return;
        }
        this.dialogRef.disableClose = true;
        this.saving = true;
        this.menuService.update(this.data.menu.id, body).subscribe({

            next: response => {
                const result: Data = {
                    id: response.data.id,
                    code: response.data.code,
                    name: response.data.name,
                    image: response.data.image,
                    unit_price: response.data.unit_price,
                    total_sale: response.data.total_sale,
                    created_at: response.data.created_at,
                    type: {
                        id: response.data.type_id,
                        name: this.data.setup.find(v => v.id === response.data.type_id)?.name || ''
                    },
                    creator: {
                        id: response.data.creator.id,
                        name: response.data.creator.name,
                        avatar: response.data.creator.avatar || '',
                    },
                    recipes: (response.data as { recipes?: Data['recipes'] }).recipes,
                };
                this.ResponseData.emit(result);

                // Close the dialog
                this.dialogRef.close();

                // Set saving to false to indicate that the update operation is completed
                this.saving = false;

                // Show a success message using the snackBarService
                this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
            },

            error: (err: HttpErrorResponse) => {

                // Re-enable closing the dialog in case of an error
                this.dialogRef.disableClose = false;

                // Set saving to false to indicate that the update operation is completed (even if it failed)
                this.saving = false;

                // Extract error information from the response
                const errors: { type: string, message: string }[] | undefined = err.error?.errors;
                let message: string = err.error?.message ?? GlobalConstants.genericError;

                // If there are field-specific errors, join them into a single message
                if (errors && errors.length > 0) {
                    message = errors.map((obj) => obj.message).join(', ');
                }

                // Show an error message using the snackBarService
                this.snackBarService.openSnackBar(message, GlobalConstants.error);
            }
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    closeDialog() {
        this.dialogRef.close();
    }
}
