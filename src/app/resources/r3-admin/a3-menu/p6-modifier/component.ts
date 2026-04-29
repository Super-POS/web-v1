import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import GlobalConstants from 'helper/shared/constants';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { ModifierGroupRow, ModifierOptionRow } from './interface';
import { ModifierAdminService } from './service';
import { ModifierGroupDialogComponent } from './group-dialog/component';
import { ModifierOptionDialogComponent } from './option-dialog/component';
import { MenuIngredientService } from '../p3-ingredient/service';
import { IngredientItem } from '../p3-ingredient/interface';

@Component({
    selector: 'admin-menu-modifier',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        CommonModule,
        FormsModule,
        DecimalPipe,
        MatButtonModule,
        MatIconModule,
        MatExpansionModule,
        MatTableModule,
    ],
})
export class AdminModifierComponent implements OnInit {
    private _service = inject(ModifierAdminService);
    private _dialog = inject(MatDialog);
    private _snack = inject(SnackbarService);
    private _ingredientService = inject(MenuIngredientService);

    groups: ModifierGroupRow[] = [];
    ingredients: IngredientItem[] = [];
    isLoading = false;
    optionColumns = ['label', 'price_delta', 'amount', 'flags', 'action'];
    search = '';

    ngOnInit(): void {
        this.load();
        this._ingredientService.getData().subscribe({
            next: (res) => (this.ingredients = res?.data ?? []),
            error: () => (this.ingredients = []),
        });
    }

    load(): void {
        this.isLoading = true;
        this._service.listGroups().subscribe({
            next: (res) => {
                this.groups = res?.data ?? [];
                this.isLoading = false;
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this._snack.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    private _drawerConfig<T>(): MatDialogConfig<T> {
        return {
            autoFocus: false,
            position: { right: '0px' },
            height: '100dvh',
            width: '100dvw',
            maxWidth: '480px',
            panelClass: 'custom-mat-dialog-as-mat-drawer',
            enterAnimationDuration: '0s',
        };
    }

    openGroupDialog(g?: ModifierGroupRow): void {
        this._dialog
            .open(ModifierGroupDialogComponent, { ...this._drawerConfig(), data: { group: g } })
            .afterClosed()
            .subscribe((out) => {
                if (out) {
                    this.load();
                }
            });
    }

    deleteGroup(g: ModifierGroupRow): void {
        if (!confirm(`Delete group "${g.name}"?`)) {
            return;
        }
        this._service.deleteGroup(g.id).subscribe({
            next: (r) => {
                this._snack.openSnackBar(r.message, GlobalConstants.success);
                this.load();
            },
            error: (err: HttpErrorResponse) => {
                this._snack.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    openOptionDialog(groupId: number, o?: ModifierOptionRow): void {
        this._dialog
            .open(ModifierOptionDialogComponent, { ...this._drawerConfig(), data: { groupId, option: o } })
            .afterClosed()
            .subscribe((out) => {
                if (out) {
                    this.load();
                }
            });
    }

    deleteOption(g: ModifierGroupRow, o: ModifierOptionRow): void {
        if (!confirm(`Delete option "${o.label}"?`)) {
            return;
        }
        this._service.deleteOption(o.id).subscribe({
            next: (r) => {
                this._snack.openSnackBar(r.message, GlobalConstants.success);
                this.load();
            },
            error: (err: HttpErrorResponse) => {
                this._snack.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    filteredGroups(): ModifierGroupRow[] {
        const q = this.search.trim().toLowerCase();
        if (!q) {
            return this.groups;
        }
        return this.groups.filter((g) => {
            const opts = (g.options || []).some((o) =>
                `${o.label}`.toLowerCase().includes(q),
            );
            return `${g.name}`.toLowerCase().includes(q) || opts;
        });
    }

    totalOptions(): number {
        return this.groups.reduce((n, g) => n + (g.options?.length || 0), 0);
    }

    optionsWithRecipe(g: ModifierGroupRow): number {
        return (g.options || []).filter((o) => (o.ingredient_recipe?.length || 0) > 0).length;
    }

    optionAmount(o: ModifierOptionRow): string {
        const lines = o.ingredient_recipe || [];
        if (!lines.length) {
            return '—';
        }
        return lines
            .map((line) => {
                const ing = this.ingredients.find((x) => x.id === line.ingredient_id);
                const unit = ing?.unit ? ` ${ing.unit}` : '';
                const name = ing?.name ?? `#${line.ingredient_id}`;
                return `${name}: ${Number(line.quantity)}${unit}`;
            })
            .join(', ');
    }
}
