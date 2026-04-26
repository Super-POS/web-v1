// ================================================================>> Core Library (Angular)
import { CommonModule, DatePipe, DecimalPipe, NgClass, NgIf }  from '@angular/common';
import { HttpErrorResponse }                                   from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject }        from '@angular/core';
import { FormsModule }                                         from '@angular/forms';
import { Router }                                              from '@angular/router';

// ================================================================>> Angular Material Modules
import { MatButtonModule }                                     from '@angular/material/button';
import { MatDialog, MatDialogConfig }                          from '@angular/material/dialog';
import { MatFormFieldModule }                                  from '@angular/material/form-field';
import { MatIconModule }                                       from '@angular/material/icon';
import { MatMenuModule }                                       from '@angular/material/menu';
import { MatPaginatorModule, PageEvent }                       from '@angular/material/paginator';
import { MatSelectModule }                                     from '@angular/material/select';
import { MatTableDataSource, MatTableModule }                  from '@angular/material/table';

// ================================================================>> Custom Library (Application-specific)
import { env }                                                  from 'envs/env';
import FileSaver                                                from 'file-saver';
import { HelperConfirmationConfig, HelperConfirmationService }  from 'helper/services/confirmation';
import { SnackbarService }                                      from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants                                          from 'helper/shared/constants';

import { DialogConfigService }                                  from 'app/shared/dialog-config.service';
import { ErrorHandleService }                                   from 'app/shared/error-handle.service';
import { MatBadgeModule }                                       from '@angular/material/badge';
import { MenuService } from './service';
import { Data, List } from './interface';
import { FilterDialogComponent } from './filter-dialog/component';
import { ViewDialogComponent } from './view-dialog/component';
import { MenuFormDialogComponent } from './create-dialog/component';
import { resolveFileUrl } from 'helper/utils/resolve-file-url';

@Component({
    selector: 'app-menu-list',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        CommonModule,
        MatTableModule,
        NgClass,
        NgIf,
        DatePipe,
        DecimalPipe,
        FormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatIconModule,
        MatButtonModule,
        MatPaginatorModule,
        MatMenuModule,
        MatBadgeModule,
    ]
})

export class MenuListComponent implements OnInit {

    // Injecting necessary services
    private _service = inject(MenuService);

    private snackBarService = inject(SnackbarService);
    private router = inject(Router);
    // Create / edit menu via dialog
    private matDialog = inject(MatDialog);
    public data: Data[] = [];
    public setupData        : any     = {};
    // Component properties
    displayedColumns: string[] = [
        'no',
        'menu',
        'price',
        'total_sale',
        'total_sale_price',
        'created',
        'seller',
        'action'
    ];


    dataSource: MatTableDataSource<Data> = new MatTableDataSource<Data>([]);

    fileUrl: string = env.FILE_BASE_URL;

    /** Resolves `FILE_BASE_URL` + API path, or returns absolute URLs as-is. */
    mediaUrl(path: string | null | undefined): string {
        return resolveFileUrl(this.fileUrl, path);
    }

    public total                   :   number         = 0;
    public limit                   :   number         = 20;
    public page                    :   number         = 1;
    public isLoading               :   boolean        = false;

    // Search,sort and filter
    public key                     :   string         = '';
    public type_id                 :   number         = 0;
    public name                    :   string         = '';
    public users                   :   number         = 0;
    public productTypes            :   number         = 0;
    public creator                 :   number         = 0;


    public shortedItems: any[] = [
        { name: 'ឈ្មោះម៉ឺនុយ' , value: 'name' },
        { name: 'តម្លៃ(រៀល)'   , value: 'unit_price' },
        { name: 'តម្លៃលក់(រៀល)' , value: 'total_sale' },
    ];

    public selectedShortedItem     :  any             = this.shortedItems[0];
    public shortedOrder            :  string          = 'desc';


    badgeValue: any;
      // ===>> Download Report Type
    public report_type          : string = '';

    // Constructor
    constructor(
        private cdr                         : ChangeDetectorRef,
        private _matDialog                  : MatDialog,
        private _errorHandleService         : ErrorHandleService,
        private _dialogConfigService        : DialogConfigService,

    ) { }

    // Initialization logic

    ngOnInit(): void {
        this.getSetupData();
        this.getData();
    }

    // ===>> Get Setup Data for Filtering
    getSetupData(): void {
        // ===>> Call API
        this._service.getSetupData().subscribe({
            next: (res:any) => {
                this.setupData = res;
            },
            error: (err) => {
                this._errorHandleService.handleHttpError(err);
            },
        });
    }


