import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { PosBreadcrumbComponent } from 'app/shared/list-page';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { CouponCategoryOption, CouponMenuOption, CouponUserOption } from '../interface';
import { AdminCouponService } from '../service';

@Component({
    selector: 'app-admin-coupon-form-page',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatCheckboxModule,
        MatChipsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        PosBreadcrumbComponent,
    ],
})
export class AdminCouponFormPageComponent implements OnInit, OnDestroy {
    private readonly _router = inject(Router);
    private readonly _formBuilder = inject(FormBuilder);
    private readonly _snackBar = inject(SnackbarService);
    private readonly _service = inject(AdminCouponService);
    private readonly _destroy$ = new Subject<void>();

    form!: UntypedFormGroup;
    formReady = false;
    isSaving = false;

    userSearch = new UntypedFormControl('');
    userSuggestions: CouponUserOption[] = [];
    isSearchingUsers = false;
    selectedUsers: CouponUserOption[] = [];

    menuSearch = new UntypedFormControl('');
    menuSuggestions: CouponMenuOption[] = [];
    isSearchingMenus = false;
    selectedMenus: CouponMenuOption[] = [];

    allCategories: CouponCategoryOption[] = [];
    selectedCategories: CouponCategoryOption[] = [];
    isLoadingCategories = false;

    readonly breadcrumbSegments = ['Admin', 'Coupons', 'Create'];
    readonly pageTitle = 'Create coupon';

    ngOnInit(): void {
        this.bootstrapForm();
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    private bootstrapForm(): void {
        this.form = this._formBuilder.group({
            generate_code: [false],
            code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(64)]],
            discount_percent: [null, [Validators.required]],
            note: [''],
            usage_limit: [null],
            expires_at: [''],
        });

        this.form.get('generate_code')?.valueChanges
            .pipe(takeUntil(this._destroy$))
            .subscribe((gen: boolean) => {
                const codeCtrl = this.form.get('code')!;
                if (gen) {
                    codeCtrl.clearValidators();
                    codeCtrl.setValue('');
                    codeCtrl.disable({ emitEvent: false });
                } else {
                    codeCtrl.enable({ emitEvent: false });
                    codeCtrl.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(64)]);
                }
                codeCtrl.updateValueAndValidity({ emitEvent: false });
            });

        this.userSearch.valueChanges.pipe(
            debounceTime(300), distinctUntilChanged(), takeUntil(this._destroy$),
        ).subscribe((q: string) => this._searchUsers(q));

        this.menuSearch.valueChanges.pipe(
            debounceTime(300), distinctUntilChanged(), takeUntil(this._destroy$),
        ).subscribe((q: string) => this._searchMenus(q));

        this._loadCategories();
        this.formReady = true;
    }

    private _searchUsers(q: string): void {
        const query = (typeof q === 'string' ? q : '').trim();
        if (!query) { this.userSuggestions = []; return; }
        this.isSearchingUsers = true;
        this._service.searchUsers(query).subscribe({
            next: (res) => {
                const ids = new Set(this.selectedUsers.map((u) => u.id));
                this.userSuggestions = (res.data ?? []).filter((u) => !ids.has(u.id));
                this.isSearchingUsers = false;
            },
            error: () => { this.userSuggestions = []; this.isSearchingUsers = false; },
        });
    }

    private _searchMenus(q: string): void {
        const query = (typeof q === 'string' ? q : '').trim();
        if (!query) { this.menuSuggestions = []; return; }
        this.isSearchingMenus = true;
        this._service.searchMenus(query).subscribe({
            next: (res) => {
                const ids = new Set(this.selectedMenus.map((m) => m.id));
                this.menuSuggestions = (res.data ?? []).filter((m) => !ids.has(m.id));
                this.isSearchingMenus = false;
            },
            error: () => { this.menuSuggestions = []; this.isSearchingMenus = false; },
        });
    }

    private _loadCategories(): void {
        this.isLoadingCategories = true;
        this._service.fetchCategories().subscribe({
            next: (res) => { this.allCategories = res.data ?? []; this.isLoadingCategories = false; },
            error: () => { this.allCategories = []; this.isLoadingCategories = false; },
        });
    }

    onUserSelected(event: MatAutocompleteSelectedEvent): void {
        const user = event.option.value as CouponUserOption;
        if (!this.selectedUsers.find((u) => u.id === user.id)) {
            this.selectedUsers = [...this.selectedUsers, user];
        }
        this.userSearch.setValue('', { emitEvent: false });
        this.userSuggestions = [];
    }

    onMenuSelected(event: MatAutocompleteSelectedEvent): void {
        const menu = event.option.value as CouponMenuOption;
        if (!this.selectedMenus.find((m) => m.id === menu.id)) {
            this.selectedMenus = [...this.selectedMenus, menu];
        }
        this.menuSearch.setValue('', { emitEvent: false });
        this.menuSuggestions = [];
    }

    toggleCategory(cat: CouponCategoryOption): void {
        const exists = this.selectedCategories.find((c) => c.id === cat.id);
        this.selectedCategories = exists
            ? this.selectedCategories.filter((c) => c.id !== cat.id)
            : [...this.selectedCategories, cat];
    }

    isCategorySelected(cat: CouponCategoryOption): boolean {
        return this.selectedCategories.some((c) => c.id === cat.id);
    }

    removeUser(id: number): void { this.selectedUsers = this.selectedUsers.filter((u) => u.id !== id); }
    removeMenu(id: number): void { this.selectedMenus = this.selectedMenus.filter((m) => m.id !== id); }
    displayEmpty(): string { return ''; }

    goBack(): void {
        this._router.navigate(['/admin/coupons']);
    }

    submit(): void {
        const generateCode = !!this.form.get('generate_code')?.value;
        const code = String(this.form.get('code')?.value ?? '').trim();
        const pct = Number(this.form.get('discount_percent')?.value);
        if (!generateCode && (!code || code.length < 2)) {
            this._snackBar.openSnackBar('Enter a coupon code (at least 2 characters).', GlobalConstants.error);
            return;
        }
        if (!Number.isFinite(pct) || pct < 0.01 || pct > 100) {
            this._snackBar.openSnackBar('Discount percent must be between 0.01 and 100.', GlobalConstants.error);
            return;
        }

        this.isSaving = true;
        const noteRaw = String(this.form.get('note')?.value ?? '').trim();
        const note = noteRaw || undefined;
        const usageLimitRaw = this.form.get('usage_limit')?.value;
        const usage_limit = usageLimitRaw != null && usageLimitRaw !== '' ? Number(usageLimitRaw) : null;
        const expiresRaw = String(this.form.get('expires_at')?.value ?? '').trim();
        const expires_at = expiresRaw ? new Date(expiresRaw).toISOString() : null;
        const assigned_user_ids = this.selectedUsers.map((u) => u.id);
        const menu_ids = this.selectedMenus.map((m) => m.id);
        const category_ids = this.selectedCategories.map((c) => c.id);
        const payload = generateCode
            ? { auto_generate_code: true as const, discount_percent: pct, is_active: true as const, note, usage_limit, expires_at, assigned_user_ids, menu_ids, category_ids }
            : { code, discount_percent: pct, is_active: true as const, note, usage_limit, expires_at, assigned_user_ids, menu_ids, category_ids };

        this._service.create(payload).subscribe({
            next: (res) => {
                this.isSaving = false;
                this._snackBar.openSnackBar(res.message || 'Saved.', GlobalConstants.success);
                this._router.navigate(['/admin/coupons']);
            },
            error: (err: HttpErrorResponse) => {
                this.isSaving = false;
                this._snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }
}
