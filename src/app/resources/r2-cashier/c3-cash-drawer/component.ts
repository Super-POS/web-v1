import { CommonModule, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { CashDrawer, ChangeBreakdown, Denominations, MakeChangeResponse } from './interface';
import { CashierCashDrawerService } from './service';

interface DenomRow {
    label: string;
    key: keyof Denominations;
    currency: 'USD' | 'KHR';
    value: number;
    count: number;
    total: number;
}

interface BreakdownItem {
    label: string;
    count: number;
    currency: 'USD' | 'KHR';
}

const USD_DENOMS: { label: string; key: keyof Denominations; value: number }[] = [
    { label: '$1',   key: 'usd_1',   value: 1   },
    { label: '$5',   key: 'usd_5',   value: 5   },
    { label: '$20',  key: 'usd_20',  value: 20  },
    { label: '$50',  key: 'usd_50',  value: 50  },
    { label: '$100', key: 'usd_100', value: 100 },
];

const KHR_DENOMS: { label: string; key: keyof Denominations; value: number }[] = [
    { label: '100 ៛',     key: 'khr_100',    value: 100    },
    { label: '200 ៛',     key: 'khr_200',    value: 200    },
    { label: '500 ៛',     key: 'khr_500',    value: 500    },
    { label: '1,000 ៛',   key: 'khr_1000',   value: 1000   },
    { label: '2,000 ៛',   key: 'khr_2000',   value: 2000   },
    { label: '5,000 ៛',   key: 'khr_5000',   value: 5000   },
    { label: '10,000 ៛',  key: 'khr_10000',  value: 10000  },
    { label: '15,000 ៛',  key: 'khr_15000',  value: 15000  },
    { label: '20,000 ៛',  key: 'khr_20000',  value: 20000  },
    { label: '30,000 ៛',  key: 'khr_30000',  value: 30000  },
    { label: '50,000 ៛',  key: 'khr_50000',  value: 50000  },
    { label: '100,000 ៛', key: 'khr_100000', value: 100000 },
    { label: '200,000 ៛', key: 'khr_200000', value: 200000 },
];

const ALL_DENOM_MAP: Record<string, { label: string; currency: 'USD' | 'KHR' }> = {};
USD_DENOMS.forEach(d => ALL_DENOM_MAP[d.key] = { label: d.label, currency: 'USD' });
KHR_DENOMS.forEach(d => ALL_DENOM_MAP[d.key] = { label: d.label, currency: 'KHR' });

function flatCount(obj: any, key: string): number {
    return Number(obj?.[key]) || 0;
}

@Component({
    selector: 'app-cashier-cash-drawer',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        CommonModule,
        NgIf,
        NgFor,
        DatePipe,
        DecimalPipe,
        FormsModule,
        MatTabsModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
    ],
})
export class CashierCashDrawerComponent implements OnInit {

    constructor(
        private service: CashierCashDrawerService,
        private snackBar: SnackbarService,
        private cdr: ChangeDetectorRef,
    ) {}

    readonly usdDenoms = USD_DENOMS;
    readonly khrDenoms = KHR_DENOMS;

    // ── Current tab ───────────────────────────────────────────────────────────
    currentDrawer: CashDrawer | null = null;
    loadingCurrent = false;
    usdRows: DenomRow[] = [];
    khrRows: DenomRow[] = [];

    // ── Make Change tab ───────────────────────────────────────────────────────
    orderId: number | null = null;
    exchangeRate: number = 4100;
    receivedDenoms: Record<string, number> = this.initReceivedDenoms();
    changeNote = '';
    submittingChange = false;
    changeResult: MakeChangeResponse['data'] | null = null;
    changeBreakdownItems: BreakdownItem[] = [];

    private initReceivedDenoms(): Record<string, number> {
        const obj: Record<string, number> = {};
        [...USD_DENOMS, ...KHR_DENOMS].forEach(d => { obj[d.key] = 0; });
        return obj;
    }

