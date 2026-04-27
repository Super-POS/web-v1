// ================================================================>> Core Library
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

// ================================================================>> Third party Library
import { Observable, catchError, tap, throwError } from 'rxjs';

// ================================================================>> Custom Library
import { env } from 'envs/env';
import { BarayPaymentIntentResponse, IngredientStock, List, ResponseOrder } from './interface';
@Injectable({

    providedIn: 'root',
})
export class OrderService {

    constructor(private httpClient: HttpClient) { }


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

    // Must match api-v1 CreateOrderDto: cart (JSON string) + channel (OrderChannelEnum)
    create(body: {
        cart: string;
        channel?: 'walk_in' | 'telegram' | 'website';
        /** Baray: delay Telegram + receipt until pay webhook. */
        deferred_telegram?: boolean;
    }): Observable<ResponseOrder> {
        const { cart, channel = 'walk_in', deferred_telegram = true } = body;

        const requestBody: Record<string, unknown> = {
            cart,
            channel,
        };
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

    /** After an order is created: Baray local-bank pay link (QR in UI). */
    createBarayPaymentIntent(orderId: number): Observable<BarayPaymentIntentResponse> {
        return this.httpClient.post<BarayPaymentIntentResponse>(
            `${env.API_BASE_URL}/cashier/ordering/baray/payment-intent`,
            { order_id: orderId },
            { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) },
        );
    }

    /** Poll / sync: same as cashier/sales view (id, status, receipt). */
    getOrderViewForBaray(id: number): Observable<{ data: { id: number; status: string; receipt_number: string } }> {
        return this.httpClient.get<{ data: { id: number; status: string; receipt_number: string } }>(
            `${env.API_BASE_URL}/cashier/sales/${id}/view`,
        );
    }

    /**
     * Baray wait overlay: `order.status` + latest `payment_transaction` (success hits even if /view is cached or shaped oddly).
     */
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

    /** While awaiting Baray: cashier can give up; order must be in cancelable state (e.g. awaiting_payment). */
    cancelOrder(orderId: number): Observable<unknown> {
        return this.httpClient.patch(
            `${env.API_BASE_URL}/cashier/orders/${orderId}/cancel`,
            {},
            { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) },
        );
    }
}
