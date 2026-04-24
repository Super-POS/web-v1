
// ================================================================================>> Core Library
import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
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
import { ProductService } from '../service';
@Component({
    selector: 'car-product-dialog-create-and-update',
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
export class ProductsDialogComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // EventEmitter to emit response data after create or update operations
    ResponseData = new EventEmitter<Data>();

    // Form related properties
    productForm: UntypedFormGroup;

    // Flag to indicate whether the form is currently being saved
    saving: boolean = false;

    // Default image source for the product (assuming a default image is used)
    src: string = 'icons/image.jpg';

    // Constructor with dependency injection
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { title: string, product: Data, setup: any },
        private dialogRef: MatDialogRef<ProductsDialogComponent>,
        private formBuilder: UntypedFormBuilder,
        private snackBarService: SnackbarService,
        private productService: ProductService
    ) { }

    // ngOnInit method
    ngOnInit(): void {
        // Set the image source based on the product data (if available)
        this.data.product != null ? this.src = `${env.FILE_BASE_URL}${this.data.product.image}` : '';
        // Initialize the form builder
        this.ngBuilderForm();
    }

    // srcChange method
    srcChange(base64: string): void {
        // Set the 'image' form control value with the provided base64 image data
        this.productForm.get('image').setValue(base64);
    }

    onFileChange(event: any): void {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.src = e.target.result; // Preview image
                this.productForm.get('image')?.setValue(e.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            this.snackBarService.openSnackBar('Please select an image file.', GlobalConstants.error);
        }
    }

    // ngBuilderForm method
    ngBuilderForm(): void {
        // Use the form builder to create the productForm with default values from the data
        this.productForm = this.formBuilder.group({
            code: [this.data?.product?.code || null, [Validators.required]],
            name: [this.data?.product?.name || null, [Validators.required]],
            type_id: [this.data?.product?.type?.id || null, [Validators.required]],
            image: [null, this.data.product == null ? Validators.required : []],
            unit_price: [this.data?.product?.unit_price || null, [Validators.required]]
        });
    }

    // submit method
    submit() {
        // If data.product is null, call create(); otherwise, call update()
        this.data.product == null ? this.create() : this.update();
    }

    // create method
    create(): void {
        // Disable closing the dialog during the create process
        this.dialogRef.disableClose = true;

        // Set saving to true to indicate that the create operation is in progress
        this.saving = true;
        // Call the productService.create method to create a new product
        this.productService.create(this.productForm.value).subscribe({

            next: response => {

                // Transform the response data into the format expected by the parent component
                const product: Data = {

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
                };


                // Emit the created product data to the parent component
                this.ResponseData.emit(product);

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

        // Disable closing the dialog during the update process
        this.dialogRef.disableClose = true;

        // Set saving to true to indicate that the update operation is in progress
        this.saving = true;
        // Call the productService.update method to update an existing product
        this.productService.update(this.data.product.id, this.productForm.value).subscribe({

            next: response => {

                // Transform the response data into the format expected by the parent component
                const product: Data = {

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
                };

                // Emit the updated product data to the parent component
                this.ResponseData.emit(product);

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
