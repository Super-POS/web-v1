import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

import { env } from 'envs/env';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { Subject } from 'rxjs';

import { Ingredient, RecipeItem, SetupResponse } from '../interface';
import { ProductService } from '../service';

@Component({
    selector: 'app-menu-create',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatOptionModule,
    ],
})
export class MenuCreateComponent implements OnInit, OnDestroy {
    private _unsubscribeAll = new Subject<void>();

    productForm!: UntypedFormGroup;
    saving = false;
    src = 'icons/image.jpg';
    setupLoading = true;
    setup: SetupResponse = { productTypes: [], users: [], ingredients: [] };
    recipeRows: { ingredient_id: number | null; qty_required: number | null; ingredient?: Ingredient }[] = [];

    constructor(
        private formBuilder: UntypedFormBuilder,
        private snackBarService: SnackbarService,
        private productService: ProductService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.productService.getSetupData().subscribe({
            next: (res) => {
                this.setup = {
                    productTypes: res.productTypes || [],
                    users: res.users || [],
                    ingredients: res.ingredients || [],
                };
                this.setupLoading = false;
                this.recipeRows = [];
                this.addRecipeRow();
                this.ngBuilderForm();
            },
            error: () => {
                this.setupLoading = false;
                this.snackBarService.openSnackBar(GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    resolveImagePreview(imagePath: string): string {
        if (!imagePath) {
            return 'icons/image.jpg';
        }
        if (/^https?:\/\//i.test(imagePath)) {
            return imagePath;
        }
        return `${env.FILE_BASE_URL}${imagePath}`;
    }

    addRecipeRow(): void {
        this.recipeRows.push({ ingredient_id: null, qty_required: null });
    }

    removeRecipeRow(index: number): void {
        this.recipeRows.splice(index, 1);
        if (this.recipeRows.length === 0) {
            this.addRecipeRow();
        }
    }

    getRecipePayload(): RecipeItem[] {
        return this.recipeRows
            .map((row) => ({
                ingredient_id: Number(row.ingredient_id),
                qty_required: Number(row.qty_required),
            }))
            .filter((row) => row.ingredient_id > 0 && row.qty_required > 0);
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                const result = e.target?.result as string;
                this.src = result;
                this.productForm.get('image')?.setValue(result);
            };
            reader.readAsDataURL(file);
        } else {
            this.snackBarService.openSnackBar('Please select an image file.', GlobalConstants.error);
        }
    }

    ngBuilderForm(): void {
        this.productForm = this.formBuilder.group({
            code: [null, [Validators.required]],
            name: [null, [Validators.required]],
            type_id: [null, [Validators.required]],
            image: [null, [Validators.required]],
            unit_price: [null, [Validators.required]],
            stock: [0, [Validators.required, Validators.min(0)]],
        });
    }

    cancel(): void {
        void this.router.navigate(['/admin/product/all']);
    }

    submit(): void {
        if (this.productForm.invalid) {
            return;
        }
        this.saving = true;
        const payload = {
            code: this.productForm.value.code,
            name: this.productForm.value.name,
            type_id: this.productForm.value.type_id,
            image: this.productForm.value.image,
            unit_price: this.productForm.value.unit_price,
        };
        this.productService.create(payload).subscribe({
            next: (response) => {
                this.saving = false;
                this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
                void this.router.navigate(['/admin/product/all']);
            },
            error: (err: HttpErrorResponse) => {
                this.saving = false;
                const errors: { type: string; message: string }[] | undefined = err.error?.errors;
                let message: string = err.error?.message ?? GlobalConstants.genericError;
                if (errors && errors.length > 0) {
                    message = errors.map((obj) => obj.message).join(', ');
                }
                this.snackBarService.openSnackBar(message, GlobalConstants.error);
            },
        });
    }
}
