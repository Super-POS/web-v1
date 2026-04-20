import { Component, Inject, OnInit }    from '@angular/core';
import { CommonModule }                 from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule }     from '@angular/material/progress-spinner';
import { MatButtonModule }              from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import FileSaver                from 'file-saver';
import { DetailsService }       from './service';
import { HttpErrorResponse }    from '@angular/common/http';
import { SnackbarService }      from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants          from 'helper/shared/constants';
import { Data, Detail }         from 'app/resources/r2-cashier/c2-sale/interface';
@Component({
    selector: 'shared-details',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatTableModule,
        MatProgressSpinnerModule
    ],
})
export class SharedDetailsComponent implements OnInit {
    displayedColumns: string[] = ['product', 'price', 'qty', 'total'];
    dataSource: MatTableDataSource<Detail> = new MatTableDataSource<Detail>([]);


    constructor(
        @Inject(MAT_DIALOG_DATA) public data: Data,
        private dialogRef: MatDialogRef<SharedDetailsComponent>,
        private detailsService: DetailsService,
        private snackBarService: SnackbarService
    ) { }

    // ===> onInit method to initialize the component
    ngOnInit(): void {
        this.dataSource.data = this.data.details;
    }


    //===> Download invoice
    downloading: boolean = false;
    print() {
        this.downloading = true;
        this.detailsService.download(this.data.receipt_number).subscribe({
            next: res => {
                this.downloading = false;
                this.dialogRef.close();
                let blob = this.b64toBlob(res.data, 'application/pdf');
                FileSaver.saveAs(blob, 'Invoice-' + this.data.receipt_number + '.pdf');
            },
            error: (err: HttpErrorResponse) => {
                this.snackBarService.openSnackBar(err.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            }
        });
    }

    // =================================>> Convert base64 to blob
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
}
