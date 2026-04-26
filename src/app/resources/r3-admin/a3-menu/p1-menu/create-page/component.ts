import { AsyncPipe, CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { env } from 'envs/env';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { MenuService } from '../service';
import { MenuIngredientService } from '../../p3-ingredient/service';
import { IngredientItem } from '../../p3-ingredient/interface';

@Component({
    selector: 'app-menu-create-page',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
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
        MatRadioModule
    ]
})
export class MenuCreatePageComponent implements OnInit {
    private formBuilder = inject(UntypedFormBuilder);
    private snackBarService = inject(SnackbarService);
    private menuService = inject(MenuService);
    private _ingredientService = inject(MenuIngredientService);
    private router = inject(Router);

    menuForm: UntypedFormGroup;
    saving = false;
    src = 'icons/image.jpg';
    setup: any[] = [];
    ingredients: IngredientItem[] = [];
    fileUrl: string = env.FILE_BASE_URL;

    ngOnInit(): void {
        this.menuForm = this.formBuilder.group({
            code: [null, [Validators.required]],
            name: [null, [Validators.required]],
            type_id: [null, [Validators.required]],
            image: [null, [Validators.required]],
            unit_price: [null, [Validators.required]],
            recipes: this.formBuilder.array([]) as FormArray,
        });

        this.loadSetup();
        this._ingredientService.getData().subscribe({
            next: (res) => (this.ingredients = res.data ?? []),
        });
    }

    get recipeRows(): FormArray {
        return this.menuForm.get('recipes') as FormArray;
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

    private _buildPayload() {
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

    loadSetup(): void {
        this.menuService.getSetupData().subscribe({
            next: (res: any) => {
                this.setup = res?.productTypes ?? res?.menuTypes ?? [];
            },
            error: (err: HttpErrorResponse) => {
                this.snackBarService.openSnackBar(
                    err?.error?.message || GlobalConstants.genericError,
                    GlobalConstants.error
                );
            }
        });
    }

    onFileChange(event: any): void {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.src = e.target.result;
                this.menuForm.get('image')?.setValue(e.target.result);
            };
            reader.readAsDataURL(file);
            return;
        }

        this.snackBarService.openSnackBar('Please select an image file.', GlobalConstants.error);
    }

    submit(): void {
        if (this.menuForm.invalid || this.saving) return;
        const body = this._buildPayload();
        if (!body) return;

        this.saving = true;
        this.menuService.create(body).subscribe({
            next: (response) => {
                this.saving = false;
                this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
                this.router.navigate(['/admin/menu/all']);
            },
            error: (err: HttpErrorResponse) => {
                this.saving = false;
                const errors: { type: string; message: string }[] | undefined = err.error?.errors;
                let message: string = err.error?.message ?? GlobalConstants.genericError;
                if (errors && errors.length > 0) {
                    message = errors.map((obj) => obj.message).join(', ');
                }
                this.snackBarService.openSnackBar(message, GlobalConstants.error);
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/admin/menu/all']);
    }
}
