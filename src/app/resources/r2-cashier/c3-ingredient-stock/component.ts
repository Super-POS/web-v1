import { DecimalPipe, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { IngredientStock } from '../c1-order/interface';
import { OrderService } from '../c1-order/service';

@Component({
    selector: 'cashier-ingredient-stock',
    standalone: true,
    templateUrl: './template.html',
    imports: [NgIf, DecimalPipe, MatIconModule, MatTableModule],
})
export class IngredientStockComponent implements OnInit {
    private _service = inject(OrderService);
    private _snackBarService = inject(SnackbarService);

    displayedColumns: string[] = ['no', 'name', 'unit', 'quantity', 'status'];
    dataSource: MatTableDataSource<IngredientStock> = new MatTableDataSource<IngredientStock>([]);

    isLoading = false;

    ngOnInit(): void {
        this.getData();
    }

    getData(): void {
        this.isLoading = true;
        this._service.getIngredientsStock().subscribe({
            next: (res) => {
                this.dataSource.data = (res?.data ?? []).map((row) => ({
                    ...row,
                    low_stock_threshold: row.low_stock_threshold ?? 1000,
                }));
                this.isLoading = false;
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this._snackBarService.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    stockStatus(quantity: number, threshold: number): 'out' | 'low' | 'ok' {
        const t = Number.isFinite(threshold) && threshold >= 0 ? threshold : 1000;
        if (quantity <= 0) {
            return 'out';
        }
        if (quantity <= t) {
            return 'low';
        }
        return 'ok';
    }

    stockStatusLabel(quantity: number, threshold: number): string {
        const status = this.stockStatus(quantity, threshold);
        if (status === 'out') {
            return 'Out of stock';
        }
        if (status === 'low') {
            return 'Low stock';
        }
        return 'In stock';
    }
}
