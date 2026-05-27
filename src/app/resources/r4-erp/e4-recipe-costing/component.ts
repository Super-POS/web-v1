import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { forkJoin } from 'rxjs';
import { ErpIngredientCost, ErpRecipeCostItem, ErpRecipeSummary, ErpSizeCost } from './interface';
import { ErpRecipeCostingService } from './service';

@Component({
    selector: 'erp-recipe-costing',
    standalone: true,
    templateUrl: './template.html',
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTableModule,
    ],
})
export class ErpRecipeCostingComponent implements OnInit {
    displayedColumns = ['menu_name', 'has_sizes', 'product_cost', 'price', 'margin_pct'] as const;
    sizeColumns      = ['size', 'price', 'product_cost', 'margin_pct'] as const;
    ingredientColumns = ['name', 'unit', 'quantity_used', 'unit_cost', 'line_cost'] as const;

    summary: ErpRecipeSummary | null = null;
    rows: ErpRecipeCostItem[]        = [];
    selectedItem: ErpRecipeCostItem | null = null;

    isLoading       = false;
    isLoadingDetail = false;

    constructor(
        private service: ErpRecipeCostingService,
        private snackBar: SnackbarService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.isLoading = true;
        forkJoin({
            summary: this.service.getSummary(),
            items:   this.service.listAll(),
        }).subscribe({
            next: ({ summary, items }) => {
                this.summary   = summary.data;
                this.rows      = items.data || [];
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this.snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
                this.cdr.markForCheck();
            },
        });
    }

    selectRow(row: ErpRecipeCostItem): void {
        // Toggle off if clicking the already-selected row
        if (this.selectedItem?.menu_id === row.menu_id) {
            this.selectedItem = null;
            this.cdr.markForCheck();
            return;
        }

        // If detail data (sizes or ingredients) already present, use it directly
        if (row.has_sizes && row.sizes?.length) {
            this.selectedItem = row;
            this.cdr.markForCheck();
            return;
        }
        if (!row.has_sizes && row.ingredients?.length) {
            this.selectedItem = row;
            this.cdr.markForCheck();
            return;
        }

        // Fetch detail from API
        this.isLoadingDetail = true;
        this.selectedItem    = null;
        this.service.getDetail(row.menu_id).subscribe({
            next: (res) => {
                this.selectedItem    = res.data;
                this.isLoadingDetail = false;
                // Patch the row in the table so next click is instant
                const idx = this.rows.findIndex((r) => r.menu_id === row.menu_id);
                if (idx >= 0) {
                    const next = [...this.rows];
                    next[idx]  = res.data;
                    this.rows  = next;
                }
                this.cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isLoadingDetail = false;
                this.snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
                this.cdr.markForCheck();
            },
        });
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

    get sizeColumnsArr(): string[] { return [...this.sizeColumns]; }
    get ingredientColumnsArr(): string[] { return [...this.ingredientColumns]; }
    get displayedColumnsArr(): string[] { return [...this.displayedColumns]; }
}
