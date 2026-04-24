import { AsyncPipe, CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
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
import { ProductService } from '../service';

@Component({
    selector: 'app-product-create-page',
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
export class ProductCreatePageComponent implements OnInit {
    private formBuilder = inject(UntypedFormBuilder);
    private snackBarService = inject(SnackbarService);
    private productService = inject(ProductService);
    private router = inject(Router);

    productForm: UntypedFormGroup;
    saving = false;
    src = 'icons/image.jpg';
    setup: any[] = [];
    fileUrl: string = env.FILE_BASE_URL;

    ngOnInit(): void {
        this.productForm = this.formBuilder.group({
            code: [null, [Validators.required]],
            name: [null, [Validators.required]],
            type_id: [null, [Validators.required]],
            image: [null, [Validators.required]],
            unit_price: [null, [Validators.required]]
        });

        this.loadSetup();
    }

    loadSetup(): void {
        this.productService.getSetupData().subscribe({
            next: (res: any) => {
                this.setup = res?.productTypes ?? [];
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
                this.productForm.get('image')?.setValue(e.target.result);
            };
            reader.readAsDataURL(file);
            return;
        }

        this.snackBarService.openSnackBar('Please select an image file.', GlobalConstants.error);
    }

    submit(): void {
        if (this.productForm.invalid || this.saving) return;

        this.saving = true;
        this.productService.create(this.productForm.value).subscribe({
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
