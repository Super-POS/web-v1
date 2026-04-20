// ================================================================================>> Core Library
import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

// ================================================================================>> Thrid Party Library
// Material
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PortraitComponent } from 'helper/components/portrait/component';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { Subject, takeUntil } from 'rxjs';
@Component({
    selector: 'app-filter-user',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: true,
    imports: [
        RouterModule,
        FormsModule,
        MatIconModule,
        CommonModule,
        MatTooltipModule,
        AsyncPipe,
        MatProgressSpinnerModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatAutocompleteModule,
        MatDatepickerModule,
        MatButtonModule,
        MatMenuModule,
        MatDividerModule,
        MatRadioModule,
        MatDialogModule,
        PortraitComponent,
        MatButtonToggleModule
    ]
})
export class FilterUserComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    saving: boolean = false;
    filterForm: FormGroup;

    public dateType = [
        { id: 'today', name: 'ថ្ងៃនេះ' },
        { id: 'thisMonth', name: 'ខែនេះ' },
        { id: 'lastMonth', name: 'ខែមុន' },
        { id: '3MonthAgo', name: '3 ខែមុន' },
        { id: '6MonthAgo', name: '6 ខែមុន' },
        { id: 'startandend', name: 'ជ្រើសរើសអំឡុងពេល' }
    ];

    public types = [
        { id: 1, name: 'អ្នកគ្រប់គ្រង' },
        { id: 2, name: 'អ្នកគិតប្រាក់' }
    ]
    constructor(
        @Inject(MAT_DIALOG_DATA) public setup: any,
        private dialogRef: MatDialogRef<FilterUserComponent>,
        private formBuilder: FormBuilder,
        private snackBarService: SnackbarService,
        private cdr: ChangeDetectorRef
    ) { }
    ngOnInit(): void {
        this.buildForm();
        this.handleTimeTypeChanges();
        this.setDefaultToday();
    }
    buildForm(): void {
        this.filterForm = this.formBuilder.group({
            timeType: ['today', Validators.required],
            startDate: [{ value: null, disabled: true }],
            endDate: [{ value: null, disabled: true }],
            type: [null],
        });
    }

    setDefaultToday(): void {
        const { startDate, endDate } = this.calculateDateRange('today');
        this.filterForm.patchValue({ startDate, endDate });
    }

    handleTimeTypeChanges(): void {
        this.filterForm.get('timeType')!.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((value) => {
                if (value === 'startandend') {
                    this.filterForm.get('startDate')!.enable();
                    this.filterForm.get('endDate')!.enable();
                } else {
                    const { startDate, endDate } = this.calculateDateRange(value);
                    this.filterForm.patchValue({ startDate, endDate });
                    this.filterForm.get('startDate')!.disable();
                    this.filterForm.get('endDate')!.disable();
                }
                this.cdr.markForCheck(); // Notify Angular of the change
            });
    }


    ngAfterViewInit(): void {
        this.setDefaultToday();
        this.cdr.detectChanges(); // Ensures changes are detected after the view is initialized
    }


    calculateDateRange(type: string): { startDate: Date; endDate: Date } {
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();

        switch (type) {
            case 'thisMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'lastMonth':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case '3MonthAgo':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case '6MonthAgo':
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            default:
                startDate = endDate = now;
        }
        return { startDate, endDate };
    }

    submit(): void {
        if (this.filterForm.valid) {
            const formValue = { ...this.filterForm.value };

            // Format the start and end dates to ISO string
            if (formValue.timeType !== 'startandend') {
                const { startDate, endDate } = this.calculateDateRange(formValue.timeType);
                formValue.startDate = this.formatDateToISOString(startDate);
                formValue.endDate = this.formatDateToISOString(endDate);
            } else {
                formValue.startDate = this.formatDateToISOString(formValue.startDate);
                formValue.endDate = this.formatDateToISOString(formValue.endDate);
            }

            this.dialogRef.close(formValue);
            this.saving = true;
        } else {
            this.snackBarService.openSnackBar('Please fill in the required fields.', 'Error');
        }
    }

    // Utility function to format date to 'yyyy-MM-dd' in Cambodia's timezone (UTC+7)
    formatDateToISOString(date: Date | string): string {
        const d = new Date(date);

        // Offset by +7 hours (UTC+7) to convert to Cambodia time
        const offset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
        const cambodiaTime = new Date(d.getTime() + offset);

        // Extract year, month, and day from the Cambodia time
        const year = cambodiaTime.getUTCFullYear();
        const month = String(cambodiaTime.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(cambodiaTime.getUTCDate()).padStart(2, '0');

        // Return formatted string in 'yyyy-MM-dd' format
        return `${year}-${month}-${day}`;
    }


    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    closeDialog(): void {
        this.dialogRef.close();
    }
}
