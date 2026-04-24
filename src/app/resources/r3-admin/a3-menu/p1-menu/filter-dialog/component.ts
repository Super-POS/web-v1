// ================================================================================>> Core Library
import { CommonModule }                                                           from '@angular/common';
import { Component, EventEmitter, Inject, Output }                                from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';

// ================================================================================>> Third Party Library
// ===>> Material
import { MatButtonModule }                                                        from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef }                         from '@angular/material/dialog';
import { MatIconModule }                                                          from '@angular/material/icon';
import { MatFormFieldModule }                                                     from '@angular/material/form-field';
import { MatInputModule }                                                         from '@angular/material/input';
import { MatSelectModule }                                                        from '@angular/material/select';
import { MatProgressSpinnerModule }                                               from '@angular/material/progress-spinner';
import { SetupResponse }                                                          from '../interface';
@Component({
    selector: 'admin-product-filter-dialog',
    standalone: true,
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatDialogModule,
        MatFormFieldModule,
        MatProgressSpinnerModule,
    ],
})
export class FilterDialogComponent {

    @Output() filterSubmitted = new EventEmitter<any>();

    public form: UntypedFormGroup;
    public setup: SetupResponse | null = null;


    constructor(
        public dialogRef: MatDialogRef<FilterDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data : any,
        private _formBuilder: UntypedFormBuilder
    ) {}

    ngOnInit(): void {

        this.setup = this.data.setup;
        this.ngBuilderForm();
    }

    ngBuilderForm(): void {
        this.form = this._formBuilder.group({
            productTypes: [this.data.filter.productTypes ?? ''],
            users: [this.data.filter.users ?? ''], // Bind to user selection
        });
    }

    submit(): void {
        this.filterSubmitted.emit({
            ...this.form.value, // Emit all form values
            // type: this.form.value.productTypes, // Pass the selected product type ID as 'type'
            // creator: this.form.value.users, // Pass the selected user ID as 'creator'
        });
        this.dialogRef.close();
    }

    reset(): void {
        this.form.reset();

    }

    closeDialog(): void {
        this.form.reset();
        this.dialogRef.close();
    }
}
