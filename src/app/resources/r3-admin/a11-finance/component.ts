import { CommonModule, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { format } from 'date-fns';
import { ExchangeRateSettingService } from 'helper/services/exchange-rate-setting/exchange-rate-setting.service';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { UsdFromKhrPipe } from 'helper/pipes/usd-from-khr.pipe';
import { PosBreadcrumbComponent, PosListPageComponent } from 'app/shared/list-page';
import {
    ChannelBreakdownRow,
    FinanceGranularity,
    FinancePeriodPreset,
    FinancialReportData,
    PaymentBreakdownRow,
    RevenueSeriesRow,
    TopMenuRow,
} from './interface';
import { AdminFinanceService } from './service';

type PeriodOption = { id: FinancePeriodPreset; label: string; group: 'day' | 'month' | 'year' | 'custom' };

@Component({
    selector: 'app-admin-finance-hub',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        PosListPageComponent,
        PosBreadcrumbComponent,
        CommonModule,
        NgIf,
        NgFor,
        NgClass,
        FormsModule,
        RouterModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTableModule,
        DecimalPipe,
        UsdFromKhrPipe,
    ],
})
export class AdminFinanceHubComponent implements OnInit {
    readonly periodOptions: PeriodOption[] = [
        { id: 'today', label: 'Today', group: 'day' },
        { id: 'yesterday', label: 'Yesterday', group: 'day' },
        { id: 'thisWeek', label: 'This week', group: 'day' },
        { id: 'thisMonth', label: 'This month', group: 'month' },
        { id: 'threeMonthAgo', label: 'Last 3 months', group: 'month' },
        { id: 'thisYear', label: 'This year', group: 'year' },
        { id: 'sixMonthAgo', label: 'Last 6 months', group: 'year' },
        { id: 'custom', label: 'Custom', group: 'custom' },
    ];

    readonly granularityOptions: { id: FinanceGranularity; label: string }[] = [
        { id: 'daily', label: 'Daily' },
        { id: 'weekly', label: 'Weekly' },
        { id: 'monthly', label: 'Monthly' },
    ];

    readonly paymentColumns = ['method', 'transactions', 'amount'] as const;
    readonly channelColumns = ['channel', 'orders', 'revenue'] as const;
    readonly topMenuColumns = ['rank', 'item', 'qty', 'revenue'] as const;
    readonly trendColumns = ['period', 'orders', 'revenue'] as const;

    activePreset: FinancePeriodPreset = 'thisMonth';
    activeGroup: 'day' | 'month' | 'year' | 'custom' = 'month';
    granularity: FinanceGranularity = 'daily';
    customFrom = this._firstOfMonth();
    customTo = this._today();

    report: FinancialReportData | null = null;
    isLoading = false;
    hasLoaded = false;
    usdRate = ExchangeRateSettingService.FALLBACK_KHR_PER_USD;

    constructor(
        private service: AdminFinanceService,
        private snackBar: SnackbarService,
        private cdr: ChangeDetectorRef,
        private exchangeRates: ExchangeRateSettingService,
    ) {}

    ngOnInit(): void {
        this.exchangeRates.fetchAdmin().subscribe({
            next: () => {
                this.usdRate = this.exchangeRates.khrPerUsd;
                this.cdr.markForCheck();
            },
            error: () => {
                this.usdRate = this.exchangeRates.khrPerUsd;
                this.cdr.markForCheck();
            },
        });
        this.loadReport();
    }

    setGroup(group: 'day' | 'month' | 'year' | 'custom'): void {
        this.activeGroup = group;
        if (group === 'custom') {
            this.activePreset = 'custom';
            return;
        }
        const first = this.periodOptions.find((p) => p.group === group);
        if (first) {
            this.selectPreset(first.id);
        }
    }

    selectPreset(preset: FinancePeriodPreset): void {
        this.activePreset = preset;
        const option = this.periodOptions.find((p) => p.id === preset);
        if (option && option.group !== 'custom') {
            this.activeGroup = option.group;
        }
        if (preset !== 'custom') {
            this.granularity = this._defaultGranularity(preset);
            this.loadReport();
        }
    }

    applyCustomRange(): void {
        this.activePreset = 'custom';
        this.activeGroup = 'custom';
        this.granularity = this._granularityForCustomRange();
        this.loadReport();
    }

    setGranularity(value: FinanceGranularity): void {
        this.granularity = value;
        this.loadReport();
    }

    loadReport(): void {
        this.isLoading = true;
        const query = this._buildQuery();
        this.service.getReport(query).subscribe({
            next: (res) => {
                this.report = res.data;
                this.isLoading = false;
                this.hasLoaded = true;
                this.cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this.hasLoaded = true;
                this.report = null;
                this.snackBar.openSnackBar(
                    err?.error?.message ?? GlobalConstants.genericError,
                    GlobalConstants.error,
                );
                this.cdr.markForCheck();
            },
        });
    }

