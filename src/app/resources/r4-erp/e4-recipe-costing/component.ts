import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { forkJoin } from 'rxjs';
import { ErpRecipeCostItem, ErpRecipeSummary } from './interface';
import { ErpRecipeCostingService } from './service';
import { PosBreadcrumbComponent, PosListPageComponent } from 'app/shared/list-page';

@Component({
    selector: 'erp-recipe-costing',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: '../erp-page.scss',
    imports: [
        PosListPageComponent,
        PosBreadcrumbComponent,
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatTableModule,
        MatPaginatorModule,
    ],
})
export class ErpRecipeCostingComponent implements OnInit {
    @ViewChild(MatPaginator) set matPaginator(paginator: MatPaginator | undefined) {
        if (paginator) {
            this.dataSource.paginator = paginator;
        }
    }

    displayedColumns = ['menu_name', 'has_sizes', 'product_cost', 'price', 'margin_pct'] as const;
    sizeColumns      = ['size', 'price', 'product_cost', 'margin_pct'] as const;
    ingredientColumns = ['name', 'unit', 'quantity_used', 'unit_cost', 'line_cost'] as const;

    dataSource = new MatTableDataSource<ErpRecipeCostItem>([]);
    summary: ErpRecipeSummary | null = null;
    selectedItem: ErpRecipeCostItem | null = null;

    searchText = '';
    isLoading       = false;
    isLoadingDetail = false;

    readonly pageSizeOptions = [15, 30, 50, 100];
    readonly defaultPageSize = 15;

    constructor(
        private service: ErpRecipeCostingService,
        private snackBar: SnackbarService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.dataSource.filterPredicate = (data: ErpRecipeCostItem, filter: string) => {
            if (!filter) { return true; }
            const name = (data.menu_name || '').toLowerCase();
            const code = (data.menu_code || '').toLowerCase();
            return name.includes(filter) || code.includes(filter);
        };
        this.load();
    }

    onSearchInput(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.searchText = value;
        this.dataSource.filter = value.trim().toLowerCase();
        this.dataSource.paginator?.firstPage();
    }

    load(): void {
        this.isLoading = true;
        forkJoin({
            summary: this.service.getSummary(),
            items:   this.service.listAll(),
        }).subscribe({
            next: ({ summary, items }) => {
                this.summary = summary.data;
                this.dataSource.data = items.data || [];
                this._syncTableFilter();
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
        if (this.selectedItem?.menu_id === row.menu_id && !this.isLoadingDetail) {
            this.selectedItem = null;
            this.cdr.markForCheck();
            return;
        }

        if (row.has_sizes && row.sizes?.length) {
            this.selectedItem = row;
            this.cdr.markForCheck();
            return;
        }

        this.isLoadingDetail = true;
        this.selectedItem    = row;
        this.service.getDetail(row.menu_id).subscribe({
            next: (res) => {
                this.selectedItem    = res.data;
                this.isLoadingDetail = false;
                const idx = this.dataSource.data.findIndex((r) => r.menu_id === row.menu_id);
                if (idx >= 0) {
                    const next = [...this.dataSource.data];
                    next[idx]  = res.data;
                    this.dataSource.data = next;
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

    private _syncTableFilter(): void {
        this.dataSource.filter = this.searchText.trim().toLowerCase();
    }
}
