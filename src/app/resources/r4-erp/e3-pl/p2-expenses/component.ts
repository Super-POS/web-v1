import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { HelperConfirmationConfig } from 'helper/services/confirmation/interface';
import { HelperConfirmationService } from 'helper/services/confirmation/service';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { take } from 'rxjs';
import { ErpExpense } from '../interface';
import { ErpPlService } from '../service';
import { ErpCreateExpenseDialogComponent } from './create-dialog/component';

@Component({
    selector: 'erp-expenses',
    standalone: true,
    templateUrl: './template.html',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatTableModule,
    ],
})
export class ErpExpensesComponent implements OnInit {
    displayedColumns = ['date', 'category', 'description', 'amount', 'reference', 'actions'] as const;
    rows: ErpExpense[] = [];
    isLoading = false;
    filterForm: UntypedFormGroup;

    constructor(
        private service: ErpPlService,
        private snackBar: SnackbarService,
        private cdr: ChangeDetectorRef,
        private _matDialog: MatDialog,
        private confirmation: HelperConfirmationService,
        private _fb: FormBuilder,
    ) {}

    ngOnInit(): void {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const startDate = `${y}-${m}-01`;
        const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
        const endDate = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;

        this.filterForm = this._fb.group({
            start_date: [startDate],
            end_date: [endDate],
        });

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
        const val = this.filterForm.getRawValue();
        const params: { start_date?: string; end_date?: string } = {};
        if (val.start_date) { params.start_date = val.start_date; }
        if (val.end_date)   { params.end_date = val.end_date; }
        this.service.listExpenses(params).subscribe({
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

    search(): void {
        this.load();
    }

    openCreateDialog(): void {
        const dialogRef = this._matDialog.open(ErpCreateExpenseDialogComponent, this._drawerConfig());
        dialogRef.componentInstance.resData.pipe(take(1)).subscribe((row: ErpExpense) => {
            this.rows = [row, ...this.rows];
            this.cdr.markForCheck();
        });
    }

    remove(row: ErpExpense): void {
        const config: HelperConfirmationConfig = {
            title: `Delete expense`,
            message: 'This expense record will be removed permanently. <span class="font-medium">This action cannot be undone.</span>',
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
            this.service.deleteExpense(row.id).subscribe({
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
