import { DecimalPipe, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QRCodeComponent } from 'angularx-qrcode';
import { UsdFromKhrPipe } from 'helper/pipes/usd-from-khr.pipe';

@Component({
    selector: 'app-aba-payment-panel',
    standalone: true,
    templateUrl: './aba-payment-sample.component.html',
    styleUrl: './aba-payment-sample.component.scss',
    imports: [QRCodeComponent, DecimalPipe, NgIf, UsdFromKhrPipe, MatProgressSpinnerModule],
})
export class AbaPaymentPanelComponent {
    @Input() totalPriceKhr = 0;
    @Input() exchangeRate = 4100;
    @Input() merchantName = 'CLUB 54 POS';
    @Input() merchantCity = 'Phnom Penh';
    @Input() qrData: string | null = null;
    @Input() generating = false;
    @Input() isAwaitingPayment = false;
    @Input() merchantRef: string | null = null;
    @Input() expiresLabel: string | null = null;
}
