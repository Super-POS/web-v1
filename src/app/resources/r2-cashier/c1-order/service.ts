// ================================================================>> Core Library
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

// ================================================================>> Third party Library
import { Observable, catchError, tap, throwError } from 'rxjs';

// ================================================================>> Custom Library
import { env } from 'envs/env';
import {
    AbaPaymentIntentResponse,
    AbaPaymentStateResponse,
    BakongPaymentIntentResponse,
    BakongPaymentStateResponse,
    // Baray disabled: BarayPaymentIntentResponse,
    CashierCouponOption,
    CheckoutDraft,
    IngredientStock,
    List,
    QrTablePayResponse,
    ResponseOrder,
} from './interface';
@Injectable({

    providedIn: 'root',
})
export class OrderService {

    private readonly checkoutDraftStorageKey = 'cashier_checkout_draft';

    constructor(private httpClient: HttpClient) { }

    setCheckoutDraft(draft: CheckoutDraft): void {
        const cleanDraft: CheckoutDraft = {
            carts: (draft.carts || []).map((line) => ({ ...line })),
            totalPrice: Number(draft.totalPrice || 0),
            couponCode: draft.couponCode?.trim() ? draft.couponCode.trim().toUpperCase() : null,
        };
        sessionStorage.setItem(this.checkoutDraftStorageKey, JSON.stringify(cleanDraft));
    }

    getCheckoutDraft(): CheckoutDraft | null {
        const raw = sessionStorage.getItem(this.checkoutDraftStorageKey);
        if (!raw) {
            return null;
        }

        try {
            const parsed = JSON.parse(raw) as CheckoutDraft;
            if (!Array.isArray(parsed?.carts) || parsed.carts.length === 0) {
                return null;
            }
            return {
                carts: parsed.carts.map((line) => ({ ...line })),
                totalPrice: Number(parsed.totalPrice || 0),
                couponCode: parsed.couponCode?.trim() ? parsed.couponCode.trim().toUpperCase() : null,
            };
        } catch {
            return null;
        }
    }

    clearCheckoutDraft(): void {
        sessionStorage.removeItem(this.checkoutDraftStorageKey);
    }


    // Menus for ordering (grouped by category)
    getData(): Observable<List> {
        return this.httpClient.get<List>(`${env.API_BASE_URL}/cashier/ordering/menus`, {
            headers: new HttpHeaders().set('Content-Type', 'application/json'),
        }).pipe(
            catchError((error) => {
                // Handle error by returning a new observable that throws the error
                return throwError(() => error);
            }),
            tap((response: List) => {
            })
        );
    }

    getIngredientsStock(): Observable<{ data: IngredientStock[] }> {
        return this.httpClient.get<{ data: IngredientStock[] }>(
            `${env.API_BASE_URL}/cashier/ordering/ingredients-stock`,
            { headers: new HttpHeaders().set('Content-Type', 'application/json') },
        );
    }

    listActiveCoupons(): Observable<{ data: CashierCouponOption[] }> {
        return this.httpClient.get<{ data: CashierCouponOption[] }>(
            `${env.API_BASE_URL}/cashier/ordering/coupons`,
            { headers: new HttpHeaders().set('Content-Type', 'application/json') },
        );
    }

    // Must match api-v1 CreateOrderDto: cart (JSON string) + channel (OrderChannelEnum)
    create(body: {
        cart: string;
        channel?: 'walk_in' | 'telegram' | 'website';
        /** Baray: delay Telegram + receipt until pay webhook. */
        deferred_telegram?: boolean;
        coupon_code?: string;
        /** Required when the coupon has an assigned_user_id */
        customer_id?: number | null;
    }): Observable<ResponseOrder> {
        const { cart, channel = 'walk_in', deferred_telegram = true, coupon_code, customer_id } = body;

        const requestBody: Record<string, unknown> = {
            cart,
            channel,
        };
        if (coupon_code?.trim()) {
            requestBody['coupon_code'] = coupon_code.trim().toUpperCase();
        }
        if (customer_id != null) {
            requestBody['customer_id'] = customer_id;
        }
        if (deferred_telegram) {
            requestBody['deferred_telegram'] = true;
        }

        return this.httpClient.post<ResponseOrder>(
            `${env.API_BASE_URL}/cashier/ordering/order`,
            requestBody,
            {
                headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            }
        );
    }

