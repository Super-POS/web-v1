/** Baray payment disabled — entire service commented out below. Re-enable when Baray returns. */
/*
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

  waitUntilSettled(orderId: number, _cashierId?: number): Observable<BaraySettled> {
    this._ensureSocket();

    const fromWs$ = this.fromSocket$.pipe(
      filter((p) => p.orderId === orderId),
      map((): 'paid' => 'paid'),
      take(1),
    );

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
*/
