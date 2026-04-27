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

    displayedColumns: string[] = ['no', 'name', 'unit', 'quantity'];
    dataSource: MatTableDataSource<IngredientStock> = new MatTableDataSource<IngredientStock>([]);

    isLoading = false;

    ngOnInit(): void {
        this.getData();
    }

    getData(): void {
        this.isLoading = true;
        this._service.getIngredientsStock().subscribe({
            next: (res) => {
                this.dataSource.data = res?.data ?? [];
                this.isLoading = false;
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this._snackBarService.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }
}
