import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { HelperConfirmationConfig } from 'helper/services/confirmation/interface';
import { HelperConfirmationService } from 'helper/services/confirmation/service';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { take } from 'rxjs';
import { ErpExpenseCategory } from '../interface';
import { ErpPlService } from '../service';
import { ErpCreateCategoryDialogComponent } from './create-dialog/component';
import { ErpUpdateCategoryDialogComponent } from './update-dialog/component';

@Component({
    selector: 'erp-expense-categories',
    standalone: true,
    templateUrl: './template.html',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatTableModule,
    ],
})
export class ErpExpenseCategoriesComponent implements OnInit {
    displayedColumns = ['name', 'type', 'description', 'actions'] as const;
    rows: ErpExpenseCategory[] = [];
    isLoading = false;

    constructor(
        private service: ErpPlService,
        private snackBar: SnackbarService,
        private cdr: ChangeDetectorRef,
        private _matDialog: MatDialog,
        private confirmation: HelperConfirmationService,
    ) {}

    ngOnInit(): void {
        this.load();
    }

    private _drawerConfig<T>(): MatDialogConfig<T> {
        return {
            autoFocus: false,
            position: { right: '0px' },
            height: '100dvh',
            width: '100dvw',
            maxWidth: '550px',
            panelClass: 'custom-mat-dialog-as-mat-drawer',
            enterAnimationDuration: '0s',
        };
    }

    load(): void {
        this.isLoading = true;
        this.service.listCategories().subscribe({
            next: (res) => {
                this.rows = res.data || [];
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

    openCreateDialog(): void {
        const dialogRef = this._matDialog.open(ErpCreateCategoryDialogComponent, this._drawerConfig());
        dialogRef.componentInstance.resData.pipe(take(1)).subscribe((row: ErpExpenseCategory) => {
            this.rows = [row, ...this.rows];
            this.cdr.markForCheck();
        });
    }

    openUpdateDialog(row: ErpExpenseCategory): void {
        const dialogRef = this._matDialog.open(ErpUpdateCategoryDialogComponent, {
            ...this._drawerConfig(),
            data: row,
        });
        dialogRef.componentInstance.resData.pipe(take(1)).subscribe((updated: ErpExpenseCategory) => {
            const i = this.rows.findIndex((r) => r.id === updated.id);
            if (i >= 0) {
                const next = [...this.rows];
                next[i] = updated;
                this.rows = next;
                this.cdr.markForCheck();
            }
        });
    }

    remove(row: ErpExpenseCategory): void {
        const config: HelperConfirmationConfig = {
            title: `Delete category <strong>${row.name}</strong>`,
            message: 'This category will be removed permanently. <span class="font-medium">This action cannot be undone.</span>',
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
        this.confirmation.open(config).afterClosed().subscribe((result: string | undefined) => {
            if (result !== 'confirmed') { return; }
            this.service.deleteCategory(row.id).subscribe({
                next: (res) => {
                    this.snackBar.openSnackBar(res.message || 'Deleted.', GlobalConstants.success);
                    this.load();
                },
                error: (err: HttpErrorResponse) => {
                    this.snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
                },
            });
        });
    }
}
