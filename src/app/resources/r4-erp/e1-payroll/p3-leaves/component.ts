import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { HelperConfirmationService } from 'helper/services/confirmation/service';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { take } from 'rxjs';
import { ErpLeave } from '../interface';
import { ErpPayrollService } from '../service';
import { ErpRequestLeaveDialogComponent } from './request-dialog/component';

@Component({
    selector: 'erp-leaves',
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
export class ErpLeavesComponent implements OnInit {
    displayedColumns = ['employee', 'type', 'dates', 'days', 'reason', 'status', 'actions'] as const;
    rows: ErpLeave[] = [];
    isLoading = false;

    statusFilter = 'all';
    statusFilters = [
        { value: 'all',      label: 'All' },
        { value: 'pending',  label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

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
        const params = this.statusFilter !== 'all' ? { status: this.statusFilter } : {};
        this.service.listLeaves(params).subscribe({
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

    setFilter(value: string): void {
        this.statusFilter = value;
        this.load();
    }

    openRequestDialog(): void {
        const dialogRef = this._matDialog.open(ErpRequestLeaveDialogComponent, this._drawerConfig());
        dialogRef.componentInstance.resData.pipe(take(1)).subscribe((row: ErpLeave) => {
            this.rows = [row, ...this.rows];
            this.cdr.markForCheck();
        });
    }

    approve(row: ErpLeave): void {
        this.service.updateLeaveStatus(row.id, { status: 'approved' }).subscribe({
            next: (res) => {
                this.snackBar.openSnackBar(res.message || 'Leave approved.', GlobalConstants.success);
                this.load();
            },
            error: (err: HttpErrorResponse) => {
                this.snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    reject(row: ErpLeave): void {
        this.confirmation.open({
            title: `Reject leave request`,
            message: `Rejecting leave for <strong>${row.employee?.user?.name || 'employee'}</strong>. Please note a reason if needed.`,
            icon: { show: true, name: 'heroicons_outline:x-circle', color: 'warn' },
            actions: {
                confirm: { show: true, label: 'Reject', color: 'warn' },
                cancel:  { show: true, label: 'Cancel' },
            },
            dismissible: true,
        }).afterClosed().subscribe((result: string | undefined) => {
            if (result !== 'confirmed') { return; }
            this.service.updateLeaveStatus(row.id, { status: 'rejected' }).subscribe({
                next: (res) => {
                    this.snackBar.openSnackBar(res.message || 'Leave rejected.', GlobalConstants.success);
                    this.load();
                },
                error: (err: HttpErrorResponse) => {
                    this.snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
                },
            });
        });
    }

    leaveTypeLabel(type: string): string {
        const map: Record<string, string> = {
            annual:    'Annual',
            sick:      'Sick',
            unpaid:    'Unpaid',
            maternity: 'Maternity',
            paternity: 'Paternity',
            other:     'Other',
        };
        return map[type] ?? type;
    }

    statusBadgeClass(status: string): string {
        const map: Record<string, string> = {
            pending:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            approved:  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            rejected:  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
        };
        return map[status] ?? 'bg-gray-100 text-gray-600';
    }
}
