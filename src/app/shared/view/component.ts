import { CommonModule }         from '@angular/common';
import { HttpErrorResponse }    from '@angular/common/http';
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule }      from '@angular/material/button';
import { MatCheckboxModule }    from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule }     from '@angular/material/divider';
import { MatIconModule }        from '@angular/material/icon';
import { MatMenuModule }        from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule }        from '@angular/material/tabs';
import { SaleService }          from 'app/resources/r2-cashier/c2-sale/service';
import { env }                  from 'envs/env';
import FileSaver                from 'file-saver';
import { SnackbarService }      from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants          from 'helper/shared/constants';
import { Subject }              from 'rxjs';
import { DetailsService }       from '../dialog/service';
@Component({
    selector: 'dashboard-gm-fast-view-customer',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatTabsModule,
        MatMenuModule,
        MatCheckboxModule,
    ]
})
export class ViewDetailSaleComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    // Component properties
    displayedColumns: string[] = ['number', 'name', 'unit_price', 'qty', 'total'];
    dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
    fileUrl = env.FILE_BASE_URL;
    public isLoading: boolean;

    constructor(
        @Inject(MAT_DIALOG_DATA) public row: any,
        private _dialogRef: MatDialogRef<ViewDetailSaleComponent>,
        private _matDialog: MatDialog,
        private cdr: ChangeDetectorRef,
        private _snackbar: SnackbarService,
        private saleService: SaleService,
        private detailsService: DetailsService
    ) { }

    // Method to initialize the component
    ngOnInit(): void {
        if (this.row && this.row.details) {
            // Assuming row.details contains the data for the table
            this.dataSource.data = this.row.details;
        }
    }

    // Method to calculate the total of the sale
    getTotal(): number {
        return this.dataSource.data.reduce((sum, item) => sum + (item.unit_price * item.qty), 0);
    }

    downloading: boolean = false;

    // Method to initiate the download of a sale invoice
    print(row: any) {

        this.downloading = true;

        // Calling the details service to download the invoice
        this.detailsService.download(row.receipt_number).subscribe({

            next: res => {

                this.downloading = false;
                let blob = this.b64toBlob(res.data, 'application/pdf');
                FileSaver.saveAs(blob, 'Invoice-' + row.receipt_number + '.pdf');
            },
            error: (err: HttpErrorResponse) => {
                this._snackbar.openSnackBar(err.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            }
        });
    }


    // Method to convert base64 data to a blob
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


    // Method to close the dialog
    closeDialog() {
        this._dialogRef.close();
    }


    // Method to unsubscribe from all subscriptions
    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
