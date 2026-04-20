
// ==========================================================================================================>> Core Library
import { CommonModule }                                                                         from '@angular/common';
import { Component, EventEmitter, OnInit }                                                      from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators }   from '@angular/forms';
import { RouterModule }                                                                         from '@angular/router';

// ============================================================================================================>> Thrid Party Library
// Material
import { HttpErrorResponse }                                from '@angular/common/http';
import { MatAutocompleteModule }                            from '@angular/material/autocomplete';
import { MatButtonModule }                                  from '@angular/material/button';
import { MatOptionModule }                                  from '@angular/material/core';
import { MatDatepickerModule }                              from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef }                    from '@angular/material/dialog';
import { MatDividerModule }                                 from '@angular/material/divider';
import { MatFormFieldModule }                               from '@angular/material/form-field';
import { MatIconModule }                                    from '@angular/material/icon';
import { MatInputModule }                                   from '@angular/material/input';
import { MatMenuModule }                                    from '@angular/material/menu';
import { MatProgressSpinnerModule }                         from '@angular/material/progress-spinner';
import { MatRadioModule }                                   from '@angular/material/radio';
import { MatSelectModule }                                  from '@angular/material/select';
import { MatTooltipModule }                                 from '@angular/material/tooltip';

// =============================================================================================================>> Custom Library
// Helper
import { SnackbarService }                                  from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants                                      from 'helper/shared/constants';

import { ProductTypeService }                               from '../service';
import { Item }                                             from '../interface';

@Component({
    selector    : 'create-product-type',
    templateUrl : './template.html',
    styleUrls   : ['./style.scss'],
    standalone  : true,
    imports: [
        RouterModule,
        FormsModule,
        MatIconModule,
        CommonModule,
        ReactiveFormsModule,

        MatTooltipModule,
        MatProgressSpinnerModule,
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
    ]
})
export class CreateDialogComponent implements OnInit {

    // Response back to parent component.
    public resData          = new EventEmitter<Item>();
    public form             : UntypedFormGroup;
    public isSaving         : boolean = false;
    public defaultImageUri  : string = 'icons/image.jpg';

    // Constructor with dependency injection
    constructor(

        private _dialogRef          : MatDialogRef<CreateDialogComponent>,
        private _formBuilder        : UntypedFormBuilder, // Build form for getting data from teplate
        private _snackBarService    : SnackbarService, // Display quick message
        private _service            : ProductTypeService // for calling API

    ) { }

    // Lifecycle hook: ngOnInit
    ngOnInit(): void {

        // Initialize the form on component initialization
        this.ngBuilderForm();

    }

    // Method to build the form using the form builder
    ngBuilderForm(): void {

        // Create the form group with initial values
        this.form = this._formBuilder.group({
            name    : [null, [Validators.required]],
            image   : [null, [Validators.required]],
        });
    }

    // Method to handle form submission
    submit() {

        // Disable dialog close while the operation is in progress
        this._dialogRef.disableClose = true;

        // Set the saving flag to true to indicate that the operation is in progress
        this.isSaving = true;

        // Call the typeService to create a new type
        this._service.create(this.form.value).subscribe({

            next: response => {

                // Update the number of products (assuming it's a property of the returned data)
                response.data.n_of_products = 0;

                // Emit the response data using the EventEmitter
                this.resData.emit(response.data);

                // Reset the saving flag
                this.isSaving = false;

                // Display a success snackbar
                this._snackBarService.openSnackBar(response.message, GlobalConstants.success);

                // Close the dialog
                this._dialogRef.close();


            },

            error: (err: HttpErrorResponse) => {

                // Re-enable dialog close
                this._dialogRef.disableClose = false;

                // Stop loading
                this.isSaving = false;

            }
        });
    }


    onFileChange(event: any): void {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e: any) => {

                this.defaultImageUri = e.target.result; // Preview image
                this.form.get('image')?.setValue(e.target.result);

            };
            reader.readAsDataURL(file);
        } else {
            this._snackBarService.openSnackBar('Please select an image file.', GlobalConstants.error);
        }
    }


    closeDialog() {
        this._dialogRef.close();
    }
}
