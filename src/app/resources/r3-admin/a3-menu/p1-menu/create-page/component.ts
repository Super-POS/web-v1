import { AsyncPipe, CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormArray, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { env } from 'envs/env';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { Subject, takeUntil } from 'rxjs';
import { MenuService } from '../service';
import { Data } from '../interface';
import { resolveFileUrl } from 'helper/utils/resolve-file-url';
import { MenuIngredientService } from '../../p3-ingredient/service';
import { IngredientItem } from '../../p3-ingredient/interface';
import { ModifierAdminService } from '../../p6-modifier/service';
import { ModifierGroupRow } from '../../p6-modifier/interface';
import { ExchangeRateSettingService } from 'helper/services/exchange-rate-setting/exchange-rate-setting.service';

@Component({
    selector: 'app-menu-create-page',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
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
        MatRadioModule,
        MatCheckboxModule,
    ]
})
export class MenuCreatePageComponent implements OnInit, OnDestroy {
    private _unsub = new Subject<void>();
    private formBuilder = inject(UntypedFormBuilder);
    private snackBarService = inject(SnackbarService);
    private menuService = inject(MenuService);
    private _ingredientService = inject(MenuIngredientService);
    private _modifierService = inject(ModifierAdminService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private _exchange = inject(ExchangeRateSettingService);

    formReady = false;
    menuForm!: UntypedFormGroup;
    saving = false;
    src = 'icons/image.jpg';
    setup: any[] = [];
    ingredients: IngredientItem[] = [];
    modifierGroups: ModifierGroupRow[] = [];
    isLoadingModifiers = false;
    fileUrl: string = env.FILE_BASE_URL;
    menuId: number | null = null;
    isEditMode = false;
    pageTitle = 'Create a menu item';
    pageSubtitle = 'Set the image, pricing, sizes, and recipes in one place.';
    breadcrumbAction = 'Create new';
    actionLabel = 'Save menu';

    readonly SIZE_LABELS: Record<string, string> = { S: 'Small', M: 'Medium', L: 'Large' };
    readonly SIZES = ['S', 'M', 'L'] as const;

    ngOnInit(): void {
        this._ingredientService.getData().subscribe({
            next: (res) => (this.ingredients = res.data ?? []),
        });

        this._exchange.fetchAdmin().subscribe({
            next: () => this.initRouteListener(),
            error: () => this.initRouteListener(),
        });
    }

    private initRouteListener(): void {
        this.route.paramMap
            .pipe(takeUntil(this._unsub))
            .subscribe(() => {
                this.initRouteState();
                this.initForm();
            });
    }

    private initRouteState(): void {
        const rawId = this.route.snapshot.paramMap.get('id');
        this.menuId = rawId ? Number(rawId) : null;
        this.isEditMode = Number.isFinite(this.menuId ?? NaN);
        this.breadcrumbAction = this.isEditMode ? 'Edit' : 'Create new';
        this.pageTitle = this.isEditMode ? 'Edit menu item' : 'Create a menu item';
        this.pageSubtitle = this.isEditMode
            ? 'Update the image, pricing, sizes, and recipes.'
            : 'Set the image, pricing, sizes, and recipes in one place.';
        this.actionLabel = this.isEditMode ? 'Update menu' : 'Save menu';
    }

    private initForm(): void {
        if (this.isEditMode && this.menuId) {
            this.loadMenuForEdit(this.menuId);
            return;
        }
        this.bootstrapForm();
    }

    private loadMenuForEdit(menuId: number): void {
        this.menuService.getById(menuId).subscribe({
            next: (res) => {
                this.bootstrapForm(res.data);
            },
            error: (err: HttpErrorResponse) => {
                this.snackBarService.openSnackBar(
                    err?.error?.message ?? 'Failed to load menu for editing.',
                    GlobalConstants.error,
                );
                this.router.navigate(['/admin/menu/all']);
            },
        });
    }

    private bootstrapForm(menu?: Data): void {
        const hasSizes = !!menu?.has_sizes;
        const unitPriceUsd = !hasSizes && menu?.unit_price != null
            ? this._exchange.khrToUsd(menu.unit_price)
            : null;

        this.menuForm = this.formBuilder.group({
            code:           [menu?.code ?? null, Validators.required],
            name:           [menu?.name ?? null, Validators.required],
            type_id:        [menu?.type?.id ?? menu?.type_id ?? null, Validators.required],
            image:          [null, menu ? [] : Validators.required],
            unit_price_usd: [unitPriceUsd, hasSizes ? [] : [Validators.required, Validators.min(0.01)]],
            // sizes: one group per S/M/L, holds enabled flag + price only
            sizes:          this.formBuilder.array(this.SIZES.map((s) => this._sizeGroup(s, menu))),
            // sizeRecipes: flat rows, each row has amount_S / amount_M / amount_L columns
            sizeRecipes:    this.formBuilder.array(this._buildSizeRecipeRows(menu)),
            modifier_items: [[]],
        });

        if (menu?.image) {
            this.src = resolveFileUrl(this.fileUrl, menu.image);
        }

        // Keep unit_price_usd validators in sync when sizes are toggled
        this.sizeRows.controls.forEach((ctrl) =>
            ctrl.get('enabled')!.valueChanges
                .pipe(takeUntil(this._unsub))
                .subscribe(() => this._syncPriceValidator())
        );

        this._syncPriceValidator();
        this.loadSetup();
        this._loadModifierData();
        this.formReady = true;
    }

    // ── Derived state ─────────────────────────────────────────────────────────

    get hasSizes(): boolean {
        return this.sizeRows?.controls.some((c) => c.get('enabled')?.value === true) ?? false;
    }

    isSizeEnabled(si: number): boolean {
        return !!this.sizeRows.at(si)?.get('enabled')?.value;
    }

    /** Indices (0/1/2) of currently checked sizes, in order. */
    get enabledSizeIndices(): number[] {
        return [0, 1, 2].filter((i) => this.isSizeEnabled(i));
    }

    // ── Validator sync ────────────────────────────────────────────────────────

    private _syncPriceValidator(): void {
        const ctrl = this.menuForm.get('unit_price_usd')!;
        if (this.hasSizes) {
            ctrl.clearValidators();
            ctrl.setValue(null, { emitEvent: false });
        } else {
            ctrl.setValidators([Validators.required, Validators.min(0.01)]);
        }
        ctrl.updateValueAndValidity();
    }

    onSizeToggle(si: number, checked: boolean): void {
        const group = this.sizeRows.at(si) as UntypedFormGroup;
        group.get('enabled')!.setValue(checked);
        const priceCtrl = group.get('price_usd')!;
        if (checked) {
            priceCtrl.setValidators([Validators.required, Validators.min(0.01)]);
        } else {
            priceCtrl.clearValidators();
            priceCtrl.setValue(null, { emitEvent: false });
        }
        priceCtrl.updateValueAndValidity();
    }

    // ── Form array getters ────────────────────────────────────────────────────

    get sizeRows(): FormArray {
        return this.menuForm.get('sizes') as FormArray;
    }

    get sizeRecipeRows(): FormArray {
        return this.menuForm.get('sizeRecipes') as FormArray;
    }

    // ── Row add/remove ────────────────────────────────────────────────────────

    addSizeRecipeRow(): void         { this.sizeRecipeRows.push(this._sizeRecipeRow()); }
    removeSizeRecipeRow(i: number): void { this.sizeRecipeRows.removeAt(i); }

    // ── Form builders ─────────────────────────────────────────────────────────

    private _sizeGroup(sizeKey: 'S' | 'M' | 'L', menu?: Data): UntypedFormGroup {
        const existing = menu?.sizes?.find((s) => s.size === sizeKey);
        const enabled = !!existing;
        const priceUsd = existing?.price != null
            ? this._exchange.khrToUsd(existing.price)
            : null;
        const validators = enabled ? [Validators.required, Validators.min(0.01)] : [];
        return this.formBuilder.group({
            size:      [sizeKey],
            enabled:   [enabled],
            price_usd: [priceUsd, validators],
        });
    }

    /** One flat row: ingredient selector + one amount column per size. */
    private _sizeRecipeRow(): UntypedFormGroup {
        return this.formBuilder.group({
            ingredient_id: [null, Validators.required],
            amount_S:      [null],
            amount_M:      [null],
            amount_L:      [null],
        });
    }

    private _buildSizeRecipeRows(menu?: Data): UntypedFormGroup[] {
        if (!menu?.sizes?.length) return [];

        const rows = new Map<number, { ingredient_id: number; amount_S?: number; amount_M?: number; amount_L?: number }>();

        for (const size of menu.sizes) {
            for (const recipe of size.recipes ?? []) {
                const existing = rows.get(recipe.ingredient_id) ?? {
                    ingredient_id: recipe.ingredient_id,
                    amount_S: null,
                    amount_M: null,
                    amount_L: null,
                };
                if (size.size === 'S') existing.amount_S = recipe.quantity;
                if (size.size === 'M') existing.amount_M = recipe.quantity;
                if (size.size === 'L') existing.amount_L = recipe.quantity;
                rows.set(recipe.ingredient_id, existing);
            }
        }

        return Array.from(rows.values()).map((row) =>
            this.formBuilder.group({
                ingredient_id: [row.ingredient_id, Validators.required],
                amount_S:      [row.amount_S ?? null],
                amount_M:      [row.amount_M ?? null],
                amount_L:      [row.amount_L ?? null],
            })
        );
    }

    // ── Payload builder ───────────────────────────────────────────────────────

    private _buildPayload(): any | null {
        const raw = this.menuForm.getRawValue();
        const base = {
            code:    String(raw.code ?? '').trim(),
            name:    String(raw.name ?? '').trim(),
            type_id: Number(raw.type_id),
            image:   raw.image,
        };

        const enabledSizes = (raw.sizes as any[]).filter((sg) => sg.enabled);

        if (enabledSizes.length > 0) {
            const sizes = enabledSizes.map((sg) => {
                const sizeKey = sg.size as 'S' | 'M' | 'L';
                const seen = new Set<number>();
                const recipes: { ingredient_id: number; quantity: number }[] = [];
                for (const row of (raw.sizeRecipes ?? [])) {
                    const id  = Number(row.ingredient_id);
                    const qty = Number(row[`amount_${sizeKey}`]);
                    if (!id || qty <= 0) continue;
                    if (seen.has(id)) {
                        this.snackBarService.openSnackBar(
                            `Duplicate ingredient in ${this.SIZE_LABELS[sizeKey]} recipe.`,
                            GlobalConstants.error,
                        );
                        return null;
                    }
                    seen.add(id);
                    recipes.push({ ingredient_id: id, quantity: qty });
                }
                return { size: sizeKey, price: this._exchange.usdToKhr(Number(sg.price_usd)), recipes };
            });
            if (sizes.some((s) => s === null)) return null;
            return { ...base, has_sizes: true, sizes };
        }

        // Single-price path — no recipe tracking
        return {
            ...base,
            has_sizes:  false,
            unit_price: this._exchange.usdToKhr(Number(raw.unit_price_usd)),
            recipes:    [],
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
            error: () => { this.modifierGroups = []; this._initModifierAssignments(); },
        });
    }

