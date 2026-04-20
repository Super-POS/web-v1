// ================================================================>> Core Library
import { DatePipe, DecimalPipe, NgClass, NgIf } from '@angular/common';
import { HttpErrorResponse }    from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule }          from '@angular/forms';
import { RouterLink }           from '@angular/router';


// ===>> Third-Party Library
// angular party
import { MatButtonModule }      from '@angular/material/button';
import { MatDatepickerModule }  from '@angular/material/datepicker';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatIconModule }        from '@angular/material/icon';
import { MatInputModule }       from '@angular/material/input';
import { MatMenuModule }        from '@angular/material/menu';
import { MatPaginatorModule, PageEvent }        from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule }   from '@angular/material/table';
import FileSaver from 'file-saver';

// ===>> Custom Library
import { SharedDetailsComponent } from 'app/shared/dialog/component';
import { DetailsService } from 'app/shared/dialog/service';
import { ViewDetailSaleComponent } from 'app/shared/view/component';
import { env } from 'envs/env';
import { HelperConfirmationConfig, HelperConfirmationService } from 'helper/services/confirmation';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { FilterSaleComponent } from './filter/component';
import { SaleService } from './service';
import { Data, List } from './interface';

// Component decorator specifying metadata for the component
@Component({
    selector: 'app-sale',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        MatTableModule,
        NgClass,
        NgIf,
        DatePipe,
        DecimalPipe,
        FormsModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatPaginatorModule,
        MatMenuModule,
        RouterLink
    ]
})
export class SaleComponent implements OnInit {

    constructor(
        private saleService: SaleService,
        private snackBarService: SnackbarService,
        private detailsService: DetailsService,
        private cdr: ChangeDetectorRef,
        private dialog: MatDialog
    ) { }

    // Component properties
    displayedColumns: string[] = ['no', 'receipt', 'price', 'ordered_at', 'ordered_at_time', 'device', 'seller', 'action'];
    dataSource: MatTableDataSource<Data> = new MatTableDataSource<Data>([]);

    fileUrl: string = env.FILE_BASE_URL;
    total: number = 10;
    limit: number = 10;
    page: number = 1;
    receipt_number: string = '';
    isLoading: boolean = false;
    key: string = '';
    setup: { id: number, name: string }[] = [];

    // ngOnInit, called after the component is initialized
    ngOnInit(): void {
        this.getData(this.page, this.limit);
        this.initSetup();
    }

    // Method to retrieve a list of sales based on provided parameters
    getData(
        _page: number = 1,
        _page_size: number = 10,
        filter_data: { timeType?: string; platform?: string; cashier?: number; startDate?: string; endDate?: string } = {}
    ): void {
        const params: {
            page: number;
            page_size: number;
            key?: string;
            timeType?: string;
            platform?: string;
            cashier?: number;
            startDate?: string;
            endDate?: string;
        } = {
            page: _page,
            page_size: _page_size,
            ...filter_data // Spread operator to add filters dynamically
        };

        if (this.key !== '') {
            params.key = this.key;
        }

        this.isLoading = true;

        this.saleService.getData(params).subscribe({
            next: (res: List) => {
                this.dataSource.data = res.data ?? [];
                this.total = res.pagination.totalItems;
                this.limit = res.pagination.perPage;
                this.page = res.pagination.currentPage;
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                this.snackBarService.openSnackBar(
                    err.error?.message ?? GlobalConstants.genericError,
                    GlobalConstants.error
                );
            }
        });
    }

    // Method to handle page changes in the data table paginator
    onPageChanged(event: PageEvent): void {
        if (event && event.pageSize) {
            this.limit = event.pageSize;
            this.page = event.pageIndex + 1;
            this.getData(this.page, this.limit);
        }
    }

    // Injecting the MatDialog service
    private matDialog = inject(MatDialog)