    ngOnInit(): void {
        this.loadCurrent();
    }

    // ── Current ───────────────────────────────────────────────────────────────
    loadCurrent(): void {
        this.loadingCurrent = true;
        this.service.getCurrent().subscribe({
            next: (res) => {
                this.currentDrawer = res.data;
                this.usdRows = USD_DENOMS.map(item => {
                    const count = flatCount(res.data, item.key);
                    return { ...item, currency: 'USD' as const, count, total: count * item.value };
                });
                this.khrRows = KHR_DENOMS.map(item => {
                    const count = flatCount(res.data, item.key);
                    return { ...item, currency: 'KHR' as const, count, total: count * item.value };
                });
                this.loadingCurrent = false;
                this.cdr.detectChanges();
            },
            error: (err: HttpErrorResponse) => {
                this.loadingCurrent = false;
                this.snackBar.openSnackBar(err.error?.message || GlobalConstants.genericError, GlobalConstants.error);
                this.cdr.detectChanges();
            },
        });
    }

    get drawerTotalUsd(): number {
        return this.usdRows.reduce((s, r) => s + r.total, 0);
    }

    get drawerTotalKhr(): number {
        return this.khrRows.reduce((s, r) => s + r.total, 0);
    }

    // ── Make Change ───────────────────────────────────────────────────────────
    increment(denoms: Record<string, number>, key: string): void {
        denoms[key] = (denoms[key] || 0) + 1;
        this.changeResult = null;
    }

    decrement(denoms: Record<string, number>, key: string): void {
        denoms[key] = Math.max(0, (denoms[key] || 0) - 1);
        this.changeResult = null;
    }

    get receivedUsdTotal(): number {
        return USD_DENOMS.reduce((s, d) => s + (this.receivedDenoms[d.key] || 0) * d.value, 0);
    }

    get receivedKhrTotal(): number {
        return KHR_DENOMS.reduce((s, d) => s + (this.receivedDenoms[d.key] || 0) * d.value, 0);
    }

    submitMakeChange(): void {
        if (!this.orderId || this.orderId <= 0) {
            this.snackBar.openSnackBar('Please enter a valid Order ID.', GlobalConstants.error);
            return;
        }
        const nonZero = Object.fromEntries(
            Object.entries(this.receivedDenoms).filter(([, v]) => v > 0)
        );
        if (Object.keys(nonZero).length === 0) {
            this.snackBar.openSnackBar('Please enter the denominations received from the customer.', GlobalConstants.error);
            return;
        }
        this.submittingChange = true;
        this.changeResult = null;
        this.service.makeChange({
            order_id: this.orderId,
            exchange_rate: this.exchangeRate,
            received: nonZero,
            note: this.changeNote,
        }).subscribe({
            next: (res) => {
                this.submittingChange = false;
                this.changeResult = res.data;
                this.changeBreakdownItems = this.buildBreakdown(res.data.change_breakdown);
                this.snackBar.openSnackBar(res.message || 'Change calculated successfully', GlobalConstants.success);
                this.loadCurrent();
            },
            error: (err: HttpErrorResponse) => {
                this.submittingChange = false;
                this.snackBar.openSnackBar(err.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    private buildBreakdown(breakdown: ChangeBreakdown): BreakdownItem[] {
        if (!breakdown) return [];
        return Object.entries(breakdown)
            .filter(([, count]) => count > 0)
            .map(([key, count]) => ({
                label: ALL_DENOM_MAP[key]?.label ?? key,
                count,
                currency: ALL_DENOM_MAP[key]?.currency ?? 'KHR',
            }));
    }

    resetChange(): void {
        this.orderId = null;
        this.exchangeRate = 4100;
        [...USD_DENOMS, ...KHR_DENOMS].forEach(d => { this.receivedDenoms[d.key] = 0; });
        this.changeNote = '';
        this.changeResult = null;
        this.changeBreakdownItems = [];
    }
}
