import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { take } from 'rxjs';
import { ErpAttendance } from '../interface';
import { ErpPayrollService } from '../service';
import { ErpMarkAttendanceDialogComponent } from './mark-dialog/component';
import { PosBreadcrumbComponent, PosListPageComponent } from 'app/shared/list-page';

@Component({
    selector: 'erp-attendance',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: '../../erp-page.scss',
    imports: [
        PosListPageComponent,
        PosBreadcrumbComponent,
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatTableModule,
        MatPaginatorModule,
    ],
})
export class ErpAttendanceComponent implements OnInit {
    @ViewChild(MatPaginator) set matPaginator(paginator: MatPaginator | undefined) {
        if (paginator) {
            this.dataSource.paginator = paginator;
        }
    }

    displayedColumns = ['employee', 'date', 'clock_in', 'clock_out', 'hours_worked', 'overtime_hours', 'status', 'actions'] as const;
    dataSource = new MatTableDataSource<ErpAttendance>([]);
    isLoading = false;
    filterForm: UntypedFormGroup;
    readonly pageSizeOptions = [15, 30, 50, 100];
    readonly defaultPageSize = 15;

    constructor(
        private service: ErpPayrollService,
        private snackBar: SnackbarService,
        private cdr: ChangeDetectorRef,
        private _matDialog: MatDialog,
        private _fb: FormBuilder,
    ) {}

    ngOnInit(): void {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        this.filterForm = this._fb.group({
            start_date: [firstDay],
            end_date:   [lastDay],
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
        const { start_date, end_date } = this.filterForm.getRawValue();
        this.service.getAttendance({ start_date, end_date }).subscribe({
            next: (res) => {
                this.dataSource.data = res.data || [];
                this.dataSource.paginator?.firstPage();
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

    openMarkDialog(): void {
        const dialogRef = this._matDialog.open(ErpMarkAttendanceDialogComponent, this._drawerConfig());
        dialogRef.componentInstance.resData.pipe(take(1)).subscribe((row: ErpAttendance) => {
            this.dataSource.data = [row, ...this.dataSource.data];
            this.dataSource.paginator?.firstPage();
            this.cdr.markForCheck();
        });
    }

    statusLabel(status: string): string {
        const map: Record<string, string> = {
            present:  'Present',
            absent:   'Absent',
            late:     'Late',
            half_day: 'Half Day',
            holiday:  'Holiday',
            on_leave: 'On Leave',
        };
        return map[status] ?? status;
    }

    statusClass(status: string): string {
        const map: Record<string, string> = {
            present:  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            absent:   'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            late:     'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            half_day: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            holiday:  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            on_leave: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        };
        return map[status] ?? 'bg-gray-100 text-gray-600';
    }
}
