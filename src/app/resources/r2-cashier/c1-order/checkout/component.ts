// ================================================================>> Core Library
import { DatePipe, DecimalPipe, NgForOf, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// ================================================================>> Third party Library
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
import { BarayPaidWatcherService } from '../baray-paid-watcher.service';
import { CashierCouponOption, OrderCartLine } from '../interface';
import { OrderService } from '../service';
import { ExchangeRateSettingService } from 'helper/services/exchange-rate-setting/exchange-rate-setting.service';
import { UsdFromKhrPipe } from 'helper/pipes/usd-from-khr.pipe';

/**
 * Payment methods exposed by the cashier checkout.
 * `baray`     = Baray local-bank pay-link (URL polled via `/cashier/ordering/baray/order/:id/payment-state`).
 * `cash`      = manual cash drawer flow with change calculation.
 * `qr_table`  = cashier confirms customer scanned a bank QR on the table (ABA, ACLEDA, Wing, …).
 */
type PaymentMethod = 'cash' | 'baray' | 'qr_table';

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
    customerId: number | null = null;
    paymentMethod: PaymentMethod = 'baray';
    qrTableBankName = 'ABA';
    isOrderBeingMade = false;
    isCalculatingChange = false;
    isPreviewingCashChange = false;

    /** Baray waiting overlay: shown while polling for payment confirmation. */
    isAwaitingBarayPayment = false;
    barayPayUrl: string | null = null;
    safeBarayPayUrl: SafeResourceUrl | null = null;
    barayExpiresAt: Date | null = null;
    /** Order total in KHR for display. */
    barayAmountKhr = 0;
    /** Receipt # shown in the overlay so the cashier can match order ↔ payment. */
    barayReceiptNumber: string | null = null;
    private _barayPendingOrderId: number | null = null;
    private _barayWaitSub: Subscription | null = null;

    /**
     * After the wait overlay closes, show a full-screen result card so the
     * cashier can't miss whether the payment landed.
     */
    barayResult: 'paid' | 'cancelled' | 'timeout' | null = null;
    barayResultAmountKhr = 0;
    barayResultReceiptNumber: string | number | null = null;
    /** Held until the cashier dismisses the result card; then we open the receipt drawer. */
    private _barayResultPendingOrder: OrderReceiptData | null = null;

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
        private _barayPaid: BarayPaidWatcherService,
        private _cashDrawer: CashierCashDrawerService,
        private _printReceipt: PrintReceiptService,
        private _sanitizer: DomSanitizer,
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
        this.customerId = draft.customerId ?? null;
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
        this._endBarayWaitUi();
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
            customerId: this.customerId,
        });
        this._router.navigate(['/cashier/order']);
    }

    get selectedCouponIsUserRestricted(): boolean {
        const sel = this.selectedCouponCode?.trim().toUpperCase();
        if (!sel) return false;
        const c = this.activeCoupons.find((x) => x.code === sel);
        return (c?.assigned_user_ids?.length ?? 0) > 0;
    }

    onCouponChange(): void {
        if (!this.selectedCouponIsUserRestricted) {
            this.customerId = null;
        }
        this._syncTotalsFromCartAndCoupon();
        this.onCashPaymentInputChange();
    }

    eligibleItemCount = 0;
    isRestrictedCoupon = false;

    private _syncTotalsFromCartAndCoupon(): void {
        const sub = this._calculateTotal();
        this.cartSubtotal = sub;
        let discount = 0;
        const sel = this.selectedCouponCode?.trim().toUpperCase();
        if (sel) {
            const c = this.activeCoupons.find((x) => x.code === sel);
            if (c) {
                const menuIds = c.menu_ids ?? [];
                const catIds = c.category_ids ?? [];
                const hasRestriction = menuIds.length > 0 || catIds.length > 0;
                this.isRestrictedCoupon = hasRestriction;
                let eligibleSubtotal = sub;
                if (hasRestriction) {
                    const eligibleLines = this.carts.filter((l) =>
                        menuIds.includes(l.id) || (l.type?.id != null && catIds.includes(l.type.id))
                    );
                    this.eligibleItemCount = eligibleLines.reduce((n, l) => n + l.qty, 0);
                    eligibleSubtotal = eligibleLines.reduce((s, l) => s + l.unit_price * l.qty, 0);
                } else {
                    this.isRestrictedCoupon = false;
                    this.eligibleItemCount = this.carts.reduce((n, l) => n + l.qty, 0);
                }
                discount = Math.round((eligibleSubtotal * Number(c.discount_percent)) / 100);
                if (discount > sub) discount = sub;
            } else {
                this.isRestrictedCoupon = false;
                this.eligibleItemCount = 0;
            }
        } else {
            this.isRestrictedCoupon = false;
            this.eligibleItemCount = 0;
        }
        this.discountAmountKhr = discount;
        this.totalPrice = Math.max(0, sub - discount);
    }

    placeOrder(): void {
        if (this.paymentMethod === 'cash') {
            this._placeCashOrder();
            return;
        }
        if (this.paymentMethod === 'qr_table') {
            this._placeQrTableOrder();
            return;
        }
        this._placeBarayOrder();
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

    dismissBarayResult(): void {
        const wasPaid = this.barayResult === 'paid';
        const order = this._barayResultPendingOrder;
        this.barayResult = null;
        this.barayResultAmountKhr = 0;
        this.barayResultReceiptNumber = null;
        this._barayResultPendingOrder = null;
        if (wasPaid && order) {
            this.openOrderDetailDrawer(order);
        }
    }

    cancelBarayWait(): void {
        if (this._barayPendingOrderId == null) {
            this._endBarayWaitUi();
            return;
        }

        const id = this._barayPendingOrderId;
        this._endBarayWaitUi();
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
                customer_id: this.customerId,
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

    private _placeQrTableOrder(): void {
        if (this.carts.length === 0) return;

        const bankName = this.qrTableBankName;
        this.isOrderBeingMade = true;
        this._service
            .create({
                cart: JSON.stringify(this._buildCartPayload()),
                deferred_telegram: false,
                coupon_code: this.selectedCouponCode?.trim() || undefined,
                customer_id: this.customerId,
            })
            .subscribe({
                next: (response) => {
                    const order = response.data;
                    this._service.payQrTable(order.id, bankName).subscribe({
                        next: () => {
                            this.isOrderBeingMade = false;
                            this._service.clearCheckoutDraft();
                            this.carts = [];
                            this.totalPrice = 0;
                            this._snackBarService.openSnackBar(
                                `QR Table payment recorded — ${bankName}.`,
                                GlobalConstants.success,
                            );
                            this.openOrderDetailDrawer({ ...order, payment_status: 'paid' } as OrderReceiptData);
                            this._changeDetectorRef.detectChanges();
                        },
                        error: (err: HttpErrorResponse) => {
                            this.isOrderBeingMade = false;
                            this._snackBarService.openSnackBar(
                                err?.error?.message || 'Order placed but payment recording failed — verify manually.',
                                GlobalConstants.error,
                            );
                            this.openOrderDetailDrawer(order);
                            this._changeDetectorRef.detectChanges();
                        },
                    });
                },
                error: (err: HttpErrorResponse) => {
                    this.isOrderBeingMade = false;
                    this._snackBarService.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
                },
            });
    }

    private _clearBarayWaitSub(): void {
        this._barayWaitSub?.unsubscribe();
        this._barayWaitSub = null;
    }

    private _endBarayWaitUi(): void {
        this.isAwaitingBarayPayment = false;
        this.barayPayUrl = null;
        this.safeBarayPayUrl = null;
        this.barayExpiresAt = null;
        this.barayAmountKhr = 0;
        this.barayReceiptNumber = null;
        this._barayPendingOrderId = null;
        this._clearBarayWaitSub();
    }

    private _placeBarayOrder(): void {
        if (this.carts.length === 0) {
            return;
        }

        const savedTotal = this.totalPrice;
        this.isOrderBeingMade = true;
        this._service
            .create({
                cart: JSON.stringify(this._buildCartPayload()),
                deferred_telegram: true,
                coupon_code: this.selectedCouponCode?.trim() || undefined,
                customer_id: this.customerId,
            })
            .subscribe({
                next: (response) => {
                    this.isOrderBeingMade = false;
                    const order = response.data;

                    if (order?.id == null) {
                        this._service.clearCheckoutDraft();
                        this.carts = [];
                        this.totalPrice = 0;
                        this._snackBarService.openSnackBar(response.message, GlobalConstants.success);
                        this.openOrderDetailDrawer(order);
                        return;
                    }

                    this._service.createBarayPaymentIntent(order.id).subscribe({
                        next: (baray) => {
                            const payUrl = baray.data?.url?.trim();
                            if (!payUrl) {
                                this._snackBarService.openSnackBar(
                                    'Baray: Pay link not available.',
                                    GlobalConstants.error,
                                );
                                return;
                            }

                            this._clearBarayWaitSub();
                            this._barayPendingOrderId = order.id;
                            this.barayPayUrl = payUrl;
                            this.safeBarayPayUrl = this._sanitizer.bypassSecurityTrustResourceUrl(payUrl);
                            this.barayAmountKhr = savedTotal;
                            this.barayReceiptNumber = order.receipt_number != null ? String(order.receipt_number) : null;
                            const expIso = baray.data?.expires_at;
                            this.barayExpiresAt = expIso ? new Date(expIso) : null;
                            this.isAwaitingBarayPayment = true;

                            this._barayWaitSub = this._barayPaid
                                .waitUntilSettled(order.id)
                                .pipe(take(1), takeUntil(this._unsubscribeAll))
                                .subscribe((outcome) => {
                                    this.isAwaitingBarayPayment = false;
                                    this.barayPayUrl = null;
                                    this.safeBarayPayUrl = null;
                                    this.barayExpiresAt = null;
                                    this.barayAmountKhr = 0;
                                    this.barayReceiptNumber = null;
                                    this._barayPendingOrderId = null;
                                    this._barayWaitSub = null;

                                    this.barayResultAmountKhr = savedTotal;
                                    this.barayResultReceiptNumber = order.receipt_number ?? null;

                                    if (outcome === 'paid') {
                                        this._service.clearCheckoutDraft();
                                        this.carts = [];
                                        this.totalPrice = 0;

                                        this._snackBarService.openSnackBar(
                                            'Baray: Payment completed - receipt ' + String(order.receipt_number ?? '') + '.',
                                            GlobalConstants.success,
                                        );
                                        this._service.getOrderViewForBaray(order.id).subscribe({
                                            next: (v) => {
                                                const d: Record<string, unknown> = (v.data || {}) as Record<string, unknown>;
                                                const details =
                                                    (d['orderDetails'] as unknown[]) ||
                                                    (d['details'] as unknown[]) ||
                                                    [];
                                                this._barayResultPendingOrder = {
                                                    ...order,
                                                    ...d,
                                                    details,
                                                    orderDetails: details,
                                                    payment_status: 'paid',
                                                } as OrderReceiptData;
                                                this.barayResult = 'paid';
                                                this._changeDetectorRef.detectChanges();
                                            },
                                            error: () => {
                                                this._barayResultPendingOrder = {
                                                    ...order,
                                                    status: 'pending',
                                                    payment_status: 'paid',
                                                } as OrderReceiptData;
                                                this.barayResult = 'paid';
                                                this._changeDetectorRef.detectChanges();
                                            },
                                        });
                                    } else if (outcome === 'cancelled') {
                                        this._snackBarService.openSnackBar(
                                            'Receipt ' + String(order.receipt_number ?? '') + ' - changed/cancelled',
                                            GlobalConstants.error,
                                        );
                                        this.barayResult = 'cancelled';
                                        this._changeDetectorRef.detectChanges();
                                    } else {
                                        this._snackBarService.openSnackBar(
                                            'Baray: Waiting timeout - please verify payment manually.',
                                            GlobalConstants.error,
                                        );
                                        this.barayResult = 'timeout';
                                        this._changeDetectorRef.detectChanges();
                                    }
                                });
                        },
                        error: (err: HttpErrorResponse) => {
                            this._snackBarService.openSnackBar(
                                err?.error?.message || 'Unable to start Baray payment.',
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
