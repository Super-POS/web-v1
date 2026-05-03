import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, UntypedFormArray, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { MenuIngredientService } from '../../p3-ingredient/service';
import { IngredientItem } from '../../p3-ingredient/interface';
import { IngredientRecipeLine, ModifierOptionRow } from '../interface';
import { ModifierAdminService } from '../service';
import { ExchangeRateSettingService } from 'helper/services/exchange-rate-setting/exchange-rate-setting.service';

export type OptionDialogData = { groupId: number; option?: ModifierOptionRow };

@Component({
    selector: 'admin-modifier-option-dialog',
    templateUrl: './template.html',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSlideToggleModule,
        MatSelectModule,
    ],
})
export class ModifierOptionDialogComponent implements OnInit {
    private _ref = inject(MatDialogRef<ModifierOptionDialogComponent, ModifierOptionRow | undefined>);
    private _fb = inject(UntypedFormBuilder);
    private _service = inject(ModifierAdminService);
    private _ing = inject(MenuIngredientService);
    private _snack = inject(SnackbarService);
    private _exchange = inject(ExchangeRateSettingService);
    data = inject<OptionDialogData>(MAT_DIALOG_DATA);

    isEdit = !!this.data?.option;
    isSaving = false;
    ingredients: IngredientItem[] = [];

    form = this._fb.group({
        label: [this.data?.option?.label ?? '', Validators.required],
        price_delta_usd: [
            ExchangeRateSettingService.khrToUsd(
                this.data?.option?.price_delta,
                ExchangeRateSettingService.FALLBACK_KHR_PER_USD,
            ),
        ],
        is_default: [this.data?.option?.is_default ?? false],
        lines: this._fb.array(
            (this.data?.option?.ingredient_recipe ?? []).map((l) => this._lineGroup(l)) as never[],
        ),
    });

    private _lineGroup(l?: Partial<IngredientRecipeLine>) {
        return this._fb.group({
            ingredient_id: [l?.ingredient_id ?? null],
            quantity: [l?.quantity ?? 0],
        });
    }

    get lines(): UntypedFormArray {
        return this.form.get('lines') as UntypedFormArray;
    }

    ngOnInit(): void {
        this._ing.getData().subscribe({
            next: (res) => (this.ingredients = res?.data ?? []),
            error: () => (this.ingredients = []),
        });
        this._exchange.fetchAdmin().subscribe({
            next: () => {
                if (this.data?.option && this.form) {
                    this.form.patchValue({
                        price_delta_usd: this._exchange.khrToUsd(this.data.option.price_delta),
                    });
                }
            },
            error: () => {},
        });
    }

    addLine(): void {
        this.lines.push(this._lineGroup());
    }

    removeLine(i: number): void {
        this.lines.removeAt(i);
    }

    submit(): void {
        const raw = this.form.getRawValue() as { lines: { ingredient_id: number | null; quantity: number }[]; [k: string]: unknown };
        for (const r of raw.lines || []) {
            const a = r.ingredient_id != null;
            const b = Number.isFinite(Number(r.quantity)) && Number(r.quantity) >= 0;
            if (a && !b) {
                this._snack.openSnackBar('Each recipe line with an ingredient must have quantity 0 or greater.', GlobalConstants.error);
                return;
            }
            if (!a && Number(r.quantity) > 0) {
                this._snack.openSnackBar('Please select ingredient for the entered quantity.', GlobalConstants.error);
                return;
            }
        }
        if (this.form.get('label')?.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.isSaving = true;
        const v = this.form.getRawValue() as {
            label: string;
            price_delta_usd: number;
            is_default: boolean;
            lines: { ingredient_id: number; quantity: number }[];
        };
        const recipeLines: IngredientRecipeLine[] = (v.lines || [])
            .filter(
                (x) => x && x.ingredient_id != null && Number(x.quantity) >= 0,
            )
            .map((x) => ({
                ingredient_id: Number(x.ingredient_id),
                quantity: Number(x.quantity),
            }));
        const body = {
            label: v.label,
            price_delta: this._exchange.usdToKhr(Number(v.price_delta_usd) || 0),
            is_default: v.is_default,
            is_active: true,
            ingredient_recipe: recipeLines,
        };
        const req$ = this.isEdit
            ? this._service.updateOption(this.data!.option!.id, body)
            : this._service.createOption(this.data!.groupId, body);
        req$.subscribe({
            next: (res) => {
                this._snack.openSnackBar(res.message, GlobalConstants.success);
                this._ref.close(res.data);
            },
            error: (err: HttpErrorResponse) => {
                this.isSaving = false;
                this._snack.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    cancel(): void {
        this._ref.close(undefined);
    }
}
