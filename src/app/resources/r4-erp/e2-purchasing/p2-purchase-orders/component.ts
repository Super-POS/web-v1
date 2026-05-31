import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { take } from 'rxjs';
import { ErpPurchaseOrder } from '../interface';
import { ErpPurchasingService } from '../service';
import { ErpCreatePODialogComponent } from './create-dialog/component';
import { ErpReceiveGoodsDialogComponent } from './receive-dialog/component';
import { PosBreadcrumbComponent, PosListPageComponent } from 'app/shared/list-page';

@Component({
    selector: 'erp-purchase-orders',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: '../../erp-page.scss',
    imports: [
        PosListPageComponent,
        PosBreadcrumbComponent,
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatTableModule,
    ],
})
export class ErpPurchaseOrdersComponent implements OnInit {
    displayedColumns = ['po_number', 'supplier', 'order_date', 'expected_date', 'total_amount', 'status', 'actions'] as const;
    rows: ErpPurchaseOrder[] = [];
    isLoading = false;
    statusFilter = '';

    constructor(
        private service: ErpPurchasingService,
        private snackBar: SnackbarService,
        private cdr: ChangeDetectorRef,
        private _matDialog: MatDialog,
    ) {}

    ngOnInit(): void {
        this.load();
    }

    private _drawerConfig<T>(): MatDialogConfig<T> {
        return {
            autoFocus: false,
            position: { right: '0px' },
            height: '100dvh',
            width: '100dvw',
            maxWidth: '550px',
            panelClass: 'custom-mat-dialog-as-mat-drawer',
            enterAnimationDuration: '0s',
        };
    }

    load(): void {
        this.isLoading = true;
        const params = this.statusFilter ? { status: this.statusFilter } : {};
        this.service.listPurchaseOrders(params).subscribe({
            next: (res) => {
                this.rows = res.data || [];
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this.snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
                this.cdr.markForCheck();
            },
        });
    }

    openCreateDialog(): void {
        const dialogRef = this._matDialog.open(ErpCreatePODialogComponent, this._drawerConfig());
        dialogRef.componentInstance.resData.pipe(take(1)).subscribe((row: ErpPurchaseOrder) => {
            this.rows = [row, ...this.rows];
            this.cdr.markForCheck();
        });
    }

    updateStatus(row: ErpPurchaseOrder, status: string): void {
        this.service.updatePOStatus(row.id, { status }).subscribe({
            next: (res) => {
                this.snackBar.openSnackBar(res.message || 'Status updated.', GlobalConstants.success);
                this.load();
            },
            error: (err: HttpErrorResponse) => {
                this.snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    openReceiveDialog(row: ErpPurchaseOrder): void {
        const dialogRef = this._matDialog.open(ErpReceiveGoodsDialogComponent, {
            ...this._drawerConfig(),
            data: row,
        });
        dialogRef.componentInstance.resData.pipe(take(1)).subscribe(() => {
            this.load();
        });
    }
}
