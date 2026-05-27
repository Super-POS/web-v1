import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { ErpPurchaseOrder } from '../../interface';
import { ErpPurchasingService } from '../../service';

@Component({
    selector: 'erp-create-po-dialog',
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
export class ErpCreatePODialogComponent implements OnInit {
    resData = new EventEmitter<ErpPurchaseOrder>();
    form: FormGroup;
    isSaving = false;

    constructor(
        private _dialogRef: MatDialogRef<ErpCreatePODialogComponent>,
        private _fb: FormBuilder,
        private _snackBar: SnackbarService,
        private _service: ErpPurchasingService,
    ) {}

    ngOnInit(): void {
        this.form = this._fb.group({
            supplier_id: [null, Validators.required],
            order_date: ['', Validators.required],
            expected_date: [''],
            notes: [''],
            items: this._fb.array([]),
        });
        this.addItem();
    }

    get itemsArray(): FormArray {
        return this.form.get('items') as FormArray;
    }

    get totalAmount(): number {
        return this.itemsArray.controls.reduce((sum, ctrl) => {
            const qty = Number(ctrl.get('quantity')?.value) || 0;
            const cost = Number(ctrl.get('unit_cost')?.value) || 0;
            return sum + qty * cost;
        }, 0);
    }

    addItem(): void {
        const itemGroup = this._fb.group({
            ingredient_id: [null],
            item_name: ['', Validators.required],
            quantity: [1, [Validators.required, Validators.min(0.001)]],
            unit: ['', Validators.required],
            unit_cost: [0, [Validators.required, Validators.min(0)]],
        });
        this.itemsArray.push(itemGroup);
    }

    removeItem(index: number): void {
        if (this.itemsArray.length > 1) {
            this.itemsArray.removeAt(index);
        }
    }

    submit(): void {
        if (this.form.invalid) { return; }
        this._dialogRef.disableClose = true;
        this.isSaving = true;
        const val = this.form.getRawValue();
        const body = {
            supplier_id: Number(val.supplier_id),
            order_date: val.order_date,
            expected_date: val.expected_date || undefined,
            notes: val.notes || undefined,
            items: val.items.map((item: any) => ({
                ingredient_id: item.ingredient_id || undefined,
                item_name: item.item_name,
                quantity: Number(item.quantity),
                unit: item.unit,
                unit_cost: Number(item.unit_cost),
            })),
        };
        this._service.createPurchaseOrder(body).subscribe({
            next: (res) => {
                this.isSaving = false;
                this._dialogRef.disableClose = false;
                this.resData.emit(res.data);
                this._snackBar.openSnackBar(res.message || 'Purchase order created.', GlobalConstants.success);
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
