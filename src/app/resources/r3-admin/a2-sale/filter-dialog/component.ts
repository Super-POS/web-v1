// ================================================================================>> Core Library
import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Inject, OnDestroy, OnInit, Output } from '@angular/core';
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
    selector: 'app-filter-sale',
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
export class FilterDialogComponent implements OnInit, OnDestroy {
    @Output() filterSubmitted = new EventEmitter<any>();
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    saving: boolean = false;
    filterForm: FormGroup;

    public setup  : any = null;

    public dateType = [
        { id: 'today', name: 'ថ្ងៃនេះ' },
        { id: 'thisMonth', name: 'ខែនេះ' },
        { id: 'lastMonth', name: 'ខែមុន' },
        { id: '3MonthAgo', name: '3 ខែមុន' },
        { id: '6MonthAgo', name: '6 ខែមុន' },
        { id: 'startandend', name: 'ជ្រើសរើសអំឡុងពេល' }
    ];
    constructor(
        @Inject(MAT_DIALOG_DATA) public data : any,
        private dialogRef: MatDialogRef<FilterDialogComponent>,
        private formBuilder: FormBuilder,
        
        private snackBarService: SnackbarService,
        private cdr: ChangeDetectorRef
    ) { }
    ngOnInit(): void {

        this.setup = this.data.setup;

        this.buildForm();
        this.handleTimeTypeChanges();
        this.setDefaultToday();
        
        console.log(this.setup);
    }
    buildForm(): void {
        this.filterForm = this.formBuilder.group({
            timeType: ['today', Validators.required],
            from: [{ value: null, disabled: true }],
            to: [{ value: null, disabled: true }],
            cashier: [this.data.filter.cashier ?? ''],
            platform: [this.data.filter.platform ?? '']
        });
    }

    setDefaultToday(): void {
        const { from, to } = this.calculateDateRange('today');
        this.filterForm.patchValue({ from, to });
    }

    setPlatform(value: string): void {
        const currentValue = this.filterForm.get('platform')!.value;
        // Toggle the value: if already selected, unselect (set to null)
        this.filterForm.get('platform')!.setValue(currentValue === value ? null : value);
    }

    isSelected(platform: string): boolean {
        return this.filterForm.get('platform')!.value === platform;
    }

    handleTimeTypeChanges(): void {
        this.filterForm.get('timeType')!.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((value) => {
                if (value === 'startandend') {
                    this.filterForm.get('from')!.enable();
                    this.filterForm.get('to')!.enable();
                } else {
                    const { from, to } = this.calculateDateRange(value);
                    this.filterForm.patchValue({ from, to });
                    this.filterForm.get('from')!.disable();
                    this.filterForm.get('to')!.disable();
                }
                this.cdr.markForCheck(); // Notify Angular of the change
            });
    }


    ngAfterViewInit(): void {
        this.setDefaultToday();
        this.cdr.detectChanges(); // Ensures changes are detected after the view is initialized
    }


    calculateDateRange(type: string): { from: Date; to: Date } {
        const now = new Date();
        let from = new Date();
        let to = new Date();

        switch (type) {
            case 'thisMonth':
                from = new Date(now.getFullYear(), now.getMonth(), 1);
                to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'lastMonth':
                from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                to = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case '3MonthAgo':
                from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                to = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case '6MonthAgo':
                from = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                to = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            default:
                from = to = now;
        }
        return { from, to };
    }

    // submit(): void {
    //     this.filterSubmitted.emit({
    //         ...this.filterForm.value, // Emit all form values
    //         // type: this.form.value.productTypes, // Pass the selected product type ID as 'type'
    //         // creator: this.form.value.users, // Pass the selected user ID as 'creator'
    //     });
    //     this.dialogRef.close();
    // }

    reset(): void {
        this.filterForm.reset();
        
    }

    closeDialog(): void {
        this.filterForm.reset();
        this.dialogRef.close();
    }

    submit(): void {
        if (this.filterForm.valid) {
            const formValue = { ...this.filterForm.value };

            // Format the start and end dates to ISO string
            if (formValue.timeType !== 'startandend') {
                const { from, to } = this.calculateDateRange(formValue.timeType);
                formValue.from = this.formatDateToISOString(from);
                formValue.to = this.formatDateToISOString(to);
            } else {
                formValue.from = this.formatDateToISOString(formValue.from);
                formValue.to = this.formatDateToISOString(formValue.to);
            }
            this.filterSubmitted.emit({
                ...this.filterForm.value, // Emit all form values
                // type: this.form.value.productTypes, // Pass the selected product type ID as 'type'
                // creator: this.form.value.users, // Pass the selected user ID as 'creator'
            });
            
            console.log('Emitted data:', this.filterSubmitted); // Console the emitted data

            console.log('Emitted data:', formValue); // Console the emitted data

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

    // closeDialog(): void {
    //     this.dialogRef.close();
    // }
}
