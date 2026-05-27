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
import { ErpEmployee } from '../interface';
import { ErpPayrollService } from '../service';
import { ErpEmployeeCreateDialogComponent } from './create-dialog/component';
import { ErpEmployeeUpdateDialogComponent } from './update-dialog/component';

@Component({
    selector: 'erp-employees',
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
export class ErpEmployeesComponent implements OnInit {
    displayedColumns = ['name', 'position', 'department', 'contract_type', 'base_salary', 'status', 'actions'] as const;
    rows: ErpEmployee[] = [];
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
        this.service.listEmployees().subscribe({
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
        const dialogRef = this._matDialog.open(ErpEmployeeCreateDialogComponent, this._drawerConfig());
        dialogRef.componentInstance.resData.pipe(take(1)).subscribe((row: ErpEmployee) => {
            this.rows = [row, ...this.rows];
            this.cdr.markForCheck();
        });
    }

    openUpdateDialog(row: ErpEmployee): void {
        const dialogRef = this._matDialog.open(ErpEmployeeUpdateDialogComponent, {
            ...this._drawerConfig<ErpEmployee>(),
            data: row,
        });
        dialogRef.componentInstance.resData.pipe(take(1)).subscribe((updated: ErpEmployee) => {
            const i = this.rows.findIndex((r) => r.id === updated.id);
            if (i >= 0) {
                const next = [...this.rows];
                next[i] = updated;
                this.rows = next;
                this.cdr.markForCheck();
            }
        });
    }

    remove(row: ErpEmployee): void {
        const config: HelperConfirmationConfig = {
            title: `Delete employee <strong>${row.user?.name ?? row.user_id}</strong>`,
            message: 'This employee record will be removed permanently. <span class="font-medium">This action cannot be undone.</span>',
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn',
            },
            actions: {
                confirm: { show: true, label: 'Delete', color: 'warn' },
                cancel:  { show: true, label: 'Cancel' },
            },
            dismissible: true,
        };
        this.confirmation.open(config).afterClosed().subscribe((result: string | undefined) => {
            if (result !== 'confirmed') { return; }
            this.service.deleteEmployee(row.id).subscribe({
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

    contractTypeLabel(type: string): string {
        const map: Record<string, string> = {
            full_time:  'Full Time',
            part_time:  'Part Time',
            contract:   'Contract',
            internship: 'Internship',
        };
        return map[type] ?? type;
    }
}