    periodLabel(): string {
        if (!this.report?.period) {
            return '';
        }
        const from = new Date(this.report.period.from);
        const to = new Date(this.report.period.to);
        return `${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`;
    }

    formatPeriod(value: string): string {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) {
            return value;
        }
        const grain = this.report?.revenue_series?.granularity ?? this.granularity;
        if (grain === 'monthly') {
            return format(d, 'MMM yyyy');
        }
        if (grain === 'weekly') {
            return `Week of ${format(d, 'MMM d')}`;
        }
        return format(d, 'MMM d');
    }

    formatMethod(method: string | null | undefined): string {
        const m = (method ?? '').toLowerCase();
        if (m === 'cash') return 'Cash';
        if (m === 'bakong') return 'Bakong / KHQR';
        if (m === 'wallet') return 'Wallet';
        if (m === 'card') return 'Card';
        return method ?? '—';
    }

    formatChannel(channel: string | null | undefined): string {
        const c = (channel ?? '').toLowerCase();
        if (c === 'pos') return 'POS';
        if (c === 'online') return 'Online';
        if (c === 'customer') return 'Customer app';
        return channel ?? '—';
    }

    menuName(row: TopMenuRow): string {
        return row.menu?.name ?? `Menu #${row.menu_id}`;
    }

    maxRevenue(rows: RevenueSeriesRow[]): number {
        if (!rows.length) {
            return 0;
        }
        return Math.max(...rows.map((r) => Number(r.revenue) || 0));
    }

    barWidth(value: number, max: number): string {
        if (!max) {
            return '0%';
        }
        return `${Math.max(2, Math.round((value / max) * 100))}%`;
    }

    maxPaymentAmount(rows: PaymentBreakdownRow[]): number {
        if (!rows.length) {
            return 0;
        }
        return Math.max(...rows.map((r) => Number(r.total_amount) || 0));
    }

    maxChannelRevenue(rows: ChannelBreakdownRow[]): number {
        if (!rows.length) {
            return 0;
        }
        return Math.max(...rows.map((r) => Number(r.revenue) || 0));
    }

    get paymentColumnsArr(): string[] {
        return [...this.paymentColumns];
    }

    get channelColumnsArr(): string[] {
        return [...this.channelColumns];
    }

    get topMenuColumnsArr(): string[] {
        return [...this.topMenuColumns];
    }

    get trendColumnsArr(): string[] {
        return [...this.trendColumns];
    }

    private _buildQuery() {
        const today = format(new Date(), 'yyyy-MM-dd');
        const granularity = this.granularity;

        if (this.activePreset === 'custom') {
            return { from: this.customFrom, to: this.customTo, granularity };
        }
        if (this.activePreset === 'today') {
            return { today, granularity: 'daily' as const };
        }
        if (this.activePreset === 'yesterday') {
            const y = new Date();
            y.setDate(y.getDate() - 1);
            return { yesterday: format(y, 'yyyy-MM-dd'), granularity: 'daily' as const };
        }
        if (this.activePreset === 'thisWeek') {
            const d = new Date();
            d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
            return { thisWeek: format(d, 'yyyy-MM-dd'), granularity };
        }
        if (this.activePreset === 'thisMonth') {
            return { thisMonth: '1', granularity };
        }
        if (this.activePreset === 'thisYear') {
            return { thisYear: '1', granularity: 'monthly' as const };
        }
        if (this.activePreset === 'threeMonthAgo') {
            return { threeMonthAgo: '1', granularity: 'weekly' as const };
        }
        if (this.activePreset === 'sixMonthAgo') {
            return { sixMonthAgo: '1', granularity: 'monthly' as const };
        }
        return { thisMonth: '1', granularity };
    }

    private _defaultGranularity(preset: FinancePeriodPreset): FinanceGranularity {
        if (preset === 'today' || preset === 'yesterday') {
            return 'daily';
        }
        if (preset === 'thisYear' || preset === 'sixMonthAgo') {
            return 'monthly';
        }
        if (preset === 'threeMonthAgo') {
            return 'weekly';
        }
        return 'daily';
    }

    private _granularityForCustomRange(): FinanceGranularity {
        const start = new Date(this.customFrom);
        const end = new Date(this.customTo);
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 365) {
            return 'monthly';
        }
        if (diffDays > 60) {
            return 'weekly';
        }
        return 'daily';
    }

    private _today(): string {
        return format(new Date(), 'yyyy-MM-dd');
    }

    private _firstOfMonth(): string {
        const d = new Date();
        d.setDate(1);
        return format(d, 'yyyy-MM-dd');
    }
}
