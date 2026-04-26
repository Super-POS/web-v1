// ================================================================>> Core Library
import { Injectable } from '@angular/core';

// ================================================================>> Third-Party
import { io, type Socket } from 'socket.io-client';
import { Observable, Subject, of, race, timer, interval } from 'rxjs';
import { map, take, filter, startWith, exhaustMap, catchError } from 'rxjs/operators';

// ================================================================>> Custom
import { env } from 'envs/env';
import { OrderService } from './service';

export type BaraySettled = 'paid' | 'cancelled' | 'timeout';

export interface BarayPaymentSuccessEvent {
  orderId: number;
  receiptNumber: string;
  cashierId: number;
}

@Injectable({ providedIn: 'root' })
export class BarayPaidWatcherService {
  private socket: Socket | undefined;
  private readonly fromSocket$ = new Subject<BarayPaymentSuccessEvent>();

  constructor(private readonly _orders: OrderService) {}

  /**
   * Resolves when Baray payment is recorded (webhook) or the order is no longer `awaiting_payment`
   * (e.g. cancelled). Real-time from Socket.IO (matched by orderId only — cashierId can differ if UI user
   * was not loaded yet). HTTP polling every 1.5s to `/baray/order/:id/payment-state` (order row + baray tx
   * success — not the heavy sales view, avoids client cache / odd JSON). Max 5 minutes.
   */
  waitUntilSettled(orderId: number, _cashierId?: number): Observable<BaraySettled> {
    this._ensureSocket();

    const fromWs$ = this.fromSocket$.pipe(
      filter((p) => p.orderId === orderId),
      map((): 'paid' => 'paid'),
      take(1),
    );

    // exhaustMap: do not start a new poll until the last GET finishes (switchMap can cancel slow responses).
    const fromPoll$ = interval(1_500).pipe(
      startWith(0),
      exhaustMap(() => this._orders.getBarayPaymentState(orderId).pipe(catchError(() => of(null)))),
      map((res) => this._barayOutcomeFromState(res)),
      filter((x): x is 'paid' | 'cancelled' => x === 'paid' || x === 'cancelled'),
      take(1),
      map((st) => (st === 'cancelled' ? 'cancelled' as const : 'paid' as const)),
    );

    const timeout$ = timer(5 * 60_000).pipe(
      take(1),
      map((): BaraySettled => 'timeout'),
    );

    return race(fromWs$, fromPoll$, timeout$);
  }

  /**
   * `baray_transaction_status === 'success'` means the webhook updated the row even if the order status
   * is still out of date in edge cases.
   */
  private _barayOutcomeFromState(res: unknown): 'wait' | 'paid' | 'cancelled' {
    if (res == null || typeof res !== 'object') {
      return 'wait';
    }
    const d = (res as { data?: { order_status?: string; baray_transaction_status?: string | null } })
      .data;
    if (d == null) {
      return 'wait';
    }
    const os = (d.order_status ?? "").toLowerCase();
    const bts = (d.baray_transaction_status ?? "").toLowerCase();
    if (bts === "success") {
      return "paid";
    }
    if (os === "cancelled") {
      return "cancelled";
    }
    if (os === "awaiting_payment") {
      return "wait";
    }
    return "paid";
  }

  private _socketBaseUrl(): string {
    const raw = (env as { API_BASE_URL?: string }).API_BASE_URL || '';
    if (!raw) {
      return 'http://127.0.0.1:9003';
    }
    return raw.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }

  private _ensureSocket(): void {
    if (this.socket?.connected) {
      return;
    }
    const base = this._socketBaseUrl();
    this.socket = io(`${base}/notifications-getway`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    this.socket.on('baray-payment-success', (p: BarayPaymentSuccessEvent) => {
      if (p == null || typeof p !== 'object') {
        return;
      }
      // Socket.io may deliver JSON numbers as strings — normalize before match / filters.
      const orderId = Number((p as { orderId?: unknown }).orderId);
      if (!Number.isFinite(orderId)) {
        return;
      }
      const cashierId = Number(
        (p as { cashierId?: unknown }).cashierId != null
          ? (p as { cashierId: unknown }).cashierId
          : 0,
      );
      this.fromSocket$.next({
        orderId,
        receiptNumber: String((p as { receiptNumber?: unknown }).receiptNumber ?? ''),
        cashierId: Number.isFinite(cashierId) ? cashierId : 0,
      });
    });
  }
}
