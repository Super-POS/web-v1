import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { Data as MenuData } from '../../p1-menu/interface';
import { MenuService } from '../../p1-menu/service';
import { ModifierGroupRow } from '../interface';
import { ModifierAdminService } from '../service';

export type AssignDialogData = { allGroups: ModifierGroupRow[] };

type Row = { modifier_group_id: number; sort_order: number; is_required: boolean };

@Component({
    selector: 'admin-modifier-assign-dialog',
    templateUrl: './template.html',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatSlideToggleModule,
    ],
})
export class ModifierAssignDialogComponent implements OnInit {
    private _ref = inject(MatDialogRef<ModifierAssignDialogComponent, boolean>);
    private _mod = inject(ModifierAdminService);
    private _menus = inject(MenuService);
    private _snack = inject(SnackbarService);
    data = inject<AssignDialogData>(MAT_DIALOG_DATA);
    get allGroups(): ModifierGroupRow[] {
        return this.data?.allGroups ?? [];
    }

    menus: MenuData[] = [];
    selectedMenuId: number | null = null;
    rows: Row[] = [];
    isLoading = false;
    isSaving = false;

    ngOnInit(): void {
        this._menus.getData().subscribe({
            next: (res) => {
                this.menus = res?.data ?? [];
            },
            error: () => {
                this.menus = [];
            },
        });
    }

    onMenuChange(): void {
        if (this.selectedMenuId == null) {
            this.rows = [];
            return;
        }
        this.isLoading = true;
        this._mod.getMenuAssignments(this.selectedMenuId).subscribe({
            next: (res) => {
                this.rows = (res.data || []).map((a) => ({
                    modifier_group_id: a.modifier_group_id,
                    sort_order: a.sort_order,
                    is_required: a.is_required,
                }));
                this.isLoading = false;
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this._snack.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    addRow(): void {
        const used = new Set(this.rows.map((r) => r.modifier_group_id));
        const next = this.allGroups.find((g) => !used.has(g.id));
        if (!next) {
            this._snack.openSnackBar('All groups are already added.', GlobalConstants.error);
            return;
        }
        this.rows.push({ modifier_group_id: next.id, sort_order: this.rows.length, is_required: false });
    }

    removeRow(i: number): void {
        this.rows.splice(i, 1);
    }

    groupLabel(id: number): string {
        return this.allGroups.find((g) => g.id === id)?.name ?? `#${id}`;
    }

    availableGroupsFor(i: number): ModifierGroupRow[] {
        const current = this.rows[i]?.modifier_group_id;
        const used = new Set(this.rows.map((r, j) => (j === i ? null : r.modifier_group_id)).filter((x) => x != null));
        return this.allGroups.filter((g) => g.id === current || !used.has(g.id));
    }

    onGroupChange(i: number, groupId: number): void {
        this.rows[i].modifier_group_id = groupId;
    }

    save(): void {
        if (this.selectedMenuId == null) {
            return;
        }
        const items = this.rows
            .map((r) => ({
                modifier_group_id: r.modifier_group_id,
                sort_order: Number(r.sort_order),
                is_required: r.is_required,
            }))
            .sort((a, b) => a.sort_order - b.sort_order);
        this.isSaving = true;
        this._mod.setMenuAssignments(this.selectedMenuId, items).subscribe({
            next: () => {
                this._snack.openSnackBar('Menu modifier links saved.', GlobalConstants.success);
                this.isSaving = false;
                this._ref.close(true);
            },
            error: (err: HttpErrorResponse) => {
                this.isSaving = false;
                this._snack.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    cancel(): void {
        this._ref.close(false);
    }
}
