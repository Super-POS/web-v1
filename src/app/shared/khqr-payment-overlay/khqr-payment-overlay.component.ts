import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QRCodeComponent } from 'angularx-qrcode';

/**
 * Official NBC KHQR card overlay — shared by cashier checkout and the invoice
 * "Pay with Bakong KHQR" drawer so both surfaces always look identical.
 */
@Component({
    selector: 'app-khqr-payment-overlay',
    standalone: true,
    templateUrl: './khqr-payment-overlay.component.html',
    styleUrl: './khqr-payment-overlay.component.scss',
    imports: [NgIf, MatButtonModule, MatProgressSpinnerModule, QRCodeComponent],
})
export class KhqrPaymentOverlayComponent {
    @Input() qrData: string | null = null;
    @Input() merchantName = 'KHQR';
    @Input() merchantCity = '';
    /** Pre-formatted amount without currency suffix (e.g. "2.50" or "4,000"). */
    @Input() displayAmount = '';
    @Input() currency: 'USD' | 'KHR' = 'KHR';
    /** True while POST payment-intent is in flight and the QR string is not ready yet. */
    @Input() generating = false;
    @Input() dismissLabel: 'Cancel' | 'Close' = 'Cancel';
    /** Invoice drawer stacks above checkout (120 vs 100). */
    @Input() overlayZIndex = 100;

    @Output() dismissed = new EventEmitter<void>();

    onDismiss(): void {
        this.dismissed.emit();
    }
}
