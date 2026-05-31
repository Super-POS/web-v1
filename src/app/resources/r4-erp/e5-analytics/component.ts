import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { forkJoin } from 'rxjs';
import { PosBreadcrumbComponent, PosListPageComponent } from 'app/shared/list-page';
import { ErpAnalyticsDashboard, ErpProfitByProduct, ErpSalesTrendPoint } from './interface';
import { ErpAnalyticsService } from './service';

export type ErpViewMode = 'day' | 'week' | 'month' | 'range';

type ViewModeOption = { id: ErpViewMode; label: string };

@Component({
    selector: 'erp-analytics',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        PosListPageComponent,
        PosBreadcrumbComponent,
        CommonModule,
        FormsModule,
        RouterModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTableModule,
        MatTabsModule,
        MatDatepickerModule,
        MatNativeDateModule,
    ],
    providers: [DecimalPipe],
})
export class ErpAnalyticsComponent implements OnInit {
    readonly viewModes: ViewModeOption[] = [
        { id: 'day', label: 'Day' },
        { id: 'week', label: 'Week' },
        { id: 'month', label: 'Month' },
        { id: 'range', label: 'Range' },
    ];

    readonly bestSellerColumns = ['rank', 'menu_name', 'total_qty', 'total_revenue'] as const;
    readonly profitColumns     = ['menu_name', 'revenue', 'cogs', 'gross_profit', 'margin_pct'] as const;
    readonly wasteColumns      = ['ingredient_name', 'waste_qty', 'waste_pct', 'waste_cost'] as const;

    viewMode: ErpViewMode = 'day';

    selectedDate = new Date();
    maxDate      = new Date();
    startDate    = this._formatDate(new Date());
    endDate      = this.startDate;

    rangeFrom = this.startDate;
    rangeTo   = this.endDate;

    dashboard: ErpAnalyticsDashboard | null = null;
    profitByProduct: ErpProfitByProduct[]   = [];

    isLoading = false;
    hasLoaded = false;

    constructor(
        private service: ErpAnalyticsService,
        private snackBar: SnackbarService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this._applyRangeFromAnchor(this.selectedDate);
        this._load();
    }

    setViewMode(mode: ErpViewMode): void {
        if (this.viewMode === mode) { return; }
        this.viewMode = mode;
        if (mode === 'range') {
            this.rangeFrom = this.startDate;
            this.rangeTo   = this.endDate;
            return;
        }
        this._applyRangeFromAnchor(this.selectedDate);
        this._load();
    }

    onDateSelected(date: Date | null): void {
        if (!date || this.viewMode === 'range') { return; }
        this.selectedDate = date;
        this._applyRangeFromAnchor(date);
        this._load();
    }

    goToday(): void {
        const today = new Date();
        this.selectedDate = today;
        if (this.viewMode === 'range') {
            this.rangeFrom = this._formatDate(today);
            this.rangeTo   = this.rangeFrom;
            this.applyCustomRange();
            return;
        }
        this._applyRangeFromAnchor(today);
        this._load();
    }

    applyCustomRange(): void {
        if (!this.rangeFrom || !this.rangeTo) {
            this.snackBar.openSnackBar('Select both start and end dates.', GlobalConstants.error);
            return;
        }
        if (this.rangeFrom > this.rangeTo) {
            this.snackBar.openSnackBar('Start date must be before end date.', GlobalConstants.error);
            return;
        }
        if (this.rangeTo > this._formatDate(this.maxDate)) {
            this.snackBar.openSnackBar('End date cannot be in the future.', GlobalConstants.error);
            return;
        }
        this.startDate = this.rangeFrom;
        this.endDate   = this.rangeTo;
        this._load();
    }

    refresh(): void {
        this._load();
    }

    periodLabel(): string {
        if (this.viewMode === 'day' || this.startDate === this.endDate) {
            return this._displayDate(this.startDate);
        }
        return `${this._displayDate(this.startDate, false)} — ${this._displayDate(this.endDate, false)}`;
    }