    // Method to open a dialog to view details of a sale
    view(row: Data): void {

        const dialogConfig = new MatDialogConfig();
        dialogConfig.data = row;
        dialogConfig.width = "650px";
        dialogConfig.minHeight = "200px";
        dialogConfig.autoFocus = false;
        this.matDialog.open(SharedDetailsComponent, dialogConfig);
    }

    // Method to open a dialog to view details of a sale
    viewDetail(row: Data): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';
        dialogConfig.data = row
        const dialogRef = this.matDialog.open(ViewDetailSaleComponent, dialogConfig);
    }

    // Property to store the filter data
    filter_data: { timeType: string; platform: string; cashier: number; startDate: string; endDate: string };
    initSetup(): void {
        this.saleService.setup().subscribe({
            next: response => this.setup = response.data,
        });
    }

    // Method to open the filter dialog
    openFilterDialog(): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.autoFocus = false;
        dialogConfig.data = this.setup
        dialogConfig.restoreFocus = false; // Avoids focus issues
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';

        const dialogRef = this.dialog.open(FilterSaleComponent, dialogConfig);

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.filter_data = result;
                console.log(this.filter_data)
                this.cdr.detectChanges();
                this.getData(1, 10, this.filter_data);
            }
        });
    }   

    // Injecting the HelperConfirmationService service
    private helpersConfirmationService = inject(HelperConfirmationService)
    // Method to handle the deletion of a sale
    onDelete(sale: Data): void {

        // Building the confirmation dialog configuration
        const configAction: HelperConfirmationConfig = {

            title: `Remove <strong> ${sale.receipt_number} </strong>`,
            message: 'Are you sure you want to remove this receipt number permanently? <span class="font-medium">This action cannot be undone!</span>',
            icon: ({
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn',
            }),

            actions: {
                confirm: {
                    show: true,
                    label: 'Remove',
                    color: 'warn',
                },
                cancel: {
                    show: true,
                    label: 'Cancel',
                },
            },
            dismissible: true,
        };

        // Opening the confirmation dialog and saving the reference
        const dialogRef = this.helpersConfirmationService.open(configAction);

        // Subscribe to afterClosed from the dialog reference
        dialogRef.afterClosed().subscribe((result: string) => {

            if (result && typeof result === 'string' && result === 'confirmed') {
                // The user confirmed the action

                this.saleService.delete(sale.id).subscribe({

                    next: (response: { status_code: number, message: string }) => {

                        // Successful deletion
                        // Update the data source to reflect the deletion
                        this.dataSource.data = this.dataSource.data.filter((v: Data) => v.id != sale.id);
                        this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
                        this.getData()
                    },
                    error: (err: HttpErrorResponse) => {
                        this.snackBarService.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
                    }
                });
            }
        });
    }

    // Property to track the state of downloading
    downloading: boolean = false;

    // Method to initiate the download of a sale invoice
    print(row: Data) {

        this.downloading = true;

        // Calling the details service to download the invoice
        this.detailsService.download(row.receipt_number).subscribe({

            next: res => {

                this.downloading = false;
                let blob = this.b64toBlob(res.data, 'application/pdf');
                FileSaver.saveAs(blob, 'Invoice-' + row.receipt_number + '.pdf');
            },
            error: (err: HttpErrorResponse) => {
                this.snackBarService.openSnackBar(err.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            }
        });
    }

    // ===>> // Method to convert base64 data to a blob
    b64toBlob(b64Data: string, contentType: string, sliceSize?: number) {

        // Set default values for optional parameters
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(b64Data);         // Decode the base64 string into binary data
        var byteArrays = [];                    // Initialize an array to hold Uint8Arrays

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {

            // Extract a chunk of data
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            // Convert the binary data to an array of numeric byte values
            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            // Create a Uint8Array from the numeric byte values
            var byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);               // Add the Uint8Array to the array of arrays
        }

        // Create a Blob object from the array of Uint8Arrays
        var blob = new Blob(byteArrays, { type: contentType });
        return blob;
    }
}
