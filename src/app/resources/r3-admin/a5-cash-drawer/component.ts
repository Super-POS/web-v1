import { CommonModule, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { CashDrawer, Denominations, TransactionLog } from './interface';
import { AdminCashDrawerService } from './service';

interface DenomRow {
    label: string;
    key: keyof Denominations;
    currency: 'USD' | 'KHR';
    value: number;
    count: number;
    total: number;
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

function flatCount(obj: any, key: string): number {
    return Number(obj?.[key]) || 0;
}

@Component({
    selector: 'app-admin-cash-drawer',
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
        MatTableModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
    ],
})
export class AdminCashDrawerComponent implements OnInit {

    constructor(
        private service: AdminCashDrawerService,
        private snackBar: SnackbarService,
        private cdr: ChangeDetectorRef,
    ) {}

    readonly usdDenoms = USD_DENOMS;
    readonly khrDenoms = KHR_DENOMS;

    // ── Current tab ──────────────────────────────────────────────────────────
    currentDrawer: CashDrawer | null = null;
    loadingCurrent = false;
    usdRows: DenomRow[] = [];
    khrRows: DenomRow[] = [];

    // ── Deposit tab ───────────────────────────────────────────────────────────
    depositDenoms: Record<string, number> = this.initDenoms();
    depositNote = '';
    submittingDeposit = false;

    private initDenoms(): Record<string, number> {
        const obj: Record<string, number> = {};
        [...USD_DENOMS, ...KHR_DENOMS].forEach(d => { obj[d.key] = 0; });
        return obj;
    }

    // ── Logs tab ──────────────────────────────────────────────────────────────
    logsDataSource = new MatTableDataSource<TransactionLog>([]);
    logsColumns = ['no', 'type', 'usd_total', 'khr_total', 'note', 'cashier', 'created_at'];
    loadingLogs = false;
    logsPage = 1;
    logsLimit = 20;
    logsTotal = 0;

    ngOnInit(): void {
        this.loadCurrent();
        this.loadLogs();
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

    // ── Deposit ───────────────────────────────────────────────────────────────
    increment(denoms: Record<string, number>, key: string): void {
        denoms[key] = (denoms[key] || 0) + 1;
    }

    decrement(denoms: Record<string, number>, key: string): void {
        denoms[key] = Math.max(0, (denoms[key] || 0) - 1);
    }

    get depositUsdTotal(): number {
        return USD_DENOMS.reduce((s, d) => s + (this.depositDenoms[d.key] || 0) * d.value, 0);
    }

    get depositKhrTotal(): number {
        return KHR_DENOMS.reduce((s, d) => s + (this.depositDenoms[d.key] || 0) * d.value, 0);
    }

    submitDeposit(): void {
        const nonZero = Object.fromEntries(
            Object.entries(this.depositDenoms).filter(([, v]) => v > 0)
        );
        if (Object.keys(nonZero).length === 0) {
            this.snackBar.openSnackBar('Please enter at least one denomination.', GlobalConstants.error);
            return;
        }
        this.submittingDeposit = true;
        this.service.deposit({ denominations: nonZero, note: this.depositNote }).subscribe({
            next: (res) => {
                this.submittingDeposit = false;
                this.snackBar.openSnackBar(res.message || 'Deposit successful', GlobalConstants.success);
                this.resetDeposit();
                this.loadCurrent();
                this.loadLogs();
            },
            error: (err: HttpErrorResponse) => {
                this.submittingDeposit = false;
                this.snackBar.openSnackBar(err.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    resetDeposit(): void {
        [...USD_DENOMS, ...KHR_DENOMS].forEach(d => { this.depositDenoms[d.key] = 0; });
        this.depositNote = '';
    }

    // ── Logs ──────────────────────────────────────────────────────────────────
    loadLogs(): void {
        this.loadingLogs = true;
        this.service.getLogs(this.logsPage, this.logsLimit).subscribe({
            next: (res) => {
                this.logsDataSource.data = res.data ?? [];
                this.logsTotal = res.pagination?.total ?? 0;
                this.loadingLogs = false;
                this.cdr.detectChanges();
            },
            error: (err: HttpErrorResponse) => {
                this.loadingLogs = false;
                this.snackBar.openSnackBar(err.error?.message || GlobalConstants.genericError, GlobalConstants.error);
                this.cdr.detectChanges();
            },
        });
    }

    onLogsPageChanged(event: PageEvent): void {
        this.logsPage = event.pageIndex + 1;
        this.logsLimit = event.pageSize;
        this.loadLogs();
    }

    logUsdTotal(log: TransactionLog): number {
        return USD_DENOMS.reduce((s, d) => s + flatCount(log, d.key) * d.value, 0);
    }

    logKhrTotal(log: TransactionLog): number {
        return KHR_DENOMS.reduce((s, d) => s + flatCount(log, d.key) * d.value, 0);
    }

    typeLabel(type: string): string {
        if (type === 'deposit')  return 'Deposit';
        if (type === 'change')   return 'Change';
        if (type === 'withdraw') return 'Withdraw';
        return type;
    }

    typeClass(type: string): string {
        if (type === 'deposit') return 'text-emerald-600';
        if (type === 'change')  return 'text-amber-600';
        return 'text-gray-500';
    }
}
