import { CommonModule }         from '@angular/common';
import { HttpErrorResponse }    from '@angular/common/http';
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, inject } from '@angular/core';
import { MatButtonModule }      from '@angular/material/button';
import { MatCheckboxModule }    from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule }     from '@angular/material/divider';
import { MatIconModule }        from '@angular/material/icon';
import { MatMenuModule }        from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule }        from '@angular/material/tabs';
import { KhqrPaymentOverlayComponent } from 'app/shared/khqr-payment-overlay/khqr-payment-overlay.component';
import { SaleService }          from 'app/resources/r2-cashier/c2-sale/service';
import { OrderService }         from 'app/resources/r2-cashier/c1-order/service';
import { BakongPaidWatcherService } from 'app/resources/r2-cashier/c1-order/bakong-paid-watcher.service';
import { env }                  from 'envs/env';
import GlobalConstants          from 'helper/shared/constants';
import { SnackbarService }      from 'helper/services/snack-bar/snack-bar.service';
import { Subject, Subscription, take, takeUntil } from 'rxjs';
import { PrintReceiptService }  from 'helper/services/print-receipt/print-receipt.service';
import { ExchangeRateSettingService } from 'helper/services/exchange-rate-setting/exchange-rate-setting.service';
import { UsdFromKhrPipe } from 'helper/pipes/usd-from-khr.pipe';
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
        MatProgressSpinnerModule,
        KhqrPaymentOverlayComponent,
        UsdFromKhrPipe,
    ]
})
export class ViewDetailSaleComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private readonly _exchangeRates = inject(ExchangeRateSettingService);

    /** KHR per USD for display conversion (stored line amounts are KHR). */
    usdRate = ExchangeRateSettingService.FALLBACK_KHR_PER_USD;

    // Component properties
    displayedColumns: string[] = ['number', 'name', 'unit_price', 'qty', 'total'];
    dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
    fileUrl = env.FILE_BASE_URL;
    public isLoading: boolean;

    // -------------------------------------------------------------------------
    // Pay-now flow (unpaid orders): the receipt drawer can mint a fresh KHQR
    // for an awaiting-payment order so the cashier can show it to the customer
    // again without leaving the invoice view. The backend reuses any still-valid
    // pending Bakong tx for the same order, so this is safe to retry.
    // -------------------------------------------------------------------------
    /** Spinner while POST /cashier/ordering/bakong/payment-intent is in flight. */
    isCreatingPayIntent = false;
    /** Polling for settlement against the visible QR. */
    isAwaitingPayment = false;
    payQrData: string | null = null;
    /** Order total in KHR (bank-of-record currency in this POS). */
    payAmountKhr = 0;
    /** Amount actually encoded in the KHQR (in `payQrCurrency`). */
    payQrAmount = 0;
    payQrCurrency: 'USD' | 'KHR' = 'KHR';
    payExpiresAt: Date | null = null;
    payMerchantName = 'KHQR';
    payMerchantCity = '';
    payError: string | null = null;
    private _payWaitSub: Subscription | null = null;

    constructor(
        @Inject(MAT_DIALOG_DATA) public row: any,
        private _dialogRef: MatDialogRef<ViewDetailSaleComponent>,
        private _matDialog: MatDialog,
        private cdr: ChangeDetectorRef,
        private _snackbar: SnackbarService,
        private saleService: SaleService,
        private _printReceipt: PrintReceiptService,
        private _orderService: OrderService,
        private _bakongPaid: BakongPaidWatcherService,
    ) { }

    // Method to initialize the component
    ngOnInit(): void {
        this._exchangeRates.fetchCashier().subscribe({
            next: () => {
                this.usdRate = this._exchangeRates.khrPerUsd;
                this.cdr.markForCheck();
            },
            error: () => {
                this.usdRate = this._exchangeRates.khrPerUsd;
                this.cdr.markForCheck();
            },
        });

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

    /**
     * Normalized payment state for the prominent hero badge in the receipt header.
     * Falls back to 'pending' when the API hasn't tagged the row yet (e.g. just-created
     * orders from the POST /cashier/ordering/order response, which omits the field).
     */
    get paymentState(): 'paid' | 'cancelled' | 'pending' {
        const raw = (this.row?.payment_status ?? '').toString().toLowerCase();
        if (raw === 'paid' || raw === 'cancelled') {
            return raw;
        }
        if ((this.row?.status ?? '').toString().toLowerCase() === 'cancelled') {
            return 'cancelled';
        }
        return 'pending';
    }

    get paymentStateLabel(): string {
        switch (this.paymentState) {
            case 'paid':
                return 'Paid';
            case 'cancelled':
                return 'Cancelled';
            default:
                return 'Unpaid';
        }
    }

    get paymentStateIcon(): string {
        switch (this.paymentState) {
            case 'paid':
                return 'mdi:check-decagram';
            case 'cancelled':
                return 'mdi:close-octagon';
            default:
                return 'mdi:clock-alert-outline';
        }
    }

    // Method to print the receipt on the connected thermal printer
    print(row: any) {
        this._printReceipt.print(row);
    }

    // Method to close the dialog
    closeDialog() {
        this._dialogRef.close();
    }

    /**
     * The Pay-now button only makes sense for orders that are still in an
     * awaiting-payment state and have a positive amount due. Paid / cancelled
     * orders are excluded (the backend would reject them anyway).
     */
    get canPayNow(): boolean {
        if (!this.row || this.row.id == null) {
            return false;
        }
        if (this.paymentState !== 'pending') {
            return false;
        }
        const total = Number(this.row.total_price);
        if (!Number.isFinite(total) || total <= 0) {
            return false;
        }
        return true;
    }

    /**
     * Mints (or reuses) a Bakong KHQR for the unpaid order and starts polling
     * for settlement. The QR overlay stays open until the customer pays, the
     * QR expires (~10 min), or the cashier dismisses it. On success we flip
     * `row.payment_status` to 'paid' in place so the receipt drawer's hero
     * badge turns green without needing a page refresh.
     */
    openPayDialog(): void {
        if (!this.canPayNow || this.isCreatingPayIntent || this.isAwaitingPayment) {
            return;
        }
        const orderId = Number(this.row?.id);
        if (!Number.isFinite(orderId)) {
            return;
        }

        this.payError = null;
        this.payQrData = null;
        this.payExpiresAt = null;
        this.payAmountKhr = Number(this.row?.total_price) || 0;
        this.isCreatingPayIntent = true;
        this.cdr.markForCheck();

        this._orderService.createBakongPaymentIntent(orderId).subscribe({
            next: (res) => {
                this.isCreatingPayIntent = false;
                const data = res?.data;
                const qr = data?.qr?.trim();
                if (!qr) {
                    this.payError = 'Bakong: KHQR data not available.';
                    this._snackbar.openSnackBar(this.payError, GlobalConstants.error);
                    this.cdr.markForCheck();
                    return;
                }

                this.payQrData = qr;
                this.payQrAmount = data?.qr_amount ?? this.payAmountKhr;
                this.payQrCurrency = data?.qr_currency ?? 'KHR';
                this.payMerchantName = data?.merchant_name?.trim() || 'KHQR';
                this.payMerchantCity = data?.merchant_city?.trim() || '';
                this.payExpiresAt = data?.expires_at ? new Date(data.expires_at) : null;
                this.isAwaitingPayment = true;
                this._startPaymentPolling(orderId);
                this.cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isCreatingPayIntent = false;
                this.payError = err?.error?.message || 'Unable to start Bakong payment.';
                this._snackbar.openSnackBar(this.payError, GlobalConstants.error);
                this.cdr.markForCheck();
            },
        });
    }

    /**
     * Dismisses the QR overlay without cancelling the order — the cashier can
     * reopen it via the Pay-now button to resume polling against the same QR
     * (the backend reuses still-valid pending tx for the same order).
     */
    closePayDialog(): void {
        this.isAwaitingPayment = false;
        this.payQrData = null;
        this.payExpiresAt = null;
        this.payAmountKhr = 0;
        this.payQrAmount = 0;
        this.payQrCurrency = 'KHR';
        this._clearPayWaitSub();
        this.cdr.markForCheck();
    }

    /**
     * Same compact KHQR amount formatting the checkout uses:
     *   USD → "2.50"     (two decimals)
     *   KHR → "4,000"   (thousands grouping, no decimals)
     */
    get payDisplayAmount(): string {
        const amount = Number(this.payQrAmount || this.payAmountKhr || 0);
        if (this.payQrCurrency === 'USD') {
            return amount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        }
        return Math.round(amount).toLocaleString('en-US');
    }

    private _startPaymentPolling(orderId: number): void {
        this._clearPayWaitSub();
        this._payWaitSub = this._bakongPaid
            .waitUntilSettled(orderId)
            .pipe(take(1), takeUntil(this._unsubscribeAll))
            .subscribe((outcome) => {
                this.isAwaitingPayment = false;
                this.payQrData = null;
                this.payExpiresAt = null;
                this._payWaitSub = null;

                if (outcome === 'paid') {
                    if (this.row) {
                        this.row.payment_status = 'paid';
                    }
                    this._snackbar.openSnackBar(
                        'Bakong: Payment completed - receipt ' +
                            String(this.row?.receipt_number ?? '') +
                            '.',
                        GlobalConstants.success,
                    );
                } else if (outcome === 'cancelled') {
                    if (this.row) {
                        this.row.payment_status = 'cancelled';
                    }
                    this._snackbar.openSnackBar(
                        'Receipt ' +
                            String(this.row?.receipt_number ?? '') +
                            ' - changed/cancelled',
                        GlobalConstants.error,
                    );
                } else {
                    this._snackbar.openSnackBar(
                        'Bakong: Waiting timeout - please verify payment manually.',
                        GlobalConstants.error,
                    );
                }
                this.cdr.markForCheck();
            });
    }

    private _clearPayWaitSub(): void {
        this._payWaitSub?.unsubscribe();
        this._payWaitSub = null;
    }


    // Method to unsubscribe from all subscriptions
    ngOnDestroy(): void {
        this._clearPayWaitSub();
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
