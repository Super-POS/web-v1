import { CommonModule }         from '@angular/common';
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
import { SnackbarService }      from 'helper/services/snack-bar/snack-bar.service';
import { Subject }              from 'rxjs';
import { PrintReceiptService }  from 'helper/services/print-receipt/print-receipt.service';
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
        private _printReceipt: PrintReceiptService,
    ) { }

    // Method to initialize the component
    ngOnInit(): void {
        const raw = this.row?.orderDetails || this.row?.details;
        if (this.row && raw?.length) {
            this.dataSource.data = raw.map((d: any) => ({
                ...d,
                product: d?.product || d?.menu,
            }));
        }
    }

    /** Telegram Mini App (and legacy Mobile filter): show linked customer on invoice drawer. Walk-in: hidden. */
    get showTelegramCustomer(): boolean {
        if (!this.row) {
            return false;
        }
        const ch = (this.row.channel ?? '').toString().toLowerCase();
        const isTelegram =
            ch === 'telegram' || this.row.platform === 'Telegram' || this.row.platform === 'Mobile';
        return isTelegram && this.customerInvoiceLabel.length > 0;
    }

    get customerInvoiceLabel(): string {
        const c = this.row?.customer;
        if (!c) {
            return '';
        }
        const name = (c.name ?? '').trim();
        if (name) {
            return name;
        }
        const fromTg = [c.telegram_first_name, c.telegram_last_name].filter(Boolean).join(' ').trim();
        if (fromTg) {
            return fromTg;
        }
        const u = (c.telegram_username ?? '').trim();
        if (u) {
            return u.startsWith('@') ? u : `@${u}`;
        }
        return '';
    }

    // Method to calculate the total of the sale
    getTotal(): number {
        return this.dataSource.data.reduce((sum, item) => sum + (item.unit_price * item.qty), 0);
    }

    /** Amount charged after coupon (matches API total_price). */
    getGrandTotal(): number {
        const paid = Number(this.row?.total_price);
        if (Number.isFinite(paid)) {
            return paid;
        }
        return this.getTotal();
    }

    // Method to print the receipt on the connected thermal printer
    print(row: any) {
        this._printReceipt.print(row);
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