    // ===>> Get Data for Listing
    getData(){;

        // ===>> Set Loading UI
        this.isLoading = true;

        // ===>> Get Filter
        const params = this.prepareSearchSortFilterParam();

        this._service.getData(params).subscribe({
            next: (res: List) => {
                this.dataSource.data = res.data;
                this.total = res.pagination.total;
                this.limit = res.pagination.limit;
                this.page = res.pagination.page;
                this.isLoading = false;
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this.snackBarService.openSnackBar(
                    err?.error?.message || GlobalConstants.genericError,
                    GlobalConstants.error
                );
            }
        });

    }

    prepareSearchSortFilterParam(): any {
        const params: any = {
            limit: this.limit,
            page: this.page > 0 ? this.page : 1, // Ensure page starts from 1
            sort_by: this.selectedShortedItem.value,
            order: this.shortedOrder,
        };

        if (this.key != '') {
            params.key = this.key; // Search keyword
        }

        if (this.productTypes) {
            params.type = this.productTypes; // Menu category filter
        }

        if (this.users) {
            params.creator = this.users; // Use only creator
        }

        if(this.report_type != ''){
            params.report_type = this.report_type
        }


        // Sort options
        params.sort_by = this.selectedShortedItem.value;
        params.order = this.shortedOrder;

        return params;
    }


    // ===>> Select Short Item
    selectShortedItem(item = {}){
        this.selectedShortedItem = item;
        this.getData();
    }

    // ===>> Select Short Order
    selectShortOrder(){

        // Mapping the data
        this.shortedOrder = this.shortedOrder == 'desc' ? 'asc' : 'desc';

        // refresh data
        this.getData();

    }


     // ===>> Clear Short Filter
     clearFilter(): void{

        // Set all filters to 0
        // this.users              = 0;
        // this.productTypes       = 0;
        this.badgeValue         = 0;

        // Refresh Data
        this.getData();
    }

    // ===>> Open Filter Dialog

    openFilterDialog(): void {

        const dialogConfig = this._dialogConfigService.getDialogConfig({
            setup: this.setupData,
            filter: {
                productTypes             : this.productTypes,
                users                    : this.users  ,
            }
        });

        const dialogRef = this._matDialog.open(FilterDialogComponent, dialogConfig);

        dialogRef.componentInstance.filterSubmitted.subscribe((res: any) => {

            // Count filter selected from the Filter Dialog
            const nullOrEmptyCount = Object.values(res).filter(value => value === null || value === 0).length;
            this.badgeValue = Object.keys(res).length - nullOrEmptyCount;

            // Map Filter
            this.productTypes      = res.productTypes;
            this.users             = res.users;

            // ===>> Refresh Data
            this.getData();
        });
    }


     // ===>> Pagination chagne for Next or Prevous
    onPageChanged(event: PageEvent): void {

        this.limit  =   event.pageSize;
        this.page   =   event.pageIndex + 1;


        this.getData();
    }

    // ===>> Create new menu item
    create(): void {
        this.router.navigate(['/admin/menu/create']);
    }

    // View menu detail
    view(element: Data) {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '750px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';
        dialogConfig.data = element
        const dialogRef = this.matDialog.open(ViewDialogComponent, dialogConfig);
    }

    // Edit menu in dialog
    update(row: Data): void {

        const dialogConfig = new MatDialogConfig();
        dialogConfig.data = {

            title: 'កែប្រែម៉ឺនុយ',
            menu: row,
            setup: this.setupData.productTypes
        };

        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';
        const dialogRef = this.matDialog.open(MenuFormDialogComponent, dialogConfig);

        dialogRef.componentInstance.ResponseData.subscribe((rowResult: Data) => {

            const index = this.dataSource.data.indexOf(row);
            const data = this.dataSource.data;
            data[index] = rowResult;
            this.getData()
            this.dataSource.data = data;
        });
    }

    // // Downloading a product report
    // isaving: boolean = false;
    // // Download product report
    // getReport(type: string = 'PDF') {
    //     this.report_type = type;

    //     const params = this.prepareSearchSortFilterParam();
    //     this.isaving = true;

    //     this._service.getDataMenuReport(params).subscribe({
    //         next: (response) => {
    //             this.isaving = false;

    //             let fileName: string;
    //             let blob: Blob | null;

    //             if (type === 'PDF') {
    //                 blob = this.b64toBlob(response.data, 'application/pdf');
    //                 fileName = 'របាយការណ៍លក់តាមការផលិតផល.pdf';
    //             } else if (type === 'EXCEL') {
    //                 blob = this.b64toBlob(response.data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    //                 fileName = 'របាយការណ៍លក់តាមផលិតផល.xlsx';
    //             } else {
    //                 console.error('Invalid report type:', type);
    //                 return;
    //             }

    //             if (blob) {
    //                 FileSaver.saveAs(blob, fileName);
    //                 this.snackBarService.openSnackBar('របាយការណ៍ទាញយកបានជោគជ័យ', GlobalConstants.success);
    //             } else {
    //                 this.snackBarService.openSnackBar('Failed to process the report file', GlobalConstants.error);
    //             }

