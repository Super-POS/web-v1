// ================================================================>> Core Library
import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MenuItem, NormalizedModifierGroup } from '../interface';

export interface ModifierPickResult {
    modifier_option_ids: number[];
    line_note?: string;
}

@Component({
    selector: 'cashier-modifier-pick-dialog',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatRadioModule,
        DecimalPipe,
    ],
})
export class ModifierPickDialogComponent {
    private _dialogRef = inject(MatDialogRef<ModifierPickDialogComponent, ModifierPickResult | undefined>);
    data = inject<MenuItem & { _qty: number }>(MAT_DIALOG_DATA);

    /** group id -> option id */
    selected: Record<number, number> = {};
    private _initialSelected: Record<number, number> = {};
    line_note: string = '';

    groups: NormalizedModifierGroup[] = [];
    unitTotal = 0;
    lineTotal = 0;

    constructor() {
        this.groups = (this.data.modifierGroups || []).filter((g) => g && g.id != null);
        for (const g of this.groups) {
            const opts = [...(g.options || [])].sort(
                (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
            );
            const def = opts.find((o) => o.is_default) || (g.is_required ? opts[0] : undefined);
            if (def) {
                this.selected[g.id] = def.id;
                this._initialSelected[g.id] = def.id;
            }
        }
        this._recalc();
    }

    onOptionChange(): void {
        this._recalc();
    }

    clearSelection(groupId: number): void {
        delete this.selected[groupId];
        this._recalc();
    }

    selectedOptionLabel(group: NormalizedModifierGroup): string {
        const id = this.selected[group.id];
        if (id == null) {
            return group.is_required ? 'Please choose one' : '—';
        }
        return (group.options || []).find((o) => o.id === id)?.label || 'Selected';
    }

    requiredMissingNames(): string[] {
        return this.groups
            .filter((g) => g.is_required && this.selected[g.id] == null)
            .map((g) => g.name);
    }

    hasAnySelection(): boolean {
        return this.groups.some((g) => this.selected[g.id] != null);
    }

    resetDefaults(): void {
        this.selected = { ...this._initialSelected };
        this._recalc();
    }

    private _recalc(): void {
        let deltaUnit = 0;
        for (const g of this.groups) {
            const optId = this.selected[g.id];
            const o = (g.options || []).find((x) => x.id === optId);
            if (o) {
                deltaUnit += Number(o.price_delta || 0);
            }
        }
        this.unitTotal = Number(this.data.unit_price || 0) + deltaUnit;
        this.lineTotal = this.unitTotal * (this.data._qty || 1);
    }

    isValid(): boolean {
        for (const g of this.groups) {
            if (g.is_required && (this.selected[g.id] == null || this.selected[g.id] === undefined)) {
                return false;
            }
        }
        return true;
    }

    confirm(): void {
        if (!this.isValid()) {
            return;
        }
        const ids = this.groups
            .map((g) => this.selected[g.id])
            .filter((id): id is number => id != null && id > 0);
        const note = (this.line_note || '').trim().slice(0, 500);
        this._dialogRef.close({
            modifier_option_ids: ids,
            line_note: note.length > 0 ? note : undefined,
        });
    }

    cancel(): void {
        this._dialogRef.close(undefined);
    }
}
