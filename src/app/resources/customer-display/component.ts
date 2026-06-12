// ================================================================>> Core Library
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';

// ================================================================>> Third-Party
import { QRCodeComponent } from 'angularx-qrcode';
import { io, Socket } from 'socket.io-client';

// ================================================================>> Custom
import { env } from 'envs/env';

interface QrState {
    screen: 'qr';
    type: 'khqr'; // | 'baray'
    qrString: string;
    amount: number;
    currency: string;
    expiresAt: Date;
    merchantName?: string;
    merchantCity?: string;
}

type DisplayState = { screen: 'idle' } | QrState;

@Component({
    selector: 'app-customer-display',
    standalone: true,
    templateUrl: './template.html',
    imports: [CommonModule, QRCodeComponent],
})
export class CustomerDisplayComponent implements OnInit, OnDestroy {
    state: DisplayState = { screen: 'idle' };
    secondsLeft = 0;

    private socket!: Socket;
    private expiryTimer: ReturnType<typeof setInterval> | null = null;

    constructor(
        private readonly _cdr: ChangeDetectorRef,
        private readonly _zone: NgZone,
    ) {}

    ngOnInit(): void {
        const base = ((env as { API_BASE_URL?: string }).API_BASE_URL ?? '')
            .replace(/\/api\/?$/, '')
            .replace(/\/$/, '') || 'http://127.0.0.1:9003';

        this.socket = io(`${base}/notifications-getway`, {
            transports: ['websocket', 'polling'],
            reconnection: true,
        });

        this.socket.on('customer-display:show-khqr', (data: {
            orderId: number;
            qr: string;
            amount: number;
            currency: string;
            expires_at: string;
            merchant_name: string;
            merchant_city: string;
        }) => {
            this._zone.run(() => {
                this._showQr({
                    screen: 'qr',
                    type: 'khqr',
                    qrString: data.qr,
                    amount: data.amount,
                    currency: data.currency,
                    expiresAt: new Date(data.expires_at),
                    merchantName: data.merchant_name,
                    merchantCity: data.merchant_city,
                });
            });
        });

        /* Baray disabled
        this.socket.on('customer-display:show-baray', (data: {
            orderId: number;
            url: string;
            amount_usd: number;
            expires_at: string;
        }) => {
            this._zone.run(() => {
                this._showQr({
                    screen: 'qr',
                    type: 'baray',
                    qrString: data.url,
                    amount: data.amount_usd,
                    currency: 'USD',
                    expiresAt: new Date(data.expires_at),
                });
            });
        });
        */

        this.socket.on('customer-display:clear', () => {
            this._zone.run(() => this._goIdle());
        });
    }

    ngOnDestroy(): void {
        this._clearExpiryTimer();
        this.socket?.disconnect();
    }

    get isIdle(): boolean {
        return this.state.screen === 'idle';
    }

    get qrState(): QrState | null {
        return this.state.screen === 'qr' ? this.state : null;
    }

    private _showQr(next: QrState): void {
        this._clearExpiryTimer();
        this.state = next;
        this._startCountdown(next.expiresAt);
        this._cdr.markForCheck();
    }

    private _goIdle(): void {
        this._clearExpiryTimer();
        this.state = { screen: 'idle' };
        this._cdr.markForCheck();
    }

    private _startCountdown(expiresAt: Date): void {
        const tick = (): void => {
            const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
            this.secondsLeft = remaining;
            this._cdr.markForCheck();
            if (remaining === 0) {
                this._goIdle();
            }
        };
        tick();
        this.expiryTimer = setInterval(tick, 1000);
    }

    private _clearExpiryTimer(): void {
        if (this.expiryTimer !== null) {
            clearInterval(this.expiryTimer);
            this.expiryTimer = null;
        }
    }

    formatCountdown(seconds: number): string {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
}
