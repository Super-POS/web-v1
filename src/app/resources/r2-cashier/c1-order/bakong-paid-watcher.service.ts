// ================================================================>> Core Library
import { Injectable } from '@angular/core';

// ================================================================>> Third-Party
import { Observable, of, race, timer, interval } from 'rxjs';
import { map, take, filter, startWith, exhaustMap, catchError } from 'rxjs/operators';

// ================================================================>> Custom
import { OrderService } from './service';

export type BakongSettled = 'paid' | 'cancelled' | 'timeout';

/**
 * Bakong KHQR settlement watcher — polling-only per
 * https://bakong.nbc.gov.kh/download/KHQR/integration/Bakong%20Open%20API%20Document.pdf
 * (KHQR SDK doc + Bakong Open API). Bakong does NOT provide a payment webhook for merchants
 * outside of bank-side integrations, so the merchant flow is:
 *
 *   1. Generate KHQR string + md5 (server) using bakong-khqr SDK.
 *   2. Show QR to customer.
 *   3. Poll `POST /v1/check_transaction_by_md5` with that md5.
 *      The doc recommends polling on the order of ~10s; we poll the backend wrapper every 3s
 *      so the cashier sees the success snackbar within a few seconds of payment.
 *      The backend wrapper (`/cashier/ordering/bakong/order/:id/payment-state`) only forwards to
 *      Bakong while the PaymentTransaction is still PENDING and within `expires_at` — so this
 *      front-end cadence will not hammer Bakong once the tx settles.
 */
@Injectable({ providedIn: 'root' })
export class BakongPaidWatcherService {
    constructor(private readonly _orders: OrderService) {}

    waitUntilSettled(orderId: number, timeoutMs = 10 * 60_000): Observable<BakongSettled> {
        const fromPoll$ = interval(3_000).pipe(
            startWith(0),
            exhaustMap(() => this._orders.getBakongPaymentState(orderId).pipe(catchError(() => of(null)))),
            map((res) => this._outcomeFromState(res)),
            filter((x): x is 'paid' | 'cancelled' => x === 'paid' || x === 'cancelled'),
            take(1),
            map((st) => (st === 'cancelled' ? 'cancelled' as const : 'paid' as const)),
        );

        const timeout$ = timer(timeoutMs).pipe(
            take(1),
            map((): BakongSettled => 'timeout'),
        );

        return race(fromPoll$, timeout$);
    }

    /**
     * Reads the `payment_transaction.status` mirror (Bakong `responseCode === 0` → `SUCCESS`)
     * + `order.status` (Bakong does not signal cancellation; that comes from the cashier hitting
     * `/cashier/orders/:id/cancel` while waiting).
     */
    private _outcomeFromState(res: unknown): 'wait' | 'paid' | 'cancelled' {
        if (res == null || typeof res !== 'object') {
            return 'wait';
        }
        const d = (res as { data?: { order_status?: string; bakong_transaction_status?: string | null } })
            .data;
        if (d == null) {
            return 'wait';
        }
        const os = (d.order_status ?? '').toLowerCase();
        const bts = (d.bakong_transaction_status ?? '').toLowerCase();
        if (bts === 'success') {
            return 'paid';
        }
        if (bts === 'expired' || bts === 'failed' || bts === 'cancelled') {
            return 'cancelled';
        }
        if (os === 'cancelled') {
            return 'cancelled';
        }
        return 'wait';
    }
}
