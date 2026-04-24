import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { IngredientCreateDialogComponent } from '../create-dialog/component';
import { IngredientRow } from '../interface';
import { IngredientAdminService } from '../service';
import { IngredientStockDialogComponent } from '../stock-dialog/component';

@Component({
  selector: 'app-ingredient-listing',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    CommonModule,
    DecimalPipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RouterModule,
    FormsModule,
  ],
})
export class IngredientListingComponent implements OnInit {
  private _service = inject(IngredientAdminService);
  private _snack = inject(SnackbarService);
  private _dialog = inject(MatDialog);

  displayedColumns: string[] = ['no', 'name', 'unit', 'stock', 'low', 'status', 'action'];
  dataSource = new MatTableDataSource<IngredientRow>([]);
  /** Full list from API (search filters a copy into dataSource) */
  allRows: IngredientRow[] = [];
  searchKey = '';
  isLoading = true;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this._service.getList().subscribe({
      next: (res) => {
        this.allRows = res.data;
        this.applySearch();
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this._snack.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
      },
    });
  }

  isLow(row: IngredientRow): boolean {
    return Number(row.stock) <= Number(row.low_stock_threshold);
  }

  onSearchInput(): void {
    this.applySearch();
  }

  private applySearch(): void {
    const q = this.searchKey.trim().toLowerCase();
    if (!q) {
      this.dataSource.data = [...this.allRows];
      return;
    }
    this.dataSource.data = this.allRows.filter((r) => {
      const name = (r.name || '').toLowerCase();
      const unit = (r.unit || '').toLowerCase();
      return (
        name.includes(q) ||
        unit.includes(q) ||
        String(r.id) === q ||
        String(r.stock).includes(q) ||
        String(r.low_stock_threshold).includes(q)
      );
    });
  }

  openEdit(row: IngredientRow): void {
    const cfg = new MatDialogConfig<unknown>();
    cfg.autoFocus = false;
    cfg.data = { row };
    const ref = this._dialog.open(IngredientStockDialogComponent, cfg);
    ref.afterClosed().subscribe((updated: IngredientRow | undefined) => {
      if (updated) {
        this.allRows = this.allRows.map((r) => (r.id === updated.id ? updated : r));
        this.applySearch();
      }
    });
  }

  openCreate(): void {
    const cfg = new MatDialogConfig();
    cfg.autoFocus = false;
    const ref = this._dialog.open(IngredientCreateDialogComponent, cfg);
    ref.afterClosed().subscribe((created: IngredientRow | undefined) => {
      if (created) {
        this.allRows = [created, ...this.allRows];
        this.applySearch();
      }
    });
  }
}