    calendarHint(): string {
        switch (this.viewMode) {
            case 'day':   return 'Pick a day';
            case 'week':  return 'Pick any day in the week';
            case 'month': return 'Pick any day in the month';
            default:      return '';
        }
    }

    formatPeriod(value: string): string {
        if (!value) { return '—'; }
        try {
            return format(parseISO(value.slice(0, 10)), 'dd MMM yyyy');
        } catch {
            return value;
        }
    }

    barWidth(value: number, max: number): string {
        if (!max || value <= 0) { return '0%'; }
        return `${Math.max(2, Math.round((value / max) * 100))}%`;
    }

    maxTrendRevenue(rows: ErpSalesTrendPoint[] | undefined): number {
        if (!rows?.length) { return 0; }
        return Math.max(...rows.map(r => Number(r.total_revenue) || 0));
    }

    totalOrders(): number {
        return (this.dashboard?.sales_trend ?? []).reduce((s, r) => s + (Number(r.order_count) || 0), 0);
    }

    getHourLabel(hour: number): string {
        if (hour === 0)  { return '12 AM'; }
        if (hour < 12)   { return `${hour} AM`; }
        if (hour === 12) { return '12 PM'; }
        return `${hour - 12} PM`;
    }

    maxPeakOrderCount(): number {
        if (!this.dashboard?.peak_hours?.length) { return 0; }
        return Math.max(...this.dashboard.peak_hours.map(h => h.order_count));
    }

    marginBadgeClass(pct: number): string {
        if (pct >= 60) { return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'; }
        if (pct >= 30) { return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'; }
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }

    netProfitClass(): string {
        const v = this.dashboard?.financials?.net_profit ?? 0;
        return v >= 0
            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
    }

    get maxDateIso(): string {
        return this._formatDate(this.maxDate);
    }

    get bestSellerColumnsArr(): string[] { return [...this.bestSellerColumns]; }
    get profitColumnsArr(): string[]     { return [...this.profitColumns]; }
    get wasteColumnsArr(): string[]      { return [...this.wasteColumns]; }

    private _load(): void {
        this.isLoading = true;
        const params = { start_date: this.startDate, end_date: this.endDate };

        forkJoin({
            dashboard: this.service.getDashboard(params),
            profit:    this.service.getProfitByProduct(params),
        }).subscribe({
            next: ({ dashboard, profit }) => {
                this.dashboard       = dashboard.data;
                this.profitByProduct  = profit.data || [];
                this.isLoading       = false;
                this.hasLoaded       = true;
                this.cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this.hasLoaded = true;
                this.dashboard = null;
                this.snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
                this.cdr.markForCheck();
            },
        });
    }

    private _applyRangeFromAnchor(date: Date): void {
        const today = this._startOfDay(new Date());

        switch (this.viewMode) {
            case 'week': {
                const start = startOfWeek(date, { weekStartsOn: 1 });
                let end     = endOfWeek(date, { weekStartsOn: 1 });
                if (end > today) { end = today; }
                this.startDate = this._formatDate(start);
                this.endDate   = this._formatDate(end);
                break;
            }
            case 'month': {
                const start = startOfMonth(date);
                let end     = endOfMonth(date);
                if (end > today) { end = today; }
                this.startDate = this._formatDate(start);
                this.endDate   = this._formatDate(end);
                break;
            }
            default: {
                const iso = this._formatDate(date);
                this.startDate = iso;
                this.endDate   = iso;
            }
        }
    }

    private _displayDate(iso: string, withWeekday = true): string {
        try {
            const pattern = withWeekday ? 'EEEE, dd MMM yyyy' : 'dd MMM yyyy';
            return format(parseISO(iso), pattern);
        } catch {
            return iso;
        }
    }

    private _startOfDay(d: Date): Date {
        const copy = new Date(d);
        copy.setHours(0, 0, 0, 0);
        return copy;
    }

    private _formatDate(d: Date): string {
        return format(d, 'yyyy-MM-dd');
    }
}
