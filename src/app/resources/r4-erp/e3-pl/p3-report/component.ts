import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { ErpPlReport } from '../interface';
import { ErpPlService } from '../service';
import { PosBreadcrumbComponent, PosListPageComponent } from 'app/shared/list-page';

@Component({
    selector: 'erp-pl-report',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: '../../erp-page.scss',
    imports: [
        PosListPageComponent,
        PosBreadcrumbComponent,
        CommonModule,
        DecimalPipe,
        ReactiveFormsModule,
        MatButtonModule,
        MatDividerModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
    ],
})
export class ErpPlReportComponent implements OnInit {
    filterForm: UntypedFormGroup;
    report: ErpPlReport | null = null;
    isLoading = false;

    constructor(
        private service: ErpPlService,
        private snackBar: SnackbarService,
        private cdr: ChangeDetectorRef,
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

    load(): void {
        const val = this.filterForm.getRawValue();
        if (!val.start_date || !val.end_date) { return; }
        this.isLoading = true;
        this.service.getReport({ start_date: val.start_date, end_date: val.end_date }).subscribe({
            next: (res) => {
                this.report = res.data;
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
}
