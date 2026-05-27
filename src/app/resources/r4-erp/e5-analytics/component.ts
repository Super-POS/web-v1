import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { forkJoin } from 'rxjs';
import { ErpAnalyticsDashboard, ErpProfitByProduct } from './interface';
import { ErpAnalyticsService } from './service';

@Component({
    selector: 'erp-analytics',
    standalone: true,
    templateUrl: './template.html',
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTableModule,
    ],
    providers: [DecimalPipe],
})
export class ErpAnalyticsComponent implements OnInit {
    // Date range — default to first day of current month → today
    startDate: string = this._firstOfMonth();
    endDate: string   = this._today();

    dashboard: ErpAnalyticsDashboard | null = null;
    profitByProduct: ErpProfitByProduct[]   = [];

    isLoading    = false;
    hasLoaded    = false;

    // Table column definitions
    bestSellerColumns  = ['rank', 'menu_name', 'total_qty', 'total_revenue'] as const;
    trendColumns       = ['period', 'order_count', 'total_revenue'] as const;
    profitColumns      = ['menu_name', 'revenue', 'cogs', 'gross_profit', 'margin_pct'] as const;
    wasteColumns       = ['ingredient_name', 'waste_qty', 'waste_pct', 'waste_cost'] as const;

    constructor(
        private service: ErpAnalyticsService,
        private snackBar: SnackbarService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this._load();
    }

    search(): void {
        this._load();
    }

    private _load(): void {
        this.isLoading = true;
        const params = { start_date: this.startDate, end_date: this.endDate };

        forkJoin({
            dashboard: this.service.getDashboard(params),
            profit:    this.service.getProfitByProduct(params),
        }).subscribe({
            next: ({ dashboard, profit }) => {
                this.dashboard        = dashboard.data;
                this.profitByProduct  = profit.data || [];
                this.isLoading        = false;
                this.hasLoaded        = true;
                this.cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this.hasLoaded = true;
                this.snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
                this.cdr.markForCheck();
            },
        });
    }

    /** Convert 0–23 hour int to human label like '12 AM', '1 PM' */
    getHourLabel(hour: number): string {
        if (hour === 0)  { return '12 AM'; }
        if (hour < 12)   { return `${hour} AM`; }
        if (hour === 12) { return '12 PM'; }
        return `${hour - 12} PM`;
    }

    /** Return CSS width percentage string for peak-hours bar chart */
    getBarWidth(count: number, maxCount: number): string {
        if (!maxCount) { return '0%'; }
        const pct = Math.round((count / maxCount) * 100);
        return `${pct}%`;
    }

    maxPeakOrderCount(): number {
        if (!this.dashboard?.peak_hours?.length) { return 0; }
        return Math.max(...this.dashboard.peak_hours.map((h) => h.order_count));
    }

    marginClass(pct: number): string {
        if (pct >= 60) { return 'text-green-600 dark:text-green-400'; }
        if (pct >= 30) { return 'text-yellow-600 dark:text-yellow-400'; }
        return 'text-red-600 dark:text-red-400';
    }

    marginBadgeClass(pct: number): string {
        if (pct >= 60) { return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'; }
        if (pct >= 30) { return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'; }
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }

    get bestSellerColumnsArr(): string[] { return [...this.bestSellerColumns]; }
    get trendColumnsArr(): string[]      { return [...this.trendColumns]; }
    get profitColumnsArr(): string[]     { return [...this.profitColumns]; }
    get wasteColumnsArr(): string[]      { return [...this.wasteColumns]; }

    private _today(): string {
        return new Date().toISOString().slice(0, 10);
    }

    private _firstOfMonth(): string {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().slice(0, 10);
    }
}
