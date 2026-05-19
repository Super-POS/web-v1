// ================================================================>> Core Library
import { DatePipe, DecimalPipe, NgForOf, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// Baray-only sanitizer (kept for reversibility): import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// ================================================================>> Third party Library
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { KhqrPaymentOverlayComponent } from 'app/shared/khqr-payment-overlay/khqr-payment-overlay.component';

import { Subject, Subscription, debounceTime, take, takeUntil } from 'rxjs';

// ================================================================>> Custom Library
import { User } from 'app/core/user/interface';
import { UserService } from 'app/core/user/service';
import { ViewDetailSaleComponent } from 'app/shared/view/component';
import { CashDrawer, Denominations, MakeChangeResponse } from '../../c3-cash-drawer/interface';
import { CashierCashDrawerService } from '../../c3-cash-drawer/service';
import { Data as OrderReceiptData } from '../../c2-sale/interface';
import { PrintableOrder, PrintReceiptService } from 'helper/services/print-receipt/print-receipt.service';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { env } from 'envs/env';
import { BakongPaidWatcherService } from '../bakong-paid-watcher.service';
// Baray (disabled — keep import path so re-enabling is a one-liner):
// import { BarayPaidWatcherService } from '../baray-paid-watcher.service';
import { CashierCouponOption, OrderCartLine } from '../interface';
import { OrderService } from '../service';
import { ExchangeRateSettingService } from 'helper/services/exchange-rate-setting/exchange-rate-setting.service';
import { UsdFromKhrPipe } from 'helper/pipes/usd-from-khr.pipe';

/**
 * Payment methods exposed by the cashier checkout.
 * `bakong` = Bakong KHQR per https://bakong.nbc.gov.kh/download/KHQR/integration/Bakong%20Open%20API%20Document.pdf
 *   (polled via `/cashier/ordering/bakong/order/:id/payment-state`).
 * `cash`   = manual cash drawer flow with change calculation.
 *
 * `qr` (Baray) was removed per merchant request; the API endpoints stay in `OrderService` so it
 * can be re-enabled without changes elsewhere.
 */
type PaymentMethod = 'cash' | 'bakong';

interface DrawerDenomRow {
    label: string;
    key: keyof Denominations;
    currency: 'USD' | 'KHR';
    value: number;
    count: number;
    total: number;
}

const CD_USD: { label: string; key: keyof Denominations; value: number }[] = [
    { label: '$1', key: 'usd_1', value: 1 },
    { label: '$5', key: 'usd_5', value: 5 },
    { label: '$20', key: 'usd_20', value: 20 },
    { label: '$50', key: 'usd_50', value: 50 },
    { label: '$100', key: 'usd_100', value: 100 },
];

const CD_KHR: { label: string; key: keyof Denominations; value: number }[] = [
    { label: '100 R', key: 'khr_100', value: 100 },
    { label: '200 R', key: 'khr_200', value: 200 },
    { label: '500 R', key: 'khr_500', value: 500 },
    { label: '1,000 R', key: 'khr_1000', value: 1000 },
    { label: '2,000 R', key: 'khr_2000', value: 2000 },
    { label: '5,000 R', key: 'khr_5000', value: 5000 },
    { label: '10,000 R', key: 'khr_10000', value: 10000 },
    { label: '15,000 R', key: 'khr_15000', value: 15000 },
    { label: '20,000 R', key: 'khr_20000', value: 20000 },
    { label: '30,000 R', key: 'khr_30000', value: 30000 },
    { label: '50,000 R', key: 'khr_50000', value: 50000 },
    { label: '100,000 R', key: 'khr_100000', value: 100000 },
    { label: '200,000 R', key: 'khr_200000', value: 200000 },
];

const CD_ALL_MAP: Record<string, { label: string; currency: 'USD' | 'KHR' }> = {};
CD_USD.forEach(d => (CD_ALL_MAP[d.key] = { label: d.label, currency: 'USD' }));
CD_KHR.forEach(d => (CD_ALL_MAP[d.key] = { label: d.label, currency: 'KHR' }));

function flatCount(obj: CashDrawer | null, key: keyof Denominations): number {
    return Number(obj?.[key]) || 0;
}

@Component({
    selector: 'app-order-checkout',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        DatePipe,
        DecimalPipe,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        NgForOf,
        NgIf,
        KhqrPaymentOverlayComponent,
        UsdFromKhrPipe,
    ],
})
export class OrderCheckoutComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<User> = new Subject<User>();
    private _cashPreviewChanges: Subject<void> = new Subject<void>();
    private matDialog = inject(MatDialog);

    user: User;
    fileUrl = env.FILE_BASE_URL;
    carts: OrderCartLine[] = [];
    totalPrice = 0;
    cartSubtotal = 0;
    discountAmountKhr = 0;
    activeCoupons: CashierCouponOption[] = [];
    selectedCouponCode = '';
    paymentMethod: PaymentMethod = 'bakong';
    isOrderBeingMade = false;
    isCalculatingChange = false;
    isPreviewingCashChange = false;

    /** Bakong KHQR overlay: full-screen waiting state with QR + amount until paid / timeout / cashier cancels. */
    isAwaitingBakongPayment = false;
    bakongQrData: string | null = null;
    bakongExpiresAt: Date | null = null;
    /** Order total in KHR (the bank-of-record currency in this POS). */
    bakongAmountKhr = 0;
    /** Amount actually encoded in the KHQR (in `bakongQrCurrency`). */
    bakongQrAmount = 0;
    /** Currency tag carried in the KHQR — what the customer's banking app will display. */
    bakongQrCurrency: 'USD' | 'KHR' = 'KHR';
    /**
     * Merchant identity surfaced by the backend (Tag 59/60 of the EMV string). Used to render
     * the official NBC "KHQR Card" layout — merchant name + city sit between the red ribbon
     * header and the QR. We fall back to env defaults if the API doesn't include them.
     */
    bakongMerchantName = 'KHQR';
    bakongMerchantCity = '';
    /** Receipt # to print on the card so the cashier can match QR ↔ order in one glance. */
    bakongReceiptNumber: string | null = null;
    private _bakongPendingOrderId: number | null = null;
    private _bakongWaitSub: Subscription | null = null;

    /**
     * After the QR wait overlay closes, we show a full-screen result card so the
     * cashier *can't miss* whether the payment landed. Replaces a snackbar-only
     * confirmation that was easy to overlook on a busy POS.
     */
    bakongResult: 'paid' | 'cancelled' | 'timeout' | null = null;
    bakongResultAmountKhr = 0;
    bakongResultReceiptNumber: string | number | null = null;
    /** Held until the cashier dismisses the result card; then we open the receipt drawer. */
    private _bakongResultPendingOrder: OrderReceiptData | null = null;

    cashExchangeRate = ExchangeRateSettingService.FALLBACK_KHR_PER_USD;
    cashReceivedKhrAmount: number | null = null;
    cashReceivedUsdAmount: number | null = null;
    cashNote = '';
    isLoadingCashDrawer = false;
    cashDrawer: CashDrawer | null = null;
    cashDrawerUsdRows: DrawerDenomRow[] = [];
    cashDrawerKhrRows: DrawerDenomRow[] = [];

    cashChangePreview: MakeChangeResponse['data'] | null = null;
    cashPreviewBreakdownItems: { label: string; count: number; currency: 'USD' | 'KHR' }[] = [];
    cashPreviewError = '';
    cashChangeResult: MakeChangeResponse['data'] | null = null;
    cashChangeBreakdownItems: { label: string; count: number; currency: 'USD' | 'KHR' }[] = [];
    cashPendingOrder: OrderReceiptData | null = null;

    private readonly _exchangeRateSetting = inject(ExchangeRateSettingService);

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _userService: UserService,
        private _service: OrderService,
        private _snackBarService: SnackbarService,
        private _bakongPaid: BakongPaidWatcherService,
        private _cashDrawer: CashierCashDrawerService,
        private _printReceipt: PrintReceiptService,
    ) {
        this._userService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe((user: User) => {
            this.user = user;
            this._changeDetectorRef.markForCheck();
        });
    }

    ngOnInit(): void {
        const draft = this._service.getCheckoutDraft();
        if (!draft) {
            this._snackBarService.openSnackBar('Your cart is empty. Please add items first.', GlobalConstants.error);
            this._router.navigate(['/cashier/order']);
            return;
        }

        this._exchangeRateSetting.fetchCashier().subscribe({
            next: () => {
                this.cashExchangeRate = this._exchangeRateSetting.khrPerUsd;
                setTimeout(() => this._changeDetectorRef.markForCheck());
            },
            error: () => {
                this.cashExchangeRate = this._exchangeRateSetting.khrPerUsd;
                setTimeout(() => this._changeDetectorRef.markForCheck());
            },
        });

        this.carts = draft.carts;
        this._syncTotalsFromCartAndCoupon();
        this._service.listActiveCoupons().subscribe({
            next: (res) => {
                this.activeCoupons = res.data || [];
                const wanted = draft.couponCode?.trim().toUpperCase() || '';
                this.selectedCouponCode =
                    wanted && this.activeCoupons.some((c) => c.code === wanted) ? wanted : '';
                this._syncTotalsFromCartAndCoupon();
                this._changeDetectorRef.markForCheck();
            },
            error: () => {
                this.activeCoupons = [];
                this.selectedCouponCode = '';
                this._syncTotalsFromCartAndCoupon();
                this._changeDetectorRef.markForCheck();
            },
        });
        this._cashPreviewChanges
            .pipe(debounceTime(350), takeUntil(this._unsubscribeAll))
            .subscribe(() => this.previewCashChange());
    }

    ngOnDestroy(): void {
        this._endBakongWaitUi();
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    get cashReceivedUsdTotal(): number {
        return Number(this.cashReceivedUsdAmount ?? 0);
    }

    get cashReceivedKhrTotal(): number {
        return Number(this.cashReceivedKhrAmount ?? 0);
    }

    get cashReceivedTotalInKhr(): number {
        return (this.cashReceivedUsdTotal * this.cashExchangeRate) + this.cashReceivedKhrTotal;
    }

    get cashChange(): number {
        return this.cashReceivedTotalInKhr - this.totalPrice;
    }

    get cashHasPayment(): boolean {
        return this.cashReceivedKhrTotal > 0 || this.cashReceivedUsdTotal > 0;
    }

    /** After coupon the amount due can be 0 KHR (e.g. 100% off). */
    get isZeroPayable(): boolean {
        return this.carts.length > 0 && this.totalPrice <= 0;
    }

    get canPlaceCashOrder(): boolean {
        if (this.carts.length === 0 || this.isPreviewingCashChange) {
            return false;
        }
        if (this.isZeroPayable) {
            return true;
        }
        return (
            this.cashHasPayment &&
            this.cashChange >= 0 &&
            !!this.cashChangePreview
        );
    }

    selectPaymentMethod(method: PaymentMethod): void {
        this.paymentMethod = method;
        if (method === 'cash' && !this.cashDrawer && !this.isLoadingCashDrawer) {
            this.loadCashDrawer();
        }
    }

    loadCashDrawer(): void {
        this.isLoadingCashDrawer = true;
        this._cashDrawer.getCurrent().subscribe({
            next: (res) => {
                this.cashDrawer = res.data;
                this.cashDrawerUsdRows = CD_USD.map((item) => {
                    const count = flatCount(res.data, item.key);
                    return { ...item, currency: 'USD' as const, count, total: count * item.value };
                });
                this.cashDrawerKhrRows = CD_KHR.map((item) => {
                    const count = flatCount(res.data, item.key);
                    return { ...item, currency: 'KHR' as const, count, total: count * item.value };
                });
                this.isLoadingCashDrawer = false;
                this._changeDetectorRef.detectChanges();
            },
            error: (err: HttpErrorResponse) => {
                this.isLoadingCashDrawer = false;
                this._snackBarService.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
                this._changeDetectorRef.detectChanges();
            },
        });
    }

    get cashDrawerTotalUsd(): number {
        return this.cashDrawerUsdRows.reduce((sum, row) => sum + row.total, 0);
    }

    get cashDrawerTotalKhr(): number {
        return this.cashDrawerKhrRows.reduce((sum, row) => sum + row.total, 0);
    }

    onCashPaymentInputChange(): void {
        this.cashChangePreview = null;
        this.cashPreviewBreakdownItems = [];
        this.cashPreviewError = '';
        this._cashPreviewChanges.next();
    }

    previewCashChange(): void {
        if (this.carts.length === 0 || this.totalPrice <= 0) {
            this.isPreviewingCashChange = false;
            this.cashChangePreview = null;
            this.cashPreviewBreakdownItems = [];
            this.cashPreviewError = '';
            return;
        }

        if (this.cashChange < 0 || !this.cashHasPayment) {
            this.isPreviewingCashChange = false;
            return;
        }

        this.isPreviewingCashChange = true;
        this.cashChangePreview = null;
        this.cashPreviewBreakdownItems = [];
        this.cashPreviewError = '';
        this._cashDrawer.previewChange({
            order_total_khr: Math.round(this.totalPrice),
            exchange_rate: this.cashExchangeRate,
            received_amount_khr: Math.max(0, Math.round(this.cashReceivedKhrTotal)),
            received_amount_usd: Math.max(0, Math.round(this.cashReceivedUsdTotal)),
        }).subscribe({
            next: (res) => {
                this.isPreviewingCashChange = false;
                this.cashChangePreview = res.data;
                this.cashPreviewBreakdownItems = this._buildCashChangeBreakdown(res.data.change_breakdown);
                this._changeDetectorRef.detectChanges();
            },
            error: (err: HttpErrorResponse) => {
                this.isPreviewingCashChange = false;
                this.cashPreviewError = err?.error?.message || GlobalConstants.genericError;
                this._changeDetectorRef.detectChanges();
            },
        });
    }

    backToCart(): void {
        this._service.setCheckoutDraft({
            carts: this.carts,
            totalPrice: this._calculateTotal(),
            couponCode: this.selectedCouponCode?.trim() || null,
        });
        this._router.navigate(['/cashier/order']);
    }

    onCouponChange(): void {
        this._syncTotalsFromCartAndCoupon();
        this.onCashPaymentInputChange();
    }

    private _syncTotalsFromCartAndCoupon(): void {
        const sub = this._calculateTotal();
        this.cartSubtotal = sub;
        let discount = 0;
        const sel = this.selectedCouponCode?.trim().toUpperCase();
        if (sel) {
            const c = this.activeCoupons.find((x) => x.code === sel);
            if (c) {
                discount = Math.round((sub * Number(c.discount_percent)) / 100);
            }
        }
        this.discountAmountKhr = discount;
        this.totalPrice = Math.max(0, sub - discount);
    }

    placeOrder(): void {
        if (this.paymentMethod === 'cash') {
            this._placeCashOrder();
            return;
        }
        this._placeBakongOrder();
    }

    dismissChangeResult(): void {
        const order = this.cashPendingOrder;
        this.cashChangeResult = null;
        this.cashChangeBreakdownItems = [];
        this.cashPendingOrder = null;
        if (order) {
            // Tag as paid so the receipt drawer's payment badge renders correctly even
            // though the create-order API echo doesn't include `payment_status`.
            this.openOrderDetailDrawer({ ...order, payment_status: 'paid' } as OrderReceiptData);
        }
    }

    /**
     * Closes the Bakong result card. On a successful payment we then open the receipt
     * drawer so the cashier sees the itemized invoice; on a cancel/timeout we just
     * return to the empty checkout view.
     */
    dismissBakongResult(): void {
        const wasPaid = this.bakongResult === 'paid';
        const order = this._bakongResultPendingOrder;
        this.bakongResult = null;
        this.bakongResultAmountKhr = 0;
        this.bakongResultReceiptNumber = null;
        this._bakongResultPendingOrder = null;
        if (wasPaid && order) {
            this.openOrderDetailDrawer(order);
        }
    }

    cancelBakongWait(): void {
        if (this._bakongPendingOrderId == null) {
            this._endBakongWaitUi();
            return;
        }

        const id = this._bakongPendingOrderId;
        this._endBakongWaitUi();
        this._service.cancelOrder(id).subscribe({
            next: () => {
                this._snackBarService.openSnackBar(
                    'Receipt cancelled - customer has not paid.',
                    GlobalConstants.success,
                );
            },
            error: (err: HttpErrorResponse) => {
                this._snackBarService.openSnackBar(
                    err?.error?.message || 'Unable to cancel this order.',
                    GlobalConstants.error,
                );
            },
        });
    }

    trackByLineKey(_index: number, line: OrderCartLine): string {
        return line?.lineKey;
    }

    private _buildCashChangeBreakdown(breakdown: Record<string, number>): { label: string; count: number; currency: 'USD' | 'KHR' }[] {
        if (!breakdown) return [];
        return Object.entries(breakdown)
            .filter(([, count]) => count > 0)
            .map(([key, count]) => ({
                label: CD_ALL_MAP[key]?.label ?? key,
                count,
                currency: (CD_ALL_MAP[key]?.currency ?? 'KHR') as 'USD' | 'KHR',
            }));
    }

    private _calculateTotal(): number {
        return this.carts.reduce((total, item) => total + (item.qty * item.unit_price), 0);
    }

    private _buildCartPayload(): {
        menu_id: number;
        qty: number;
        modifier_option_ids: number[];
        line_note?: string;
        size?: 'S' | 'M' | 'L';
    }[] {
        return this.carts.map((line) => {
            const entry: {
                menu_id: number;
                qty: number;
                modifier_option_ids: number[];
                line_note?: string;
                size?: 'S' | 'M' | 'L';
            } = {
                menu_id: line.id,
                qty: line.qty,
                modifier_option_ids: line.modifier_option_ids || [],
            };
            if (line.line_note?.trim()) {
                entry.line_note = line.line_note.trim().slice(0, 500);
            }
            if (line.size) {
                entry.size = line.size;
            }
            return entry;
        });
    }

    private _placeCashOrder(): void {
        if (!this.canPlaceCashOrder) {
            this._snackBarService.openSnackBar('Please preview the change before placing the order.', GlobalConstants.error);
            return;
        }

        const savedExchangeRate = this.cashExchangeRate;
        const savedReceivedKhr = Math.max(0, Math.round(this.cashReceivedKhrTotal));
        const savedReceivedUsd = Math.max(0, Math.round(this.cashReceivedUsdTotal));
        const savedNote = this.cashNote?.trim() || undefined;
        const skipDrawer = this.isZeroPayable;

        this.isOrderBeingMade = true;
        this._service
            .create({
                cart: JSON.stringify(this._buildCartPayload()),
                deferred_telegram: false,
                coupon_code: this.selectedCouponCode?.trim() || undefined,
            })
            .subscribe({
            next: (response) => {
                this.isOrderBeingMade = false;
                const order = response.data;
                this._service.clearCheckoutDraft();
                this.carts = [];
                this.totalPrice = 0;

                if (skipDrawer) {
                    this.cashReceivedKhrAmount = null;
                    this.cashReceivedUsdAmount = null;
                    this.cashNote = '';
                    this.cashChangePreview = null;
                    this.cashPreviewBreakdownItems = [];
                    this.cashPreviewError = '';
                    this.cashChangeResult = null;
                    this.cashChangeBreakdownItems = [];
                    this.cashPendingOrder = order;
                    this._snackBarService.openSnackBar(response.message || 'Order placed.', GlobalConstants.success);
                    const printOrder: PrintableOrder = {
                        ...order,
                        payment_method: 'cash',
                        receipt_exchange_rate: savedExchangeRate,
                        receipt_received_khr: 0,
                        receipt_change_khr: 0,
                        receipt_change_summary: { khr: 0, usd: 0 },
                    };
                    this._printReceipt.print(printOrder);
                    this._changeDetectorRef.detectChanges();
                    return;
                }

                this.isCalculatingChange = true;

                this._cashDrawer.makeChange({
                    order_id: order.id,
                    exchange_rate: savedExchangeRate,
                    received_amount_khr: savedReceivedKhr,
                    received_amount_usd: savedReceivedUsd,
                    note: savedNote,
                }).subscribe({
                    next: (res) => {
                        this.isCalculatingChange = false;
                        this.cashReceivedKhrAmount = null;
                        this.cashReceivedUsdAmount = null;
                        this.cashNote = '';
                        this.cashChangePreview = null;
                        this.cashPreviewBreakdownItems = [];
                        this.cashPreviewError = '';
                        this.cashChangeResult = res.data;
                        this.cashChangeBreakdownItems = this._buildCashChangeBreakdown(res.data.change_breakdown);
                        this.cashPendingOrder = order;
                        this.loadCashDrawer();
                        this._snackBarService.openSnackBar(response.message || 'Order placed.', GlobalConstants.success);
                        const printOrder: PrintableOrder = {
                            ...order,
                            payment_method: 'cash',
                            receipt_tender_khr: savedReceivedKhr,
                            receipt_tender_usd: savedReceivedUsd,
                            receipt_exchange_rate: savedExchangeRate,
                            receipt_received_khr: res.data.received_khr,
                            receipt_change_khr: res.data.change_khr,
                            receipt_change_summary: res.data.change_summary,
                        };
                        this._printReceipt.print(printOrder);
                    },
                    error: (err: HttpErrorResponse) => {
                        this.isCalculatingChange = false;
                        this.cashReceivedKhrAmount = null;
                        this.cashReceivedUsdAmount = null;
                        this.cashNote = '';
                        this._snackBarService.openSnackBar(
                            err?.error?.message || 'Order placed but change calculation failed.',
                            GlobalConstants.error,
                        );
                        // Order was still placed successfully on the backend; the only thing
                        // that failed is computing the change breakdown. Show the receipt
                        // drawer flagged as paid so the cashier has visual confirmation.
                        this.openOrderDetailDrawer({ ...order, payment_status: 'paid' } as OrderReceiptData);
                    },
                });
            },
            error: (err: HttpErrorResponse) => {
                this.isOrderBeingMade = false;
                this._snackBarService.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    // Baray QR/iframe flow disabled — kept in `OrderService` for reversibility. Use Bakong KHQR instead.
    // private _placeQrOrder(): void { ... }
    // private _clearBarayWaitSub(): void { ... }
    // private _endBarayWaitUi(): void { ... }

    private _clearBakongWaitSub(): void {
        this._bakongWaitSub?.unsubscribe();
        this._bakongWaitSub = null;
    }

    private _endBakongWaitUi(): void {
        this.isAwaitingBakongPayment = false;
        this.bakongQrData = null;
        this.bakongExpiresAt = null;
        this.bakongAmountKhr = 0;
        this.bakongQrAmount = 0;
        this.bakongQrCurrency = 'KHR';
        this.bakongReceiptNumber = null;
        this._bakongPendingOrderId = null;
        this._clearBakongWaitSub();
    }

    /**
     * Formats the QR amount exactly the way the NBC KHQR Card guideline shows it on the
     * physical card (and how customer wallets render it after scanning):
     *   USD → "2.50 USD"   (two decimals, period separator)
     *   KHR → "4,000 KHR"  (thousands grouping, no decimals)
     */
    get bakongDisplayAmount(): string {
        const amount = Number(this.bakongQrAmount || 0);
        if (this.bakongQrCurrency === 'USD') {
            return amount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        }
        return Math.round(amount).toLocaleString('en-US');
    }

    /**
     * Bakong KHQR checkout per the KHQR SDK + Open API docs:
     *   1. Create the order on our backend (cashier-side).
     *   2. Backend calls `BakongKHQR.generateIndividual` (npm `bakong-khqr`) → returns `qr` + `md5`.
     *   3. Show the QR string in a `<qrcode>` overlay with the order total in KHR.
     *   4. Poll `POST /v1/check_transaction_by_md5` via our backend until the response code is 0
     *      (success) or the QR expires. See `bakong-paid-watcher.service.ts`.
     */
    private _placeBakongOrder(): void {
        if (this.carts.length === 0) {
            return;
        }

        const savedTotal = this.totalPrice;
        this.isOrderBeingMade = true;
        this._service
            .create({
                cart: JSON.stringify(this._buildCartPayload()),
                coupon_code: this.selectedCouponCode?.trim() || undefined,
            })
            .subscribe({
                next: (response) => {
                    this.isOrderBeingMade = false;
                    const order = response.data;

                    // IMPORTANT: do NOT clear the local cart / checkout draft here.
                    // The order is created on the backend, but the customer hasn't paid yet —
                    // they're about to scan the KHQR. If we clear the cart now, the cashier
                    // sees an "empty" checkout page behind the QR overlay, and any close of
                    // the overlay (cancel / timeout / page reload) lands them on a stale empty
                    // state that ngOnInit then redirects away from. Per cashier request, we
                    // keep the cart visible during scan + waiting, and only clear after the
                    // payment is actually confirmed (`outcome === 'paid'` below).

                    if (order?.id == null) {
                        // No order id means we can't poll/settle — treat as a finished flow
                        // and dispose the cart as before so the cashier doesn't re-place it.
                        this._service.clearCheckoutDraft();
                        this.carts = [];
                        this.totalPrice = 0;
                        this._snackBarService.openSnackBar(response.message, GlobalConstants.success);
                        this.openOrderDetailDrawer(order);
                        return;
                    }

                    this._service.createBakongPaymentIntent(order.id).subscribe({
                        next: (bakong) => {
                            const qrData = bakong.data?.qr?.trim();
                            if (!qrData) {
                                this._snackBarService.openSnackBar(
                                    'Bakong: KHQR data not available.',
                                    GlobalConstants.error,
                                );
                                return;
                            }

                            this._clearBakongWaitSub();
                            this._bakongPendingOrderId = order.id;
                            this.bakongQrData = qrData;
                            this.bakongAmountKhr = savedTotal;
                            this.bakongQrAmount = bakong.data?.qr_amount ?? savedTotal;
                            this.bakongQrCurrency = bakong.data?.qr_currency ?? 'KHR';
                            // Backend (api-v1 bakong.service.ts) echoes the Tag 59/60 values from
                            // the EMV string so the card UI shows the same identity the customer's
                            // banking app will display after scanning.
                            this.bakongMerchantName = bakong.data?.merchant_name?.trim() || 'KHQR';
                            this.bakongMerchantCity = bakong.data?.merchant_city?.trim() || '';
                            this.bakongReceiptNumber = order.receipt_number != null ? String(order.receipt_number) : null;
                            const expIso = bakong.data?.expires_at;
                            this.bakongExpiresAt = expIso ? new Date(expIso) : null;
                            this.isAwaitingBakongPayment = true;
                            this._bakongWaitSub = this._bakongPaid
                                .waitUntilSettled(order.id)
                                .pipe(take(1), takeUntil(this._unsubscribeAll))
                                .subscribe((outcome) => {
                                    this.isAwaitingBakongPayment = false;
                                    this.bakongQrData = null;
                                    this.bakongExpiresAt = null;
                                    this.bakongAmountKhr = 0;
                                    this.bakongQrAmount = 0;
                                    this.bakongQrCurrency = 'KHR';
                                    this.bakongReceiptNumber = null;
                                    this._bakongPendingOrderId = null;
                                    this._bakongWaitSub = null;

                                    this.bakongResultAmountKhr = savedTotal;
                                    this.bakongResultReceiptNumber = order.receipt_number ?? null;

                                    if (outcome === 'paid') {
                                        // Payment confirmed by Bakong (responseCode === 0).
                                        // ONLY now do we tear down the cart + draft — during the
                                        // earlier scan/wait phase the cashier's checkout stayed
                                        // intact in case they needed to cancel and retry.
                                        this._service.clearCheckoutDraft();
                                        this.carts = [];
                                        this.totalPrice = 0;

                                        this._snackBarService.openSnackBar(
                                            'Bakong: Payment completed - receipt ' +
                                                String(order.receipt_number ?? '') +
                                                '.',
                                            GlobalConstants.success,
                                        );
                                        // Pre-fetch the freshly-paid order so the receipt drawer
                                        // (opened from the result card) shows the same data the
                                        // sales list would — and tag it `paid` so the new header
                                        // badge renders correctly even if the API echo omits it.
                                        this._service.getOrderViewForBaray(order.id).subscribe({
                                            next: (v) => {
                                                const d: Record<string, unknown> = (v.data || {}) as Record<string, unknown>;
                                                const details =
                                                    (d['orderDetails'] as unknown[]) ||
                                                    (d['details'] as unknown[]) ||
                                                    [];
                                                this._bakongResultPendingOrder = {
                                                    ...order,
                                                    ...d,
                                                    details,
                                                    orderDetails: details,
                                                    payment_status: 'paid',
                                                } as OrderReceiptData;
                                                this.bakongResult = 'paid';
                                                this._changeDetectorRef.detectChanges();
                                            },
                                            error: () => {
                                                this._bakongResultPendingOrder = {
                                                    ...order,
                                                    status: 'pending',
                                                    payment_status: 'paid',
                                                } as OrderReceiptData;
                                                this.bakongResult = 'paid';
                                                this._changeDetectorRef.detectChanges();
                                            },
                                        });
                                    } else if (outcome === 'cancelled') {
                                        this._snackBarService.openSnackBar(
                                            'Receipt ' +
                                                String(order.receipt_number ?? '') +
                                                ' - changed/cancelled',
                                            GlobalConstants.error,
                                        );
                                        this.bakongResult = 'cancelled';
                                        this._changeDetectorRef.detectChanges();
                                    } else {
                                        this._snackBarService.openSnackBar(
                                            'Bakong: Waiting timeout - please verify payment manually.',
                                            GlobalConstants.error,
                                        );
                                        this.bakongResult = 'timeout';
                                        this._changeDetectorRef.detectChanges();
                                    }
                                });
                        },
                        error: (err: HttpErrorResponse) => {
                            this._snackBarService.openSnackBar(
                                err?.error?.message || 'Unable to start Bakong payment.',
                                GlobalConstants.error,
                            );
                        },
                    });
                },
                error: (err: HttpErrorResponse) => {
                    this.isOrderBeingMade = false;
                    this._snackBarService.openSnackBar(
                        err?.error?.message || GlobalConstants.genericError,
                        GlobalConstants.error,
                    );
                },
            });
    }

    private openOrderDetailDrawer(order: OrderReceiptData): void {
        const dialogConfig = new MatDialogConfig<OrderReceiptData>();
        dialogConfig.data = order;
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';
        this.matDialog.open(ViewDetailSaleComponent, dialogConfig);
    }
}
