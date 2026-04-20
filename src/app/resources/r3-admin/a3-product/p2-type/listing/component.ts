// ================================================================>> Core Library (Angular)
import { DatePipe, DecimalPipe, NgClass, NgIf }                 from '@angular/common';
import { HttpErrorResponse }                                    from '@angular/common/http';
import { Component, OnInit, inject }                            from '@angular/core';

// ================================================================>> Third Party Library (Angular Material)
import { MatButtonModule }                                      from '@angular/material/button';
import { MatDialog, MatDialogConfig }                           from '@angular/material/dialog';
import { MatIconModule }                                        from '@angular/material/icon';
import { MatMenuModule }                                        from '@angular/material/menu';
import { MatTableDataSource, MatTableModule }                   from '@angular/material/table';

// ================================================================>> Custom Library
import { env }                                                  from 'envs/env';
import { HelperConfirmationConfig, HelperConfirmationService }  from 'helper/services/confirmation';
import { SnackbarService }                                      from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants                                          from 'helper/shared/constants';

import { CreateDialogComponent }                                from '../create-dialog/component';
import { UpdateDialogComponent }                                from '../update-dialog/component';
import { ProductTypeService }                                   from '../service';
import { Data, Item }                                           from '../interface';

@Component({
    selector                                                    : 'product-type',
    standalone                                                  : true,
    templateUrl                                                 : './template.html',
    styleUrl                                                    : './style.scss',
    imports: [
        MatTableModule,
        NgClass,
        NgIf,
        DecimalPipe,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        DatePipe,
    ]
})

export class ProductTypeComponent implements OnInit {


    // ===>> Variable Declaration
    private _service                                            = inject(ProductTypeService); // for calling to API
    private _snackBarService                                    = inject(SnackbarService); // for display quick message
    private _helpersConfirmationService                         = inject(HelperConfirmationService); // for Confirmation
    private _matDialog                                          = inject(MatDialog); // Dialog

    public displayedColumns                                     : string[] = ['no', 'name', 'n_of_products', 'created_at', 'action'];
    public dataSource                                           : MatTableDataSource<Item> = new MatTableDataSource<Item>([]);

    public fileUrl                                              : string = env.FILE_BASE_URL; // Assuming this is the base URL for file-related operations
    public isLoading                                            : boolean  = false;

    // ===>> First Fuction to call
    ngOnInit(): void {

        this.getData();
        // this.openCreateDialog();
    }

    getData(){

        this.isLoading                                          = true;
        this._service.getData().subscribe({

            next: (res: Data) => {

                // Update the data source with the received data
                this.dataSource.data                            = res.data;

                // Set isLoading to false to indicate that data loading is complete
                this.isLoading                                  = false;
            },

            error: (err: HttpErrorResponse) => {

                // Display a snackbar notification with an error message, falling back to a generic error message if not available
                this._snackBarService.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);

                // Set isLoading to false to indicate that data loading is complete
                this.isLoading                                  = false;

            }
        });
    }

    openCreateDialog(): void {

        // Create a new MatDialogConfig to configure the appearance and behavior of the dialog
        const dialogConfig                                      = new MatDialogConfig();
        dialogConfig.autoFocus                                  = false;
        dialogConfig.position                                   = { right: '0px' };
        dialogConfig.height                                     = '100dvh';
        dialogConfig.width                                      = '100dvw';
        dialogConfig.maxWidth                                   = '550px';
        dialogConfig.panelClass                                 = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration                     = '0s';

        // Open the dialog with ProductTypeDialogComponent as the content component and apply the configuration
        const dialogRef                                         = this._matDialog.open(CreateDialogComponent, dialogConfig);

        // Subscribe to the resData observable in the ProductTypeDialogComponent
        dialogRef.componentInstance.resData.subscribe((res: Item) => {

            // Get the current data from the data source
            const data                                          = this.dataSource.data;

            // Push the new type data to the data array
            data.push(res);

            // Update the data source with the modified data
            this.dataSource.data                                = data;
        });
    }

    openUpdateDialog(item: Item, index: number = 0): void {

        // Create a new MatDialogConfig to configure the appearance and behavior of the dialog
        const dialogConfig                                      = new MatDialogConfig();
        dialogConfig.autoFocus                                  = false;
        dialogConfig.position                                   = { right: '0px' };
        dialogConfig.height                                     = '100dvh';
        dialogConfig.width                                      = '100dvw';
        dialogConfig.maxWidth                                   = '550px';
        dialogConfig.panelClass                                 = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration                     = '0s';

        dialogConfig.data = item; // send current data to dialog;

        // Open the dialog with ProductTypeDialogComponent as the content component and apply the configuration
        const dialogRef                                         = this._matDialog.open(UpdateDialogComponent, dialogConfig);

        // Subscribe to the resData observable in the ProductTypeDialogComponent
        dialogRef.componentInstance.resData.subscribe((res: Item) => {

            // Get the current data from the data source
            const data                                          = this.dataSource.data;

            // Replace the current index
            data[index] = res;

            // Update the data source with the modified data
            this.dataSource.data                                = data;

        });

    }

    onDelete(type: Item): void {

        // Build the configuration for the confirmation dialog
        const configAction: HelperConfirmationConfig = {

            title                                               : `លុប <strong> ${type.name} </strong>`,
            message                                             : 'តើអ្នកប្រាកដថាចង់លុបលេខបង្កាន់ដៃនេះចេញជាអចិន្ត្រៃយ៍ទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ!</span>', // Confirmation message

            icon: {

                show                                            : true,
                name                                            : 'heroicons_outline:exclamation-triangle',
                color                                           : 'warn',
            },

            actions: {

                confirm: {

                    show                                        : true,
                    label                                       : 'លុប',
                    color                                       : 'warn',
                },

                cancel: {

                    show                                        : true,
                    label                                       : 'បោះបង',
                },
            },
            dismissible                                         : true,
        };

        // Open the confirmation dialog and save the reference
        const dialogRef                                         = this._helpersConfirmationService.open(configAction);

        // Subscribe to the afterClosed event of the dialog reference
        dialogRef.afterClosed().subscribe((result: string) => {

            // Check if the user confirmed the action
            if (result && typeof result === 'string' && result === 'confirmed') {

                // Call the delete method from the service to remove the type
                this._service.delete(type.id).subscribe({

                    next: (response: { status_code: number, message: string }) => {

                        // If successful, filter the deleted type from the data source
                        this.dataSource.data                    = this.dataSource.data.filter((v: Item) => v.id != type.id);
                        // Display a success message using the snackbar service
                        this._snackBarService.openSnackBar(response.message, GlobalConstants.success);
                    },
                    error: (err: HttpErrorResponse) => {

                        // Handle errors by displaying an error message using the snackbar service
                        this._snackBarService.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
                    }
                });
            }
        });
    }

    getTotal(): number {
        // Use map to extract the 'n_of_products' property from each item in the dataSource
        return this.dataSource.data.map(t => t.n_of_products)
            // Use reduce to sum up all the extracted values
            .reduce((acc, value) => Number(acc) + Number(value), 0);
    }
}
