import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { env } from 'envs/env';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { Subject } from 'rxjs';

import { Data } from './interface';
import { ProductService } from '../service';

@Component({
    selector: 'dashboard-gm-fast-view-customer',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatTabsModule,
        MatMenuModule,
        MatCheckboxModule,
        DatePipe,
    ]
})
export class ViewDialogComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    displayedColumns: string[] = ['no', 'receipt', 'price', 'ordered_at', 'ordered_at_time', 'seller'];
    dataSource: MatTableDataSource<Data> = new MatTableDataSource<Data>([]);
    fileUrl = env.FILE_BASE_URL;
    public isLoading: boolean;

    constructor(
        @Inject(MAT_DIALOG_DATA) public element: any,
        private _dialogRef: MatDialogRef<ViewDialogComponent>,
        private cdr: ChangeDetectorRef,
        private _snackbar: SnackbarService,
        private productService: ProductService,
    ) { }

    ngOnInit(): void {
        this.viewData();
    }

    viewData() {
        this.isLoading = true;
        this.productService.view(this.element.id).subscribe(
            (res) => {
                this.dataSource.data = res.data;
                this.isLoading = false;
                this.cdr.detectChanges(); // Manually trigger change detection
            },
            (err) => {
                this.isLoading = false;
                this.cdr.detectChanges(); // Ensure change detection is updated for error as well
                this._snackbar.openSnackBar(err.error.message, 'Dismiss');
            }
        );
    }

    closeDialog() {
        this._dialogRef.close();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
