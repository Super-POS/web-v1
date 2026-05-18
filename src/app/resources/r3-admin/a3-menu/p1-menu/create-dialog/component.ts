
// ================================================================================>> Core Library
import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

// ================================================================================>> Thrid Party Library
// Material
import { HttpErrorResponse } from '@angular/common/http';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { env } from 'envs/env';

import { PortraitComponent } from 'helper/components/portrait/component';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { Subject, takeUntil } from 'rxjs';
import { Data, MenuSizeData } from '../interface';
import { MenuService } from '../service';
import { MenuIngredientService } from '../../p3-ingredient/service';
import { IngredientItem } from '../../p3-ingredient/interface';
import { ModifierAdminService } from '../../p6-modifier/service';
import { ModifierGroupRow } from '../../p6-modifier/interface';
import { ExchangeRateSettingService } from 'helper/services/exchange-rate-setting/exchange-rate-setting.service';

@Component({
    selector: 'app-menu-form-dialog',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: true,
    imports: [
        RouterModule,
        FormsModule,
        MatIconModule,
        CommonModule,
        MatTooltipModule,
        AsyncPipe,
        MatProgressSpinnerModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatAutocompleteModule,
        MatDatepickerModule,
        MatButtonModule,
        MatMenuModule,
        MatDividerModule,
        MatRadioModule,
        MatDialogModule,
        MatCheckboxModule,
        MatSlideToggleModule,
        PortraitComponent
    ]
})
export class MenuFormDialogComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    ResponseData = new EventEmitter<Data>();

    menuForm: UntypedFormGroup;
    saving: boolean = false;
    src: string = 'icons/image.jpg';
    ingredients: IngredientItem[] = [];
    modifierGroups: ModifierGroupRow[] = [];
    isLoadingModifiers = false;

    readonly SIZE_LABELS: Record<string, string> = { S: 'Small (S)', M: 'Medium (M)', L: 'Large (L)' };
    readonly SIZES = ['S', 'M', 'L'] as const;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { title: string, menu: Data, setup: any },
        private dialogRef: MatDialogRef<MenuFormDialogComponent>,
        private formBuilder: UntypedFormBuilder,
        private snackBarService: SnackbarService,
        private menuService: MenuService,
        private _ingredientService: MenuIngredientService,
        private _modifierService: ModifierAdminService,
        private _exchange: ExchangeRateSettingService,
    ) { }

    ngOnInit(): void {
        this.data.menu != null ? this.src = `${env.FILE_BASE_URL}${this.data.menu.image}` : '';
        this._ingredientService.getData().subscribe({
            next: (res) => (this.ingredients = res.data ?? []),
        });
        this.ngBuilderForm();
        this._listenHasSizes();
        this._loadModifierData();
        this._exchange.fetchAdmin().subscribe({
            next: () => {
                if (this.data?.menu?.unit_price != null && this.menuForm && !this.hasSizes) {
                    this.menuForm.patchValue({
                        unit_price_usd: this._exchange.khrToUsd(this.data.menu.unit_price),
                    });
                }
            },
            error: () => {},
        });
    }

    get hasSizes(): boolean {
        return !!this.menuForm?.get('has_sizes')?.value;
    }

    // ── Single-size recipe helpers ────────────────────────────────────────────

    get recipeRows(): FormArray {
        return this.menuForm?.get('recipes') as FormArray;
    }

    addRecipeRow(): void {
        this.recipeRows.push(this._recipeGroup());
    }

    removeRecipeRow(index: number): void {
        this.recipeRows.removeAt(index);
    }

    // ── Per-size helpers ──────────────────────────────────────────────────────

    get sizeRows(): FormArray {
        return this.menuForm?.get('sizes') as FormArray;
    }

    sizeRecipeRows(sizeIndex: number): FormArray {
        return (this.sizeRows.at(sizeIndex) as UntypedFormGroup).get('recipes') as FormArray;
    }

    addSizeRecipeRow(sizeIndex: number): void {
        this.sizeRecipeRows(sizeIndex).push(this._recipeGroup());
    }

    removeSizeRecipeRow(sizeIndex: number, rowIndex: number): void {
        this.sizeRecipeRows(sizeIndex).removeAt(rowIndex);
    }

    // ── Form builders ─────────────────────────────────────────────────────────

    private _recipeGroup(r?: { ingredient_id: number; quantity: number }): UntypedFormGroup {
        return this.formBuilder.group({
            ingredient_id: [r?.ingredient_id ?? null, Validators.required],
            quantity: [r?.quantity ?? null, [Validators.required, Validators.min(0.0001)]],
        });
    }

    private _sizeGroup(sizeKey: 'S' | 'M' | 'L', existing?: MenuSizeData, requirePrice = true): UntypedFormGroup {
        const priceUsd = existing?.price != null
            ? ExchangeRateSettingService.khrToUsd(existing.price, ExchangeRateSettingService.FALLBACK_KHR_PER_USD)
            : null;
        const recipes = this.formBuilder.array(
            (existing?.recipes ?? []).map((r) => this._recipeGroup(r))
        );
        return this.formBuilder.group({
            size: [sizeKey],
            price_usd: [priceUsd, requirePrice ? [Validators.required, Validators.min(0.01)] : []],
            recipes,
        });
    }

    private _listenHasSizes(): void {
        this.menuForm.get('has_sizes')?.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((enabled: boolean) => {
                const priceCtrl = this.menuForm.get('unit_price_usd');
                if (enabled) {
                    priceCtrl?.clearValidators();
                    priceCtrl?.setValue(null);
                } else {
                    priceCtrl?.setValidators([Validators.required, Validators.min(0.01)]);
                }
                priceCtrl?.updateValueAndValidity();

                const sizesArray = this.menuForm.get('sizes') as FormArray;
                sizesArray?.controls.forEach(ctrl => {
                    const sizePriceCtrl = (ctrl as UntypedFormGroup).get('price_usd');
                    if (enabled) {
                        sizePriceCtrl?.setValidators([Validators.required, Validators.min(0.01)]);
                    } else {
                        sizePriceCtrl?.clearValidators();
                    }
                    sizePriceCtrl?.updateValueAndValidity();
                });
            });
    }

    ngBuilderForm(): void {
        const menu = this.data?.menu;
        const hasSizes = menu?.has_sizes ?? false;

        const existingRecipes = !hasSizes ? (menu?.recipes ?? []) : [];
        const recipeArray = this.formBuilder.array(
            existingRecipes.map((r) => this._recipeGroup(r))
        ) as FormArray;

        const usdGuess = !hasSizes && menu?.unit_price != null
            ? ExchangeRateSettingService.khrToUsd(menu.unit_price, ExchangeRateSettingService.FALLBACK_KHR_PER_USD)
            : null;

        const existingSizes = menu?.sizes ?? [];
        const sizesArray = this.formBuilder.array(
            this.SIZES.map((s) => {
                const found = existingSizes.find((es) => es.size === s);
                return this._sizeGroup(s, found, hasSizes);
            })
        );

        this.menuForm = this.formBuilder.group({
            code: [menu?.code || null, [Validators.required]],
            name: [menu?.name || null, [Validators.required]],
            type_id: [menu?.type?.id || null, [Validators.required]],
            image: [null, menu == null ? Validators.required : []],
            has_sizes: [hasSizes],
            unit_price_usd: [
                usdGuess,
                hasSizes ? [] : [Validators.required, Validators.min(0.01)],
            ],
            recipes: recipeArray,
            sizes: sizesArray,
            modifier_items: [[]],
        });
    }

    // ── Payload builder ───────────────────────────────────────────────────────

    private _buildPayload(): any | null {
        const raw = this.menuForm.getRawValue();
        const base = {
            code: String(raw.code ?? '').trim(),
            name: String(raw.name ?? '').trim(),
            type_id: Number(raw.type_id),
            ...(raw.image ? { image: raw.image } : {}),
        };

        if (raw.has_sizes) {
            const sizes = (raw.sizes as any[]).map((sg) => {
                const seen = new Set<number>();
                const recipes: { ingredient_id: number; quantity: number }[] = [];
                for (const row of (sg.recipes ?? [])) {
                    if (row?.ingredient_id == null || Number(row.quantity) <= 0) continue;
                    const id = Number(row.ingredient_id);
                    if (seen.has(id)) {
                        this.snackBarService.openSnackBar(
                            `Duplicate ingredient in ${this.SIZE_LABELS[sg.size]} recipe; keep one row per ingredient.`,
                            GlobalConstants.error,
                        );
                        return null;
                    }
                    seen.add(id);
                    recipes.push({ ingredient_id: id, quantity: Number(row.quantity) });
                }
                return { size: sg.size, price: this._exchange.usdToKhr(Number(sg.price_usd)), recipes };
            });
            if (sizes.some((s) => s === null)) return null;
            return { ...base, has_sizes: true, sizes };
        }

        const seen = new Set<number>();
        const recipes: { ingredient_id: number; quantity: number }[] = [];
        for (const row of (raw.recipes ?? [])) {
            if (row?.ingredient_id == null || Number(row.quantity) <= 0) continue;
            const id = Number(row.ingredient_id);
            if (seen.has(id)) {
                this.snackBarService.openSnackBar('Duplicate ingredient in recipe; keep one row per ingredient.', GlobalConstants.error);
                return null;
            }
            seen.add(id);
            recipes.push({ ingredient_id: id, quantity: Number(row.quantity) });
        }
        return {
            ...base,
            has_sizes: false,
            unit_price: this._exchange.usdToKhr(Number(raw.unit_price_usd)),
            recipes,
        };
    }

    // ── Modifier helpers ──────────────────────────────────────────────────────

    private _loadModifierData(): void {
        this.isLoadingModifiers = true;
        this._modifierService.listGroups().subscribe({
            next: (res) => {
                this.modifierGroups = (res?.data ?? []).filter((g) => g.is_active !== false);
                this._initModifierAssignments();
            },
            error: () => {
                this.modifierGroups = [];
                this._initModifierAssignments();
            },
        });
    }

    private _initModifierAssignments(): void {
        if (this.data?.menu?.id) {
            this._modifierService.getMenuAssignments(this.data.menu.id).subscribe({
                next: (res) => {
                    this.applyModifierAssignments(
                        (res?.data ?? []).map((a) => ({
                            modifier_group_id: a.modifier_group_id,
                            sort_order: a.sort_order,
                            is_required: a.is_required,
                        })),
                    );
                    this.isLoadingModifiers = false;
                },
                error: () => {
                    this.menuForm.get('modifier_items')?.setValue([]);
                    this.isLoadingModifiers = false;
                },
            });
            return;
        }
        this.menuForm.get('modifier_items')?.setValue([]);
        this.isLoadingModifiers = false;
    }

    private applyModifierAssignments(
        rows: { modifier_group_id: number; sort_order: number; is_required: boolean }[],
    ): void {
        const sorted = [...rows].sort((a, b) => a.sort_order - b.sort_order);
        this.menuForm.get('modifier_items')?.setValue(
            sorted.map((r) => ({
                modifier_group_id: Number(r.modifier_group_id),
                sort_order: Number(r.sort_order),
                is_required: !!r.is_required,
            })),
        );
    }

    get selectedModifierItems(): { modifier_group_id: number; sort_order: number; is_required: boolean }[] {
        return (this.menuForm?.get('modifier_items')?.value || []) as {
            modifier_group_id: number;
            sort_order: number;
            is_required: boolean;
        }[];
    }

    isModifierSelected(groupId: number): boolean {
        return this.selectedModifierItems.some((x) => x.modifier_group_id === groupId);
    }

    toggleModifierGroup(groupId: number, checked: boolean): void {
        const current = [...this.selectedModifierItems];
        const idx = current.findIndex((x) => x.modifier_group_id === groupId);
        if (checked && idx === -1) {
            current.push({ modifier_group_id: groupId, sort_order: current.length, is_required: false });
        }
        if (!checked && idx >= 0) {
            current.splice(idx, 1);
            current.forEach((item, i) => (item.sort_order = i));
        }
        this.menuForm.get('modifier_items')?.setValue(current);
    }

    onModifierRequiredChange(groupId: number, required: boolean): void {
        const current = [...this.selectedModifierItems];
        const idx = current.findIndex((x) => x.modifier_group_id === groupId);
        if (idx < 0) return;
        current[idx] = { ...current[idx], is_required: required };
        this.menuForm.get('modifier_items')?.setValue(current);
    }

    modifierRequired(groupId: number): boolean {
        return !!this.selectedModifierItems.find((x) => x.modifier_group_id === groupId)?.is_required;
    }

    // ── Image helpers ─────────────────────────────────────────────────────────

    srcChange(base64: string): void {
        this.menuForm.get('image').setValue(base64);
    }

    onFileChange(event: any): void {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.src = e.target.result;
                this.menuForm.get('image')?.setValue(e.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            this.snackBarService.openSnackBar('Please select an image file.', GlobalConstants.error);
        }
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    submit() {
        this.data.menu == null ? this.create() : this.update();
    }

    create(): void {
        const body = this._buildPayload();
        if (!body) return;
        if (!body.image) {
            this.snackBarService.openSnackBar('Please select an image file.', GlobalConstants.error);
            return;
        }
        this.dialogRef.disableClose = true;
        this.saving = true;
        this.menuService.create({ ...body, image: body.image }).subscribe({
            next: response => {
                this._modifierService.setMenuAssignments(response.data.id, this.selectedModifierItems).subscribe({
                    next: () => {
                        this.ResponseData.emit(this._toDataResult(response.data));
                        this.dialogRef.close();
                        this.saving = false;
                        this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
                    },
                    error: (err: HttpErrorResponse) => {
                        this.dialogRef.disableClose = false;
                        this.saving = false;
                        this.snackBarService.openSnackBar(
                            err?.error?.message ?? 'Menu created but failed to save modifier assignments.',
                            GlobalConstants.error,
                        );
                    },
                });
            },
            error: (err: HttpErrorResponse) => {
                this.dialogRef.disableClose = false;
                this.saving = false;
                const errors: { type: string, message: string }[] | undefined = err.error?.errors;
                let message: string = err.error?.message ?? GlobalConstants.genericError;
                if (errors && errors.length > 0) {
                    message = errors.map((obj) => obj.message).join(', ');
                }
                this.snackBarService.openSnackBar(message, GlobalConstants.error);
            }
        });
    }

    update(): void {
        const body = this._buildPayload();
        if (!body) return;
        this.dialogRef.disableClose = true;
        this.saving = true;
        this.menuService.update(this.data.menu.id, body).subscribe({
            next: response => {
                this._modifierService.setMenuAssignments(this.data.menu.id, this.selectedModifierItems).subscribe({
                    next: () => {
                        this.ResponseData.emit(this._toDataResult(response.data));
                        this.dialogRef.close();
                        this.saving = false;
                        this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
                    },
                    error: (err: HttpErrorResponse) => {
                        this.dialogRef.disableClose = false;
                        this.saving = false;
                        this.snackBarService.openSnackBar(
                            err?.error?.message ?? 'Menu updated but failed to save modifier assignments.',
                            GlobalConstants.error,
                        );
                    },
                });
            },
            error: (err: HttpErrorResponse) => {
                this.dialogRef.disableClose = false;
                this.saving = false;
                const errors: { type: string, message: string }[] | undefined = err.error?.errors;
                let message: string = err.error?.message ?? GlobalConstants.genericError;
                if (errors && errors.length > 0) {
                    message = errors.map((obj) => obj.message).join(', ');
                }
                this.snackBarService.openSnackBar(message, GlobalConstants.error);
            }
        });
    }

    private _toDataResult(d: any): Data {
        return {
            id: d.id,
            code: d.code,
            name: d.name,
            image: d.image,
            has_sizes: d.has_sizes,
            unit_price: d.unit_price,
            sizes: d.sizes,
            total_sale: d.total_sale,
            created_at: d.created_at,
            type: {
                id: d.type_id,
                name: this.data.setup.find((v: any) => v.id === d.type_id)?.name || '',
            },
            creator: {
                id: d.creator?.id,
                name: d.creator?.name,
                avatar: d.creator?.avatar || '',
            },
            recipes: d.recipes,
        };
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    closeDialog() {
        this.dialogRef.close();
    }
}
