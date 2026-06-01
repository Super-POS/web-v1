import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormArray, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
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
import { nameToMenuCode } from 'helper/utils/name-to-menu-code';
import { PosBreadcrumbComponent } from 'app/shared/list-page';

interface MenuTypeOption {
    id: number;
    name: string;
}

interface MenuCreateStep {
    key: 'basics' | 'pricing' | 'recipes' | 'modifiers';
    label: string;
    hint: string;
}

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
        PosBreadcrumbComponent,
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
    isLoading = false;
    stepError: string | null = null;
    menuForm!: UntypedFormGroup;
    saving = false;
    src = 'icons/image.jpg';
    readonly defaultImageSrc = 'icons/image.jpg';
    hasCustomImage = false;
    setup: MenuTypeOption[] = [];
    filteredSetup: MenuTypeOption[] = [];
    isLoadingSetup = false;
    /** Search input for menu type — `type_id` on the form is the submitted value. */
    menuTypeSearch = new UntypedFormControl('');
    selectedMenuType: MenuTypeOption | null = null;
    ingredients: IngredientItem[] = [];
    modifierGroups: ModifierGroupRow[] = [];
    isLoadingModifiers = false;
    fileUrl: string = env.FILE_BASE_URL;
    menuId: number | null = null;
    isEditMode = false;
    actionLabel = 'Save menu';

    currentStep = 0;
    readonly STEPS: MenuCreateStep[] = [
        { key: 'basics', label: 'Basics', hint: '' },
        { key: 'pricing', label: 'Pricing', hint: '' },
        { key: 'recipes', label: 'Recipe', hint: '' },
        { key: 'modifiers', label: 'Modifiers', hint: '' },
    ];

    readonly SIZE_LABELS: Record<string, string> = { S: 'Small', M: 'Medium', L: 'Large' };
    readonly SIZES = ['S', 'M', 'L'] as const;

    get currentStepKey(): MenuCreateStep['key'] {
        return this.STEPS[this.currentStep]?.key ?? 'basics';
    }

    get isLastStep(): boolean {
        return this.currentStep >= this.STEPS.length - 1;
    }

    /** Whether all wizard steps pass validation (used for Save, not raw menuForm.invalid). */
    get canSaveMenu(): boolean {
        if (!this.menuForm || this.saving) return false;
        return this.STEPS.every((_, i) => this.isStepValid(i));
    }

    get progressPercent(): number {
        return Math.round(((this.currentStep + 1) / this.STEPS.length) * 100);
    }

    get pageTitle(): string {
        return this.isEditMode ? 'Edit menu item' : 'Create menu item';
    }

    get breadcrumbSegments(): string[] {
        return ['Menu', this.isEditMode ? 'Edit' : 'Create'];
    }

    get selectedModifierCount(): number {
        return this.selectedModifierItems.length;
    }

    get menuTypeQuery(): string {
        const v = this.menuTypeSearch.value;
        return typeof v === 'string' ? v.trim() : '';
    }

    get menuTypeInvalid(): boolean {
        const touched = this.menuTypeSearch.touched || !!this.menuForm?.get('type_id')?.touched;
        return touched && !this.selectedMenuType;
    }

    get menuPhotoAlt(): string {
        const name = this.menuForm?.get('name')?.value;
        return name ? `${name} preview` : 'Menu item photo preview';
    }

    ngOnInit(): void {
        this._ingredientService.getData().subscribe({
            next: (res) => (this.ingredients = res.data ?? []),
        });

        this._initMenuTypeSearch();

        this._exchange.fetchAdmin().subscribe({
            next: () => this.initRouteListener(),
            error: () => this.initRouteListener(),
        });
    }

    private _initMenuTypeSearch(): void {
        this.menuTypeSearch.valueChanges
            .pipe(takeUntil(this._unsub))
            .subscribe((value: string | MenuTypeOption) => {
                const q = (typeof value === 'string' ? value : value?.name ?? '').toLowerCase().trim();
                this.filteredSetup = q
                    ? this.setup.filter((t) => t.name.toLowerCase().includes(q))
                    : [...this.setup];

                if (typeof value === 'object' && value?.id) {
                    this.filteredSetup = [...this.setup];
                    return;
                }

                if (!q) {
                    this._clearMenuTypeSelection();
                    return;
                }

                if (this.selectedMenuType && this.selectedMenuType.name.toLowerCase() !== q) {
                    this._clearMenuTypeSelection();
                }
            });
    }

    private _clearMenuTypeSelection(): void {
        this.selectedMenuType = null;
        this.menuForm?.get('type_id')?.setValue(null);
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
        this.currentStep = 0;
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
        this.isLoading = true;
        this.formReady = false;
        this.menuService.getById(menuId).subscribe({
            next: (res) => {
                this.bootstrapForm(res.data);
                this.isLoading = false;
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
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

        const existingRecipes = !hasSizes ? (menu?.recipes ?? []) : [];

        this.menuForm = this.formBuilder.group({
            code:           [menu?.code ?? null, Validators.required],
            name:           [menu?.name ?? null, Validators.required],
            type_id:        [menu?.type?.id ?? menu?.type_id ?? null, Validators.required],
            image:          [null, menu ? [] : Validators.required],
            unit_price_usd: [unitPriceUsd, hasSizes ? [] : [Validators.required, Validators.min(0.01)]],
            recipes:        this.formBuilder.array(existingRecipes.map((r) => this._recipeGroup(r))),
            sizes:          this.formBuilder.array(this.SIZES.map((s) => this._sizeGroup(s, menu))),
            modifier_items: [[]],
        });

        if (menu?.image) {
            this.src = resolveFileUrl(this.fileUrl, menu.image);
            this.hasCustomImage = true;
        } else {
            this.src = this.defaultImageSrc;
            this.hasCustomImage = false;
        }

        if (menu?.type?.id) {
            this.selectedMenuType = { id: menu.type.id, name: menu.type.name };
            this.menuTypeSearch.setValue(this.selectedMenuType, { emitEvent: false });
        } else {
            this.selectedMenuType = null;
            this.menuTypeSearch.setValue('', { emitEvent: false });
        }
        this.filteredSetup = [...this.setup];

        if (this.isEditMode) {
            this.menuForm.get('code')!.disable({ emitEvent: false });
        }

        // Keep pricing + size-recipe validators in sync when sizes are toggled
        this.sizeRows.controls.forEach((ctrl) =>
            ctrl.get('enabled')!.valueChanges
                .pipe(takeUntil(this._unsub))
                .subscribe(() => {
                    this._syncPriceValidator();
                    this._syncSingleRecipeValidators();
                    this._syncSizeRecipeValidators();
                    this._ensureMinRecipeRows();
                    this._syncSingleRecipeValidators();
                    this._syncSizeRecipeValidators();
                })
        );

        this._syncPriceValidator();
        this._ensureMinRecipeRows();
        this._syncSingleRecipeValidators();
        this._syncSizeRecipeValidators();
        this._setupCodeAutoGenerate();
        this.loadSetup();
        this._loadModifierData();
        this.formReady = true;
    }

    private _setupCodeAutoGenerate(): void {
        const nameCtrl = this.menuForm.get('name')!;
        const codeCtrl = this.menuForm.get('code')!;

        if (!this.isEditMode) {
            const initial = nameToMenuCode(nameCtrl.value);
            if (initial) codeCtrl.setValue(initial, { emitEvent: false });
        }

        nameCtrl.valueChanges.pipe(takeUntil(this._unsub)).subscribe((name) => {
            if (this.isEditMode) return;
            const code = nameToMenuCode(name);
            codeCtrl.setValue(code || null, { emitEvent: false });
        });
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
        this._syncPriceValidator();
        this._syncSingleRecipeValidators();
        this._syncSizeRecipeValidators();
        this._ensureMinRecipeRows();
        this._syncSingleRecipeValidators();
        this._syncSizeRecipeValidators();
    }

    setPricingMode(mode: 'single' | 'sizes'): void {
        if (mode === 'single') {
            for (let i = 0; i < this.SIZES.length; i++) {
                if (this.isSizeEnabled(i)) this.onSizeToggle(i, false);
            }
            this._syncSingleRecipeValidators();
            this._syncSizeRecipeValidators();
            return;
        }
        if (!this.hasSizes) {
            this.onSizeToggle(1, true);
        }
        this._ensureMinRecipeRows();
        this._syncSingleRecipeValidators();
        this._syncSizeRecipeValidators();
    }

    private _ensureMinRecipeRows(): void {
        if (this.hasSizes) {
            for (const si of this.enabledSizeIndices) {
                if (this.sizeRecipeRows(si).length === 0) {
                    this.addSizeRecipeRow(si);
                }
            }
            return;
        }
        if (this.recipeRows.length === 0) this.addRecipeRow();
    }

    /** Apply recipe validators only for the active pricing mode (single vs sizes). */
    private _syncSingleRecipeValidators(): void {
        if (!this.menuForm) return;

        const apply = !this.hasSizes;
        for (const row of this.recipeRows.controls) {
            const ingCtrl = row.get('ingredient_id')!;
            const qtyCtrl = row.get('quantity')!;
            if (apply) {
                ingCtrl.setValidators([Validators.required]);
                qtyCtrl.setValidators([Validators.required, Validators.min(0.0001)]);
            } else {
                ingCtrl.clearValidators();
                qtyCtrl.clearValidators();
            }
            ingCtrl.updateValueAndValidity({ emitEvent: false });
            qtyCtrl.updateValueAndValidity({ emitEvent: false });
        }
    }

    private _syncSizeRecipeValidators(): void {
        if (!this.menuForm) return;

        for (let si = 0; si < this.SIZES.length; si++) {
            const enabled = this.hasSizes && this.isSizeEnabled(si);
            for (const row of this.sizeRecipeRows(si).controls) {
                const ingCtrl = row.get('ingredient_id')!;
                const qtyCtrl = row.get('quantity')!;
                if (enabled) {
                    ingCtrl.setValidators([Validators.required]);
                    qtyCtrl.setValidators([Validators.required, Validators.min(0.0001)]);
                } else {
                    ingCtrl.clearValidators();
                    qtyCtrl.clearValidators();
                }
                ingCtrl.updateValueAndValidity({ emitEvent: false });
                qtyCtrl.updateValueAndValidity({ emitEvent: false });
            }
        }
    }

    // ── Form array getters ────────────────────────────────────────────────────

    get recipeRows(): FormArray {
        return this.menuForm.get('recipes') as FormArray;
    }

    addRecipeRow(): void {
        this.recipeRows.push(this._recipeGroup());
        this._syncSingleRecipeValidators();
    }

    removeRecipeRow(index: number): void {
        if (!this.hasSizes && this.recipeRows.length <= 1) {
            this.snackBarService.openSnackBar(
                'At least one recipe row is required.',
                GlobalConstants.error,
            );
            return;
        }
        this.recipeRows.removeAt(index);
        this._syncSingleRecipeValidators();
    }

    get sizeRows(): FormArray {
        return this.menuForm.get('sizes') as FormArray;
    }

    sizeRecipeRows(sizeIndex: number): FormArray {
        return (this.sizeRows.at(sizeIndex) as UntypedFormGroup).get('recipes') as FormArray;
    }

    // ── Row add/remove ────────────────────────────────────────────────────────

    addSizeRecipeRow(sizeIndex: number): void {
        this.sizeRecipeRows(sizeIndex).push(this._recipeGroup());
        this._syncSizeRecipeValidators();
    }

    removeSizeRecipeRow(sizeIndex: number, rowIndex: number): void {
        const rows = this.sizeRecipeRows(sizeIndex);
        if (this.hasSizes && rows.length <= 1) {
            this.snackBarService.openSnackBar(
                `At least one ingredient is required for ${this.SIZE_LABELS[this.SIZES[sizeIndex]]}.`,
                GlobalConstants.error,
            );
            return;
        }
        rows.removeAt(rowIndex);
        this._syncSizeRecipeValidators();
    }

    // ── Form builders ─────────────────────────────────────────────────────────

    private _recipeGroup(r?: { ingredient_id: number; quantity: number }): UntypedFormGroup {
        return this.formBuilder.group({
            ingredient_id: [r?.ingredient_id ?? null, Validators.required],
            quantity: [r?.quantity ?? null, [Validators.required, Validators.min(0.0001)]],
        });
    }

    private _sizeGroup(sizeKey: 'S' | 'M' | 'L', menu?: Data): UntypedFormGroup {
        const existing = menu?.sizes?.find((s) => s.size === sizeKey);
        const enabled = !!existing;
        const priceUsd = existing?.price != null
            ? this._exchange.khrToUsd(existing.price)
            : null;
        const validators = enabled ? [Validators.required, Validators.min(0.01)] : [];
        const recipes = this.formBuilder.array(
            (existing?.recipes ?? []).map((r) => this._recipeGroup(r)),
        );
        return this.formBuilder.group({
            size:      [sizeKey],
            enabled:   [enabled],
            price_usd: [priceUsd, validators],
            recipes,
        });
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
                for (const row of (sg.recipes ?? [])) {
                    if (row?.ingredient_id == null || Number(row.quantity) <= 0) continue;
                    const id = Number(row.ingredient_id);
                    if (seen.has(id)) {
                        this.snackBarService.openSnackBar(
                            `Duplicate ingredient in ${this.SIZE_LABELS[sizeKey]} recipe; keep one row per ingredient.`,
                            GlobalConstants.error,
                        );
                        return null;
                    }
                    seen.add(id);
                    recipes.push({ ingredient_id: id, quantity: Number(row.quantity) });
                }
                if (recipes.length === 0) {
                    this.snackBarService.openSnackBar(
                        `${this.SIZE_LABELS[sizeKey]} recipe is required. Add at least one ingredient for this size.`,
                        GlobalConstants.error,
                    );
                    return null;
                }
                return { size: sizeKey, price: this._exchange.usdToKhr(Number(sg.price_usd)), recipes };
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
                this.snackBarService.openSnackBar(
                    'Duplicate ingredient in recipe; keep one row per ingredient.',
                    GlobalConstants.error,
                );
                return null;
            }
            seen.add(id);
            recipes.push({ ingredient_id: id, quantity: Number(row.quantity) });
        }

        if (recipes.length === 0) {
            this.snackBarService.openSnackBar(
                'Recipe is required. Add at least one ingredient with an amount per cup.',
                GlobalConstants.error,
            );
            return null;
        }

        return {
            ...base,
            has_sizes:  false,
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
        this.isLoadingSetup = true;
        this.menuService.getSetupData().subscribe({
            next: (res: any) => {
                this.setup = res?.productTypes ?? res?.menuTypes ?? [];
                this.filteredSetup = [...this.setup];
                this.isLoadingSetup = false;
                this._syncMenuTypeSearchFromForm();
            },
            error: (err: HttpErrorResponse) => {
                this.isLoadingSetup = false;
                this.setup = [];
                this.filteredSetup = [];
                this.snackBarService.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            }
        });
    }

    onMenuTypeSelected(event: MatAutocompleteSelectedEvent): void {
        const item = event.option.value as MenuTypeOption;
        this.selectedMenuType = item;
        this.menuForm.get('type_id')?.setValue(item.id);
        this.menuTypeSearch.setValue(item, { emitEvent: false });
    }

    onMenuTypeBlur(): void {
        const value = this.menuTypeSearch.value;
        if (typeof value === 'object' && value?.id) return;

        const q = typeof value === 'string' ? value.trim() : '';
        if (!q) {
            this.menuTypeSearch.markAsTouched();
            this.menuForm.get('type_id')?.markAsTouched();
            return;
        }

        const exact = this.setup.find((t) => t.name.toLowerCase() === q.toLowerCase());
        if (exact) {
            this.selectedMenuType = exact;
            this.menuForm.get('type_id')?.setValue(exact.id);
            this.menuTypeSearch.setValue(exact, { emitEvent: false });
        } else if (!this.selectedMenuType) {
            this.menuForm.get('type_id')?.setValue(null);
        }

        this.menuTypeSearch.markAsTouched();
        this.menuForm.get('type_id')?.markAsTouched();
    }

    displayMenuTypeName(item: MenuTypeOption | string | null): string {
        if (item == null) return '';
        if (typeof item === 'string') return item;
        return item.name ?? '';
    }

    clearMenuTypeSearch(): void {
        this.menuTypeSearch.setValue('');
        this.selectedMenuType = null;
        this.filteredSetup = [...this.setup];
        this.menuForm.get('type_id')?.setValue(null);
        this.menuTypeSearch.markAsTouched();
        this.menuForm.get('type_id')?.markAsTouched();
    }

    private _syncMenuTypeSearchFromForm(): void {
        if (!this.menuForm) return;
        const id = this.menuForm.get('type_id')?.value;
        if (id == null) {
            if (!this.selectedMenuType) {
                this.menuTypeSearch.setValue('', { emitEvent: false });
            }
            return;
        }
        const item = this.setup.find((t) => t.id === id);
        if (item) {
            this.selectedMenuType = item;
            this.menuTypeSearch.setValue(item, { emitEvent: false });
        }
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                const result = (e.target as FileReader)?.result as string;
                this.src = result;
                this.hasCustomImage = true;
                this.menuForm.get('image')?.setValue(result);
                this.menuForm.get('image')?.markAsTouched();
            };
            reader.readAsDataURL(file);
            return;
        }
        if (file) {
            this.snackBarService.openSnackBar('Please select an image file.', GlobalConstants.error);
        }
        input.value = '';
    }

    removeImage(): void {
        this.src = this.defaultImageSrc;
        this.hasCustomImage = false;
        const imageCtrl = this.menuForm.get('image')!;
        imageCtrl.setValue(null);
        if (!this.isEditMode) {
            imageCtrl.setValidators(Validators.required);
        } else {
            imageCtrl.clearValidators();
        }
        imageCtrl.markAsTouched();
        imageCtrl.updateValueAndValidity();
    }

    submit(): void {
        if (!this.formReady || this.saving) return;
        this.stepError = null;
        for (let i = 0; i < this.STEPS.length; i++) {
            if (!this.validateStep(i)) {
                this.currentStep = i;
                this._scrollToStepContent();
                return;
            }
        }
        if (!this.canSaveMenu) return;
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

    goToStep(index: number): void {
        if (index < 0 || index >= this.STEPS.length || index === this.currentStep) return;
        this.stepError = null;
        if (index < this.currentStep) {
            this.currentStep = index;
            this._scrollToStepContent();
            return;
        }
        for (let i = this.currentStep; i < index; i++) {
            if (!this.validateStep(i)) return;
            this.currentStep = i + 1;
        }
        this._scrollToStepContent();
    }

    previousStep(): void {
        if (this.currentStep > 0) {
            this.stepError = null;
            this.currentStep--;
            this._scrollToStepContent();
        }
    }

    nextStep(): void {
        this.stepError = null;
        if (!this.validateStep(this.currentStep)) return;
        if (!this.isLastStep) {
            this.currentStep++;
            if (this.currentStepKey === 'recipes') {
                this._ensureMinRecipeRows();
                this._syncSingleRecipeValidators();
                this._syncSizeRecipeValidators();
            }
            this._scrollToStepContent();
        }
    }

    validateStep(stepIndex: number): boolean {
        if (!this.menuForm) return false;

        const valid = this.isStepValid(stepIndex);
        if (valid) return true;

        const key = this.STEPS[stepIndex]?.key;
        if (key === 'basics') {
            const fields = ['code', 'name', 'type_id'];
            if (!this.isEditMode) fields.push('image');
            this._markAndCheck(fields);
            this.stepError = this._missingFieldMessage(fields);
            return false;
        }

        if (key === 'pricing') {
            if (!this.hasSizes) {
                this._markAndCheck(['unit_price_usd']);
                this.stepError = 'Enter a valid USD price for this item.';
                return false;
            }
            if (this.enabledSizeIndices.length === 0) {
                this.stepError = 'Choose at least one size (S, M, or L), or switch to single price.';
                return false;
            }
            for (const si of this.enabledSizeIndices) {
                const priceCtrl = this.sizeRows.at(si).get('price_usd')!;
                priceCtrl.markAsTouched();
                priceCtrl.updateValueAndValidity();
            }
            this.stepError = 'Enter a price for each enabled size (S, M, or L).';
            return false;
        }

        if (key === 'recipes') {
            if (!this.hasSizes) {
                this._validateSingleRecipeRows(true);
                this.stepError =
                    'Add at least one recipe row with an ingredient and amount per cup.';
            } else {
                this._validateSizeRecipeRows(true);
                this.stepError =
                    'Add at least one ingredient with an amount for each enabled size (S, M, or L).';
            }
            return false;
        }

        return false;
    }

    isStepValid(stepIndex: number): boolean {
        if (!this.menuForm) return false;

        const key = this.STEPS[stepIndex]?.key;
        if (!key) return true;

        if (key === 'basics') {
            const raw = this.menuForm.getRawValue();
            if (!String(raw.name ?? '').trim()) return false;
            if (!String(raw.code ?? '').trim()) return false;
            if (!this.selectedMenuType || raw.type_id == null) return false;
            if (!this.isEditMode && !raw.image) return false;
            return true;
        }

        if (key === 'pricing') {
            if (!this.hasSizes) {
                const price = Number(this.menuForm.get('unit_price_usd')?.value);
                return Number.isFinite(price) && price >= 0.01;
            }
            if (this.enabledSizeIndices.length === 0) return false;
            return this.enabledSizeIndices.every((si) => {
                const price = Number(this.sizeRows.at(si).get('price_usd')?.value);
                return Number.isFinite(price) && price >= 0.01;
            });
        }

        if (key === 'recipes') {
            return this.hasSizes
                ? this._validateSizeRecipeRows(false)
                : this._validateSingleRecipeRows(false);
        }

        return true;
    }

    private _validateSizeRecipeRows(markTouched: boolean): boolean {
        if (this.enabledSizeIndices.length === 0) {
            return false;
        }

        this._syncSizeRecipeValidators();

        let valid = true;

        for (const si of this.enabledSizeIndices) {
            const recipes = this.sizeRecipeRows(si);
            if (recipes.length === 0) {
                valid = false;
                continue;
            }

            let sizeHasValidLine = false;
            for (const row of recipes.controls) {
                const ingCtrl = row.get('ingredient_id')!;
                const qtyCtrl = row.get('quantity')!;
                if (markTouched) {
                    ingCtrl.markAsTouched();
                    qtyCtrl.markAsTouched();
                    ingCtrl.updateValueAndValidity();
                    qtyCtrl.updateValueAndValidity();
                }
                const id = Number(ingCtrl.value);
                const qty = Number(qtyCtrl.value);
                if (id > 0 && Number.isFinite(qty) && qty >= 0.0001) {
                    sizeHasValidLine = true;
                } else if (ingCtrl.invalid || qtyCtrl.invalid) {
                    valid = false;
                }
            }
            if (!sizeHasValidLine) {
                valid = false;
            }
        }

        return valid;
    }

    private _validateSingleRecipeRows(markTouched: boolean): boolean {
        if (this.recipeRows.length === 0) {
            return false;
        }

        let valid = true;
        for (const row of this.recipeRows.controls) {
            const ingCtrl = row.get('ingredient_id')!;
            const qtyCtrl = row.get('quantity')!;
            if (markTouched) {
                ingCtrl.markAsTouched();
                qtyCtrl.markAsTouched();
                ingCtrl.updateValueAndValidity();
                qtyCtrl.updateValueAndValidity();
            }
            const id = Number(ingCtrl.value);
            const qty = Number(qtyCtrl.value);
            if (!id || !Number.isFinite(qty) || qty < 0.0001) valid = false;
        }
        return valid;
    }

    private _missingFieldMessage(fields: string[]): string {
        const labels: Record<string, string> = {
            code: 'code',
            name: 'name',
            type_id: 'menu type',
            image: 'menu photo',
            unit_price_usd: 'price',
        };
        const missing = fields
            .filter((f) => this.menuForm.get(f)?.invalid)
            .map((f) => labels[f] ?? f);
        if (!missing.length) return 'Please fix the highlighted fields before continuing.';
        return `Please complete: ${missing.join(', ')}.`;
    }

    private _markAndCheck(controlNames: string[]): boolean {
        let valid = true;
        for (const name of controlNames) {
            const ctrl = this.menuForm.get(name)!;
            ctrl.markAsTouched();
            ctrl.updateValueAndValidity();
            if (ctrl.invalid) valid = false;
        }
        if (controlNames.includes('type_id') && !this.selectedMenuType) {
            this.menuTypeSearch.markAsTouched();
            valid = false;
        }
        return valid;
    }

    private _scrollToStepContent(): void {
        queueMicrotask(() => {
            document.querySelector('.menu-create__panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    ngOnDestroy(): void {
        this._unsub.next();
        this._unsub.complete();
    }
}