    //             // Reset filter
    //             this.report_type = '';
    //         },
    //         error: (err: HttpErrorResponse) => {
    //             this.isaving = false;

    //             const errors: { type: string; message: string }[] | undefined = err.error?.errors;
    //             let message: string = err.error?.message ?? GlobalConstants.genericError;

    //             if (errors && errors.length > 0) {
    //                 message = errors.map((obj) => obj.message).join(', ');
    //             }

    //             this.snackBarService.openSnackBar(message, GlobalConstants.error);
    //         },
    //     });
    // }
    isaving: boolean = false;
    getReport(type: string = 'PDF') {
        this.isaving = true;
        this.report_type = type;
        console.log(this.report_type);
        const params = this.prepareSearchSortFilterParam();
        this._service.getDataMenuReport(params).subscribe({
            next: (response) => {
                this.isaving = false;
                let blob;
                let fileName;
                const dateTime = new Date().toISOString().replace(/[:.]/g, '-');
                if (type === 'PDF') {
                    blob = this.b64toBlob(response.data, 'application/pdf');
                    fileName = `របាយការណ៍លក់តាមម៉ឺនុយ-${dateTime}.pdf`;
                } else if (type === 'EXCEL') {
                    blob = this.b64toBlob(response.data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    fileName = `របាយការណ៍លក់តាមម៉ឺនុយ-${dateTime}.xlsx`;
                }
                FileSaver.saveAs(blob, fileName);
                // Show a success message using the snackBarService
                this.snackBarService.openSnackBar('របាយការណ៍ទាញយកបានជោគជ័យ', GlobalConstants.success);
            },
            error: (err: HttpErrorResponse) => {
                // Set isaving to false to indicate the operation is completed (even if it failed)
                this.isaving = false;
                // Extract error information from the response
                const errors: { type: string; message: string }[] | undefined = err.error?.errors;
                let message: string = err.error?.message ?? GlobalConstants.genericError;

                // If there are field-specific errors, join them into a single message
                if (errors && errors.length > 0) {
                    message = errors.map((obj) => obj.message).join(', ');
                }
                // Show an error message using the snackBarService
                this.snackBarService.openSnackBar(message, GlobalConstants.error);
            },
        });
    }


    // // ====================================================================>> Download Report
    // downloadReport(type:string = 'PDF'): void {

    //     this.report_type = type;

    //     // ===>> Get Filter
    //     const params = this.prepareSearchSortFilterParam();

    //     // ===>> Set Loading
    //     this.isDownloadingReport = true;

    //     // ===>> Call API
    //     this._service.downloadReport(params).subscribe({
    //         next: (res:any) => {

    //             if(res.base64) {

    //                 // Save the file to local Machine
    //                 saveFile('student-report-', res.base64, type);

    //                 // Display Message
    //                 this._snackbarService.openSnackBar('របាយការណ័ត្រូវបានទាញយកដោយជោគជ័យ', '');
    //             } else {
    //                 this._snackbarService.openSnackBar(res.message, 'error');
    //             }


    //             // Stop the spinner
    //             this.isDownloadingReport =   false;

    //             // Reset Filter
    //             this.report_type = '';
    //         },
    //         error: (err) => {

    //             this.isDownloadingReport = false;
    //             this._errorHandleService.handleHttpError(err);
    //         },
    //     });
    // }

    // Convert base64 to blob
    b64toBlob(b64Data: string, contentType: string, sliceSize?: number) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;
        var byteCharacters = atob(b64Data);
        var byteArrays = [];
        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);
            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        var blob = new Blob(byteArrays, { type: contentType });
        return blob;
    }

    // Delete menu item (with confirmation)
    private helpersConfirmationService = inject(HelperConfirmationService)

    onDelete(item: Data): void {

        // Build the config form
        const configAction: HelperConfirmationConfig = {

            title: `Remove <strong> ${item.name} </strong>`,
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

        // Open the dialog and save the reference of it
        const dialogRef = this.helpersConfirmationService.open(configAction);

        // Subscribe to afterClosed from the dialog reference
        dialogRef.afterClosed().subscribe((result: string) => {

            if (result && typeof result === 'string' && result === 'confirmed') {

                // If the result is 'confirmed', proceed with deletion
                this._service.delete(item.id).subscribe({

                    // Handle the successful response from the delete operation
                    next: (response: { status_code: number, message: string }) => {

                        this.dataSource.data = this.dataSource.data.filter((v: Data) => v.id != item.id);
                        this.getData()
                        // Show a success message using the SnackbarService
                        this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
                    },

                    // Handle errors that occur during the delete operation
                    error: (err: HttpErrorResponse) => {
                        this.snackBarService.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
                    }
                });
            }
        });
    }
}
