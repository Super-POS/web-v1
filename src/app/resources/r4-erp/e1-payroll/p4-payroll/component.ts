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
import { ErpPayrollPeriod } from '../interface';
import { ErpPayrollService } from '../service';
import { ErpGeneratePayrollDialogComponent } from './generate-dialog/component';

@Component({
    selector: 'erp-payroll-periods',
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
export class ErpPayrollPeriodsComponent implements OnInit {
    displayedColumns = ['period', 'status', 'total_net_salary', 'notes', 'actions'] as const;
    rows: ErpPayrollPeriod[] = [];
    isLoading = false;

    constructor(
        private service: ErpPayrollService,
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
        this.service.listPayrolls().subscribe({
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

    openGenerateDialog(): void {
        const dialogRef = this._matDialog.open(ErpGeneratePayrollDialogComponent, this._drawerConfig());
        dialogRef.componentInstance.resData.pipe(take(1)).subscribe((row: ErpPayrollPeriod) => {
            this.rows = [row, ...this.rows];
            this.cdr.markForCheck();
        });
    }

    finalize(row: ErpPayrollPeriod): void {
        const config: HelperConfirmationConfig = {
            title: `Finalize payroll`,
            message: `Finalize payroll period <strong>${row.period_start} – ${row.period_end}</strong>? This will lock the payroll for payment.`,
            icon: { show: true, name: 'heroicons_outline:lock-closed', color: 'primary' },
            actions: {
                confirm: { show: true, label: 'Finalize', color: 'primary' },
                cancel:  { show: true, label: 'Cancel' },
            },
            dismissible: true,
        };
        this.confirmation.open(config).afterClosed().subscribe((result: string | undefined) => {
            if (result !== 'confirmed') { return; }
            this.service.finalizePayroll(row.id).subscribe({
                next: (res) => {
                    this.snackBar.openSnackBar(res.message || 'Payroll finalized.', GlobalConstants.success);
                    this.load();
                },
                error: (err: HttpErrorResponse) => {
                    this.snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
                },
            });
        });
    }

    markPaid(row: ErpPayrollPeriod): void {
        const config: HelperConfirmationConfig = {
            title: `Mark payroll as paid`,
            message: `Mark payroll period <strong>${row.period_start} – ${row.period_end}</strong> as paid?`,
            icon: { show: true, name: 'heroicons_outline:banknotes', color: 'primary' },
            actions: {
                confirm: { show: true, label: 'Mark Paid', color: 'primary' },
                cancel:  { show: true, label: 'Cancel' },
            },
            dismissible: true,
        };
        this.confirmation.open(config).afterClosed().subscribe((result: string | undefined) => {
            if (result !== 'confirmed') { return; }
            this.service.markPayrollPaid(row.id).subscribe({
                next: (res) => {
                    this.snackBar.openSnackBar(res.message || 'Payroll marked as paid.', GlobalConstants.success);
                    this.load();
                },
                error: (err: HttpErrorResponse) => {
                    this.snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
                },
            });
        });
    }

    viewDetail(row: ErpPayrollPeriod): void {
        const count = row.items?.length ?? 0;
        this.snackBar.openSnackBar(`Payroll #${row.id} has ${count} item(s).`, GlobalConstants.success);
    }

    statusBadgeClass(status: string): string {
        const map: Record<string, string> = {
            draft:     'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
            finalized: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            paid:      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        };
        return map[status] ?? 'bg-gray-100 text-gray-600';
    }
}
