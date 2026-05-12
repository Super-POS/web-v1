import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';

import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { PrintReceiptService, WastageReportData } from 'helper/services/print-receipt/print-receipt.service';
import GlobalConstants from 'helper/shared/constants';
import { IngredientWastageRecord, RecipeWastageRecord } from './interface';
import { RecordIngredientWastageDialogComponent } from './record-ingredient-dialog/component';
import { RecordRecipeWastageDialogComponent } from './record-recipe-dialog/component';
import { MenuWastageService } from './service';

@Component({
    selector: 'menu-wastage',
    standalone: true,
    templateUrl: './template.html',
    imports: [
        CommonModule,
        DatePipe,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatTableModule,
        MatTabsModule,
    ],
})
export class MenuWastageComponent implements OnInit {
    private _service = inject(MenuWastageService);
    private _matDialog = inject(MatDialog);
    private _snackBarService = inject(SnackbarService);
    private _printService = inject(PrintReceiptService);

    activeTabIndex = 0;

    // ── Ingredient wastage tab ────────────────────────────────────────────────
    ingredientColumns: string[] = ['no', 'ingredient_name', 'unit', 'amount', 'reason', 'created_at'];
    ingredientDataSource = new MatTableDataSource<IngredientWastageRecord>([]);
    ingredientLoading = false;
    ingredientLoaded = false;

    // ── Recipe wastage tab ────────────────────────────────────────────────────
    recipeColumns: string[] = ['no', 'recipe_name', 'quantity', 'reason', 'created_at'];
    recipeDataSource = new MatTableDataSource<RecipeWastageRecord>([]);
    recipeLoading = false;
    recipeLoaded = false;

    ngOnInit(): void {
        this.loadIngredientWastages();
    }

    onTabChange(event: MatTabChangeEvent): void {
        this.activeTabIndex = event.index;
        if (event.index === 1 && !this.recipeLoaded) {
            this.loadRecipeWastages();
        }
    }

    // ── Ingredient tab ────────────────────────────────────────────────────────
    loadIngredientWastages(): void {
        this.ingredientLoading = true;
        this._service.getIngredientWastages().subscribe({
            next: (res) => {
                this.ingredientDataSource.data = res.data ?? [];
                this.ingredientLoading = false;
                this.ingredientLoaded = true;
            },
            error: (err: HttpErrorResponse) => {
                this.ingredientLoading = false;
                this._snackBarService.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    openRecordIngredientDialog(): void {
        const dialogRef = this._matDialog.open(RecordIngredientWastageDialogComponent, {
            width: '480px',
            maxWidth: '95vw',
            autoFocus: false,
        });
        dialogRef.componentInstance.resData.subscribe((record: IngredientWastageRecord) => {
            const data = [record, ...this.ingredientDataSource.data];
            this.ingredientDataSource.data = data;
        });
    }

    // ── Recipe tab ────────────────────────────────────────────────────────────
    loadRecipeWastages(): void {
        this.recipeLoading = true;
        this._service.getRecipeWastages().subscribe({
            next: (res) => {
                this.recipeDataSource.data = res.data ?? [];
                this.recipeLoading = false;
                this.recipeLoaded = true;
            },
            error: (err: HttpErrorResponse) => {
                this.recipeLoading = false;
                this._snackBarService.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    openRecordRecipeDialog(): void {
        const dialogRef = this._matDialog.open(RecordRecipeWastageDialogComponent, {
            width: '480px',
            maxWidth: '95vw',
            autoFocus: false,
        });
        dialogRef.componentInstance.resData.subscribe((record: RecipeWastageRecord) => {
            const data = [record, ...this.recipeDataSource.data];
            this.recipeDataSource.data = data;
        });
    }

    // ── Print ─────────────────────────────────────────────────────────────────
    printCurrent(): void {
        if (this.activeTabIndex === 0) {
            const report: WastageReportData = {
                type: 'Ingredient',
                records: this.ingredientDataSource.data.map((r) => ({
                    name: r.ingredient_name,
                    unit: r.unit,
                    amount: r.quantity,
                    reason: r.reason,
                    created_at: r.created_at,
                })),
            };
            this._printService.printWastageReport(report);
        } else {
            const report: WastageReportData = {
                type: 'Recipe',
                records: this.recipeDataSource.data.map((r) => ({
                    name: r.menu_name,
                    amount: r.quantity,
                    reason: r.reason,
                    created_at: r.created_at,
                })),
            };
            this._printService.printWastageReport(report);
        }
    }
}
