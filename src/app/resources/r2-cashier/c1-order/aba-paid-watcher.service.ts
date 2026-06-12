// ================================================================>> Core Library
import { Injectable } from '@angular/core';

// ================================================================>> Third-Party
import { Observable, of, race, timer, interval } from 'rxjs';
import { map, take, filter, startWith, exhaustMap, catchError } from 'rxjs/operators';

// ================================================================>> Custom
import { OrderService } from './service';

export type AbaSettled = 'paid' | 'cancelled' | 'timeout';

@Injectable({ providedIn: 'root' })
export class AbaPaidWatcherService {
    constructor(private readonly _orders: OrderService) {}

    waitUntilSettled(orderId: number, timeoutMs = 15 * 60_000): Observable<AbaSettled> {
        const fromPoll$ = interval(3_000).pipe(
            startWith(0),
            exhaustMap(() => this._orders.getAbaPaymentState(orderId).pipe(catchError(() => of(null)))),
            map((res) => this._outcomeFromState(res)),
            filter((x): x is 'paid' | 'cancelled' => x === 'paid' || x === 'cancelled'),
            take(1),
            map((st) => (st === 'cancelled' ? 'cancelled' as const : 'paid' as const)),
        );

        const timeout$ = timer(timeoutMs).pipe(
            take(1),
            map((): AbaSettled => 'timeout'),
        );

        return race(fromPoll$, timeout$);
    }

    private _outcomeFromState(res: unknown): 'wait' | 'paid' | 'cancelled' {
        if (res == null || typeof res !== 'object') {
            return 'wait';
        }
        const d = (res as { data?: { order_status?: string; aba_transaction_status?: string | null } }).data;
        if (d == null) {
            return 'wait';
        }
        const os = (d.order_status ?? '').toLowerCase();
        const ts = (d.aba_transaction_status ?? '').toLowerCase();
        if (ts === 'success') {
            return 'paid';
        }
        if (ts === 'expired' || ts === 'failed' || ts === 'cancelled') {
            return 'cancelled';
        }
        if (os === 'cancelled') {
            return 'cancelled';
        }
        return 'wait';
    }
}
