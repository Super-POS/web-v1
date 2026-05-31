import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { take } from 'rxjs';
import { ErpSupplier } from '../interface';
import { ErpPurchasingService } from '../service';
import { ErpSupplierCreateDialogComponent } from './create-dialog/component';
import { ErpSupplierUpdateDialogComponent } from './update-dialog/component';
import { PosBreadcrumbComponent, PosListPageComponent } from 'app/shared/list-page';

@Component({
    selector: 'erp-suppliers',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: '../../erp-page.scss',
    imports: [
        PosListPageComponent,
        PosBreadcrumbComponent,
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatTableModule,
    ],
})
export class ErpSuppliersComponent implements OnInit {
    displayedColumns = ['name', 'contact_person', 'phone', 'email', 'payment_terms', 'is_active', 'actions'] as const;
    rows: ErpSupplier[] = [];
    isLoading = false;

    constructor(
        private service: ErpPurchasingService,
        private snackBar: SnackbarService,
        private cdr: ChangeDetectorRef,
        private _matDialog: MatDialog,
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
        this.service.listSuppliers().subscribe({
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
        const dialogRef = this._matDialog.open(ErpSupplierCreateDialogComponent, this._drawerConfig());
        dialogRef.componentInstance.resData.pipe(take(1)).subscribe((row: ErpSupplier) => {
            this.rows = [row, ...this.rows];
            this.cdr.markForCheck();
        });
    }

    openUpdateDialog(row: ErpSupplier): void {
        const dialogRef = this._matDialog.open(ErpSupplierUpdateDialogComponent, {
            ...this._drawerConfig(),
            data: row,
        });
        dialogRef.componentInstance.resData.pipe(take(1)).subscribe((updated: ErpSupplier) => {
            const i = this.rows.findIndex((r) => r.id === updated.id);
            if (i >= 0) {
                const next = [...this.rows];
                next[i] = updated;
                this.rows = next;
                this.cdr.markForCheck();
            }
        });
    }

    toggleActive(row: ErpSupplier): void {
        this.service.updateSupplier(row.id, { is_active: !row.is_active }).subscribe({
            next: (res) => {
                this.snackBar.openSnackBar(res.message || 'Updated.', GlobalConstants.success);
                this.load();
            },
            error: (err: HttpErrorResponse) => {
                this.snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }
}
