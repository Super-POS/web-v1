import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { env } from 'envs/env';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { Subject } from 'rxjs';

import { Data as SaleOrderViewRow } from './interface';
import { Data as MenuRow } from '../interface';
import { MenuService } from '../service';
import { MenuIngredientService } from '../../p3-ingredient/service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ExchangeRateSettingService } from 'helper/services/exchange-rate-setting/exchange-rate-setting.service';
import { UsdFromKhrPipe } from 'helper/pipes/usd-from-khr.pipe';

@Component({
    selector: 'dashboard-gm-fast-view-customer',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatTabsModule,
        MatMenuModule,
        MatCheckboxModule,
        DatePipe,
        DecimalPipe,
        UsdFromKhrPipe,
    ]
})
export class ViewDialogComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    displayedColumns: string[] = ['no', 'receipt', 'price', 'ordered_at', 'ordered_at_time', 'seller'];
    dataSource: MatTableDataSource<SaleOrderViewRow> = new MatTableDataSource<SaleOrderViewRow>([]);
    fileUrl = env.FILE_BASE_URL;
    public isLoading: boolean;
    /** Recipe lines with resolved ingredient names for the General tab */
    displayRecipes: { name: string; unit: string; qty: number }[] = [];

    constructor(
        @Inject(MAT_DIALOG_DATA) public element: MenuRow,
        private _dialogRef: MatDialogRef<ViewDialogComponent>,
        private cdr: ChangeDetectorRef,
        private _snackbar: SnackbarService,
        private menuService: MenuService,
        private _ingredientService: MenuIngredientService,
        private _exchange: ExchangeRateSettingService,
    ) { }

    get usdRate(): number {
        return this._exchange.khrPerUsd;
    }

    menuUnitUsd(): number {
        return this._exchange.khrToUsd(this.element?.unit_price);
    }

    menuRevenueUsd(): number {
        const khr = (Number(this.element?.total_sale) || 0) * Number(this.element?.unit_price || 0);
        return this._exchange.khrToUsd(khr);
    }

    ngOnInit(): void {
        this.viewData();
    }

    viewData() {
        this.isLoading = true;
        const needsIngredients = (this.element?.recipes?.length ?? 0) > 0;
        const ing$ = needsIngredients
            ? this._ingredientService.getData().pipe(
                catchError(() => of({ data: [] as { id: number; name: string; unit?: string }[] })),
            )
            : of({ data: [] as { id: number; name: string; unit?: string }[] });

        forkJoin({
            sales: this.menuService.view(this.element.id).pipe(
                catchError(() => of({ data: [] as SaleOrderViewRow[] })),
            ),
            ingredients: ing$,
            rateBootstrap: this._exchange.fetchAdmin().pipe(catchError(() => of(null))),
        }).subscribe({
            next: ({ sales, ingredients }) => {
                this.dataSource.data = sales.data;
                this._resolveRecipes(ingredients.data);
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                this.isLoading = false;
                this.cdr.markForCheck();
                this._snackbar.openSnackBar(err?.error?.message ?? 'Error', 'Dismiss');
            },
        });
    }

    private _resolveRecipes(ingredients: { id: number; name: string; unit?: string }[]): void {
        const byId = new Map(ingredients.map((i) => [i.id, i]));
        const lines = this.element?.recipes ?? [];
        this.displayRecipes = lines.map((r) => {
            const row = byId.get(r.ingredient_id);
            return {
                name: row?.name ?? `Ingredient #${r.ingredient_id}`,
                unit: row?.unit?.trim() ? row.unit : '—',
                qty: r.quantity,
            };
        });
    }

    closeDialog() {
        this._dialogRef.close();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
