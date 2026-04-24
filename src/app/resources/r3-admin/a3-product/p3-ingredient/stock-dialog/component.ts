import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { IngredientAdminService } from '../service';
import { IngredientRow } from '../interface';

export type StockDialogData = {
  row: IngredientRow;
};

@Component({
  selector: 'app-ingredient-stock-dialog',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
})
export class IngredientStockDialogComponent implements OnInit {
  saving = false;
  form = this.fb.group({
    stock: [0, [Validators.required, Validators.min(0)]],
    low_stock_threshold: [0, [Validators.required, Validators.min(0)]],
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: StockDialogData,
    private dialogRef: MatDialogRef<IngredientStockDialogComponent>,
    private fb: FormBuilder,
    private service: IngredientAdminService,
    private snackBar: SnackbarService,
  ) {}

  ngOnInit(): void {
    this.form.patchValue({
      stock: this.data.row.stock,
      low_stock_threshold: this.data.row.low_stock_threshold ?? 0,
    });
  }

  get isLow(): boolean {
    const s = Number(this.form.get('stock')?.value);
    const low = Number(this.form.get('low_stock_threshold')?.value);
    return !Number.isNaN(s) && !Number.isNaN(low) && s <= low;
  }

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.dialogRef.disableClose = true;
    this.service.update(this.data.row.id, this.form.getRawValue()).subscribe({
      next: (res) => {
        this.saving = false;
        this.snackBar.openSnackBar(res.message, GlobalConstants.success);
        this.dialogRef.close(res.data);
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.dialogRef.disableClose = false;
        this.snackBar.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
      },
    });
  }
}
