import { DatePipe, NgClass, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import GlobalConstants from 'helper/shared/constants';
import { HelperConfirmationConfig } from 'helper/services/confirmation/interface';
import { HelperConfirmationService } from 'helper/services/confirmation/service';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { CreateDialogComponent } from './create-dialog/component';
import { IngredientItem } from './interface';
import { RestockDialogComponent } from './restock-dialog/component';
import { UpdateDialogComponent } from './update-dialog/component';
import { WastageDialogComponent } from './wastage-dialog/component';
import { MenuIngredientService } from './service';

@Component({
    selector: 'menu-ingredient',
    standalone: true,
    templateUrl: './template.html',
    imports: [
        NgIf,
        NgClass,
        DatePipe,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatTableModule,
    ],
})
export class MenuIngredientComponent implements OnInit {
    private _service = inject(MenuIngredientService);
    private _matDialog = inject(MatDialog);
    private _snackBarService = inject(SnackbarService);
    private _confirmation = inject(HelperConfirmationService);

    displayedColumns: string[] = [
        'no',
        'name',
        'unit',
        'quantity',
        'low_stock_threshold',
        'status',
        'created_at',
        'action',
    ];
    dataSource: MatTableDataSource<IngredientItem> = new MatTableDataSource<IngredientItem>([]);

    isLoading = false;
    restockMode = false;
    searchText = '';

    ngOnInit(): void {
        this.dataSource.filterPredicate = (data: IngredientItem, filter: string) => {
            if (!filter) {
                return true;
            }
            const name = (data.name || '').toLowerCase();
            const unit = (data.unit || '').toLowerCase();
            return name.includes(filter) || unit.includes(filter);
        };
        this.loadIngredients();
    }

    onSearchInput(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.searchText = value;
        this.dataSource.filter = value.trim().toLowerCase();
    }

    private _syncTableFilter(): void {
        this.dataSource.filter = this.searchText.trim().toLowerCase();
    }

    /**
     * Same rule as API restock list: low when quantity is at or below `low_stock_threshold` (default 1000).
     */
    itemStockStatus(item: IngredientItem): { key: 'out' | 'low' | 'ok'; label: string } {
        const q = Number(item.quantity);
        const threshold = Number(item.low_stock_threshold ?? 1000);
        if (q <= 0) {
            return { key: 'out', label: 'Out of stock' };
        }
        if (q <= threshold) {
            return { key: 'low', label: 'Low' };
        }
        return { key: 'ok', label: 'In stock' };
    }

    loadIngredients(): void {
        this.isLoading = true;
        this.restockMode = false;
        this._service.getData().subscribe({
            next: (res) => {
                this.dataSource.data = res?.data ?? [];
                this._syncTableFilter();
                this.isLoading = false;
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this._snackBarService.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    openRestockView(): void {
        this.isLoading = true;
        this.restockMode = true;
        this._service.getRestockList().subscribe({
            next: (res) => {
                this.dataSource.data = res?.data ?? [];
                this._syncTableFilter();
                this.isLoading = false;
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this._snackBarService.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    openCreateDialog(): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';

        const dialogRef = this._matDialog.open<CreateDialogComponent>(CreateDialogComponent, dialogConfig);
        dialogRef.componentInstance.resData.subscribe((res: IngredientItem) => {
            const data = this.dataSource.data;
            data.unshift(res);
            this.dataSource.data = data;
            this._syncTableFilter();
        });
    }

    openUpdateDialog(item: IngredientItem): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';
        dialogConfig.data = item;

        const dialogRef = this._matDialog.open<UpdateDialogComponent>(UpdateDialogComponent, dialogConfig);
        dialogRef.componentInstance.resData.subscribe((res: IngredientItem) => {
            const data = [...this.dataSource.data];
            const idx = data.findIndex((r) => r.id === res.id);
            if (idx >= 0) {
                data[idx] = { ...data[idx], ...res };
                this.dataSource.data = data;
            }
        });
    }

    openRestockDialog(item: IngredientItem): void {
        const dialogRef = this._matDialog.open(RestockDialogComponent, {
            width: '440px',
            maxWidth: '95vw',
            autoFocus: false,
            data: item,
        });
        dialogRef.componentInstance.resData.subscribe((res: IngredientItem) => {
            const data = [...this.dataSource.data];
            const idx = data.findIndex((r) => r.id === res.id);
            if (idx >= 0) {
                data[idx] = { ...data[idx], ...res };
                this.dataSource.data = data;
            }
        });
    }

    openWastageDialog(item: IngredientItem): void {
        const dialogRef = this._matDialog.open(WastageDialogComponent, {
            width: '440px',
            maxWidth: '95vw',
            autoFocus: false,
            data: item,
        });
        dialogRef.componentInstance.resData.subscribe((res: IngredientItem) => {
            const data = [...this.dataSource.data];
            const idx = data.findIndex((r) => r.id === res.id);
            if (idx >= 0) {
                data[idx] = { ...data[idx], ...res };
                this.dataSource.data = data;
            }
        });
    }

    onDelete(item: IngredientItem): void {
        const config: HelperConfirmationConfig = {
            title: `Delete ingredient <strong>${item.name}</strong>`,
            message: 'This ingredient will be removed permanently. <span class="font-medium">This action cannot be undone.</span>',
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn',
            },
            actions: {
                confirm: { show: true, label: 'Delete', color: 'warn' },
                cancel: { show: true, label: 'Cancel' },
            },
            dismissible: true,
        };
        this._confirmation.open(config).afterClosed().subscribe((result: string | undefined) => {
            if (result !== 'confirmed') {
                return;
            }
            this._service.delete(item.id).subscribe({
                next: (res) => {
                    this._snackBarService.openSnackBar(res.message, GlobalConstants.success);
                    this.dataSource.data = this.dataSource.data.filter((v) => v.id !== item.id);
                },
                error: (err: HttpErrorResponse) => {
                    this._snackBarService.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                },
            });
        });
    }
}
