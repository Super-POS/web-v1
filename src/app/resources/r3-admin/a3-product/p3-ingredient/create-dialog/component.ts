import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { IngredientAdminService } from '../service';

@Component({
  selector: 'app-ingredient-create-dialog',
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
export class IngredientCreateDialogComponent {
  saving = false;
  form = this.fb.group({
    name: ['', [Validators.required]],
    unit: ['', [Validators.required]],
    stock: [0, [Validators.required, Validators.min(0)]],
    low_stock_threshold: [0, [Validators.min(0)]],
  });

  constructor(
    private dialogRef: MatDialogRef<IngredientCreateDialogComponent>,
    private fb: FormBuilder,
    private service: IngredientAdminService,
    private snackBar: SnackbarService,
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.dialogRef.disableClose = true;
    const v = this.form.getRawValue();
    this.service
      .create({
        name: v.name!.trim(),
        unit: v.unit!.trim(),
        stock: Number(v.stock),
        low_stock_threshold: Number(v.low_stock_threshold ?? 0),
      })
      .subscribe({
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
