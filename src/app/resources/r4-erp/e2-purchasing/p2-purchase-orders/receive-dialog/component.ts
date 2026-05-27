import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { ErpPurchaseOrder } from '../../interface';
import { ErpPurchasingService } from '../../service';

@Component({
    selector: 'erp-receive-goods-dialog',
    standalone: true,
    templateUrl: './template.html',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
    ],
})
export class ErpReceiveGoodsDialogComponent implements OnInit {
    resData = new EventEmitter<void>();
    form: FormGroup;
    isSaving = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: ErpPurchaseOrder,
        private _dialogRef: MatDialogRef<ErpReceiveGoodsDialogComponent>,
        private _fb: FormBuilder,
        private _snackBar: SnackbarService,
        private _service: ErpPurchasingService,
    ) {}

    ngOnInit(): void {
        const itemControls = (this.data.items || []).map((item) =>
            this._fb.group({
                item_id: [item.id],
                item_name: [{ value: item.item_name, disabled: true }],
                ordered_quantity: [{ value: item.quantity, disabled: true }],
                unit: [{ value: item.unit, disabled: true }],
                received_quantity: [item.quantity, [Validators.required, Validators.min(0)]],
            })
        );
        this.form = this._fb.group({
            received_date: ['', Validators.required],
            notes: [''],
            items: this._fb.array(itemControls),
        });
    }

    get itemsArray(): FormArray {
        return this.form.get('items') as FormArray;
    }

    submit(): void {
        if (this.form.invalid) { return; }
        this._dialogRef.disableClose = true;
        this.isSaving = true;
        const val = this.form.getRawValue();
        const body = {
            received_date: val.received_date,
            notes: val.notes || undefined,
            items: val.items.map((item: any) => ({
                item_id: item.item_id,
                received_quantity: Number(item.received_quantity),
            })),
        };
        this._service.receiveGoods(this.data.id, body).subscribe({
            next: (res) => {
                this.isSaving = false;
                this._dialogRef.disableClose = false;
                this.resData.emit();
                this._snackBar.openSnackBar(res.message || 'Goods received.', GlobalConstants.success);
                this._dialogRef.close();
            },
            error: (err: HttpErrorResponse) => {
                this._dialogRef.disableClose = false;
                this.isSaving = false;
                this._snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    closeDialog(): void { this._dialogRef.close(); }
}
