import { CommonModule, DecimalPipe } from '@angular/common';
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
import { AdminCouponCreateDialogComponent } from './create-dialog/component';
import { AdminCouponRow } from './interface';
import { AdminCouponService } from './service';
import { AdminCouponUpdateDialogComponent } from './update-dialog/component';

@Component({
    selector: 'app-admin-coupon',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        CommonModule,
        DecimalPipe,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatTableModule,
    ],
})
export class AdminCouponComponent implements OnInit {
    displayedColumns = ['code', 'discount_percent', 'note', 'is_active', 'actions'] as const;
    rows: AdminCouponRow[] = [];
    isLoading = false;

    constructor(
        private service: AdminCouponService,
        private snackBar: SnackbarService,
        private cdr: ChangeDetectorRef,
        private _matDialog: MatDialog,
        private confirmation: HelperConfirmationService,
    ) {}

    ngOnInit(): void {
        this.load();
    }

    private _couponDrawerConfig<T>(): MatDialogConfig<T> {
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

    openCreateDialog(): void {
        const dialogRef = this._matDialog.open(AdminCouponCreateDialogComponent, this._couponDrawerConfig());
        dialogRef.componentInstance.resData.pipe(take(1)).subscribe((row: AdminCouponRow) => {
            this.rows = [row, ...this.rows];
            this.cdr.markForCheck();
        });
    }

    openUpdateDialog(row: AdminCouponRow): void {
        const dialogRef = this._matDialog.open(AdminCouponUpdateDialogComponent, {
            ...this._couponDrawerConfig(),
            data: row,
        });
        dialogRef.componentInstance.resData.pipe(take(1)).subscribe((updated: AdminCouponRow) => {
            const i = this.rows.findIndex((r) => r.id === updated.id);
            if (i >= 0) {
                const next = [...this.rows];
                next[i] = updated;
                this.rows = next;
                this.cdr.markForCheck();
            }
        });
    }

    load(): void {
        this.isLoading = true;
        this.service.list().subscribe({
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

    toggleActive(row: AdminCouponRow): void {
        this.service.update(row.id, { is_active: !row.is_active }).subscribe({
            next: (res) => {
                this.snackBar.openSnackBar(res.message || 'Updated.', GlobalConstants.success);
                this.load();
            },
            error: (err: HttpErrorResponse) => {
                this.snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    remove(row: AdminCouponRow): void {
        const config: HelperConfirmationConfig = {
            title: `Delete coupon <strong>${row.code}</strong>`,
            message: 'This coupon will be removed permanently. <span class="font-medium">This action cannot be undone.</span>',
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
            if (result !== 'confirmed') {
                return;
            }
            this.service.remove(row.id).subscribe({
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