    private _initModifierAssignments(): void {
        if (this.isEditMode && this.menuId) {
            this._modifierService.getMenuAssignments(this.menuId).subscribe({
                next: (res) => {
                    this.applyModifierAssignments(res?.data ?? []);
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
            modifier_group_id: number; sort_order: number; is_required: boolean;
        }[];
    }

    isModifierSelected(groupId: number): boolean {
        return this.selectedModifierItems.some((x) => x.modifier_group_id === groupId);
    }

    toggleModifierGroup(groupId: number, checked: boolean): void {
        const current = [...this.selectedModifierItems];
        const idx = current.findIndex((x) => x.modifier_group_id === groupId);
        if (checked && idx === -1) current.push({ modifier_group_id: groupId, sort_order: current.length, is_required: false });
        if (!checked && idx >= 0) { current.splice(idx, 1); current.forEach((item, i) => (item.sort_order = i)); }
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

    loadSetup(): void {
        this.menuService.getSetupData().subscribe({
            next: (res: any) => { this.setup = res?.productTypes ?? res?.menuTypes ?? []; },
            error: (err: HttpErrorResponse) => {
                this.snackBarService.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            }
        });
    }

    onFileChange(event: any): void {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.src = e.target.result;
                this.menuForm.get('image')?.setValue(e.target.result);
            };
            reader.readAsDataURL(file);
            return;
        }
        this.snackBarService.openSnackBar('Please select an image file.', GlobalConstants.error);
    }

    submit(): void {
        if (!this.formReady || this.menuForm.invalid || this.saving) return;
        const body = this._buildPayload();
        if (!body) return;

        if (this.isEditMode && this.menuId) {
            this.updateMenu(this.menuId, body);
            return;
        }

        this.createMenu(body);
    }

    private createMenu(body: any): void {
        this.saving = true;
        this.menuService.create(body).subscribe({
            next: (response) => {
                this._modifierService.setMenuAssignments(response.data.id, this.selectedModifierItems).subscribe({
                    next: () => {
                        this.saving = false;
                        this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
                        this.router.navigate(['/admin/menu/all']);
                    },
                    error: (err: HttpErrorResponse) => {
                        this.saving = false;
                        this.snackBarService.openSnackBar(
                            err?.error?.message ?? 'Menu created but failed to save modifier assignments.',
                            GlobalConstants.error,
                        );
                    },
                });
            },
            error: (err: HttpErrorResponse) => {
                this.saving = false;
                const errors: { type: string; message: string }[] | undefined = err.error?.errors;
                let message = err.error?.message ?? GlobalConstants.genericError;
                if (errors?.length) message = errors.map((o) => o.message).join(', ');
                this.snackBarService.openSnackBar(message, GlobalConstants.error);
            }
        });
    }

    private updateMenu(menuId: number, body: any): void {
        this.saving = true;
        this.menuService.update(menuId, body).subscribe({
            next: (response) => {
                this._modifierService.setMenuAssignments(menuId, this.selectedModifierItems).subscribe({
                    next: () => {
                        this.saving = false;
                        this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
                        this.router.navigate(['/admin/menu/all']);
                    },
                    error: (err: HttpErrorResponse) => {
                        this.saving = false;
                        this.snackBarService.openSnackBar(
                            err?.error?.message ?? 'Menu updated but failed to save modifier assignments.',
                            GlobalConstants.error,
                        );
                    },
                });
            },
            error: (err: HttpErrorResponse) => {
                this.saving = false;
                const errors: { type: string; message: string }[] | undefined = err.error?.errors;
                let message = err.error?.message ?? GlobalConstants.genericError;
                if (errors?.length) message = errors.map((o) => o.message).join(', ');
                this.snackBarService.openSnackBar(message, GlobalConstants.error);
            }
        });
    }

    goBack(): void { this.router.navigate(['/admin/menu/all']); }

    ngOnDestroy(): void {
        this._unsub.next();
        this._unsub.complete();
    }
}
