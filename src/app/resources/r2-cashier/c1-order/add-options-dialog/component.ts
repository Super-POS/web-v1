import { NgFor } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Product } from '../interface';

export interface AddOptionsDialogData {
  product: Product;
}

export interface AddOptionsDialogResult {
  sugar_pct: number;
  shots: number;
}

@Component({
  selector: 'app-order-add-options-dialog',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [NgFor, MatDialogModule, MatButtonModule, FormsModule],
})
export class AddOptionsDialogComponent {
  sugarPct: number;
  shots: 1 | 2;
  readonly sugarPresets = [0, 25, 50, 75, 100];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddOptionsDialogData,
    private _ref: MatDialogRef<AddOptionsDialogComponent, AddOptionsDialogResult | undefined>,
  ) {
    this.sugarPct = 100;
    this.shots = 1;
  }

  cancel(): void {
    this._ref.close();
  }

  confirm(): void {
    this._ref.close({
      sugar_pct: this.sugarPct,
      shots: this.shots,
    });
  }
}