    /* Baray disabled
    createBarayPaymentIntent(orderId: number): Observable<BarayPaymentIntentResponse> {
        return this.httpClient.post<BarayPaymentIntentResponse>(
            `${env.API_BASE_URL}/cashier/ordering/baray/payment-intent`,
            { order_id: orderId },
            { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) },
        );
    }

    getOrderViewForBaray(id: number): Observable<{ data: { id: number; status: string; receipt_number: string } }> {
        return this.httpClient.get<{ data: { id: number; status: string; receipt_number: string } }>(
            `${env.API_BASE_URL}/cashier/sales/${id}/view`,
        );
    }

    getBarayPaymentState(id: number): Observable<{
        data: { order_id: number; order_status: string; baray_transaction_status: string | null };
    }> {
        const params = new HttpParams().set('t', String(Date.now()));
        return this.httpClient.get<{
            data: { order_id: number; order_status: string; baray_transaction_status: string | null };
        }>(`${env.API_BASE_URL}/cashier/ordering/baray/order/${id}/payment-state`, {
            params,
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
            }),
        });
    }
    */

    /** After an order is created: ABA PayWay QR string + tran_id to poll. */
    createAbaPaymentIntent(
        orderId: number,
        paymentOption: 'abapay_khqr' | 'wechat' | 'alipay',
    ): Observable<AbaPaymentIntentResponse> {
        return this.httpClient.post<AbaPaymentIntentResponse>(
            `${env.API_BASE_URL}/cashier/ordering/aba/payment-intent`,
            { order_id: orderId, payment_option: paymentOption },
            { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) },
        );
    }

    getAbaPaymentState(id: number): Observable<AbaPaymentStateResponse> {
        const params = new HttpParams().set('t', String(Date.now()));
        return this.httpClient.get<AbaPaymentStateResponse>(
            `${env.API_BASE_URL}/cashier/ordering/aba/order/${id}/payment-state`,
            {
                params,
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    Pragma: 'no-cache',
                }),
            },
        );
    }

    /** After an order is created: Bakong KHQR string + md5 to poll (rendered as QR in the UI). */
    createBakongPaymentIntent(orderId: number): Observable<BakongPaymentIntentResponse> {
        return this.httpClient.post<BakongPaymentIntentResponse>(
            `${env.API_BASE_URL}/cashier/ordering/bakong/payment-intent`,
            { order_id: orderId },
            { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) },
        );
    }

    /**
     * Bakong wait overlay: order row + latest `payment_transaction` (`bakong_transaction_status`).
     * Cache-busting `t` query so polling never hits a stale browser cache.
     */
    getBakongPaymentState(id: number): Observable<BakongPaymentStateResponse> {
        const params = new HttpParams().set('t', String(Date.now()));
        return this.httpClient.get<BakongPaymentStateResponse>(
            `${env.API_BASE_URL}/cashier/ordering/bakong/order/${id}/payment-state`,
            {
                params,
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    Pragma: 'no-cache',
                }),
            },
        );
    }

    /** Cashier confirms customer scanned a bank QR on the table; records SUCCESS payment instantly. */
    payQrTable(orderId: number, bankName: string): Observable<QrTablePayResponse> {
        return this.httpClient.post<QrTablePayResponse>(
            `${env.API_BASE_URL}/cashier/ordering/qr-table/pay`,
            { order_id: orderId, bank_name: bankName },
            { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) },
        );
    }

    /** While awaiting Baray: cashier can give up; order must be in cancelable state (e.g. awaiting_payment). */
    cancelOrder(orderId: number): Observable<unknown> {
        return this.httpClient.patch(
            `${env.API_BASE_URL}/cashier/orders/${orderId}/cancel`,
            {},
            { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) },
        );
    }
}
