import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { AdminCouponRow, CouponCategoryOption, CouponMenuOption, CouponUserOption } from '../interface';
import { AdminCouponService } from '../service';

@Component({
    selector: 'app-admin-coupon-update-dialog',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatChipsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
    ],
})
export class AdminCouponUpdateDialogComponent implements OnInit, OnDestroy {
    resData = new EventEmitter<AdminCouponRow>();
    form: UntypedFormGroup;
    isSaving = false;

    // User picker
    userSearch = new UntypedFormControl('');
    userSuggestions: CouponUserOption[] = [];
    isSearchingUsers = false;
    selectedUsers: CouponUserOption[] = [];

    // Menu picker
    menuSearch = new UntypedFormControl('');
    menuSuggestions: CouponMenuOption[] = [];
    isSearchingMenus = false;
    selectedMenus: CouponMenuOption[] = [];

    // Category picker
    allCategories: CouponCategoryOption[] = [];
    selectedCategories: CouponCategoryOption[] = [];
    isLoadingCategories = false;

    private _destroy$ = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: AdminCouponRow,
        private _dialogRef: MatDialogRef<AdminCouponUpdateDialogComponent>,
        private _formBuilder: FormBuilder,
        private _snackBar: SnackbarService,
        private _service: AdminCouponService,
    ) {}

    private _toDatetimeLocal(iso: string | null | undefined): string {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    ngOnInit(): void {
        // Pre-populate selections from existing coupon data
        this.selectedUsers = (this.data.assigned_users ?? []).map((u) => ({ id: u.id, name: u.name, phone: '' }));
        this.selectedMenus = (this.data.menu_restrictions ?? []).map((m) => ({ id: m.id, name: m.name, code: '', type: { id: 0, name: '' } }));

        this.form = this._formBuilder.group({
            code: [this.data.code, [Validators.required, Validators.minLength(2), Validators.maxLength(64)]],
            discount_percent: [Number(this.data.discount_percent), [Validators.required]],
            note: [this.data.note ?? ''],
            usage_limit: [this.data.usage_limit ?? null],
            expires_at: [this._toDatetimeLocal(this.data.expires_at)],
        });

        // User search
        this.userSearch.valueChanges.pipe(
            debounceTime(300), distinctUntilChanged(), takeUntil(this._destroy$),
        ).subscribe((q: string) => this._searchUsers(q));

        // Menu search
        this.menuSearch.valueChanges.pipe(
            debounceTime(300), distinctUntilChanged(), takeUntil(this._destroy$),
        ).subscribe((q: string) => this._searchMenus(q));

        // Load categories, then restore pre-selected ones
        this._loadCategories();
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
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
            next: (res) => {
                this.allCategories = res.data ?? [];
                // Restore pre-selected categories using IDs from data
                const existingIds = new Set((this.data.category_restrictions ?? []).map((c) => c.id));
                this.selectedCategories = this.allCategories.filter((c) => existingIds.has(c.id));
                this.isLoadingCategories = false;
            },
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

    submit(): void {
        const code = String(this.form.get('code')?.value ?? '').trim();
        const pct = Number(this.form.get('discount_percent')?.value);
        if (!code || code.length < 2) {
            this._snackBar.openSnackBar('Enter a coupon code (at least 2 characters).', GlobalConstants.error);
            return;
        }
        if (!Number.isFinite(pct) || pct < 0.01 || pct > 100) {
            this._snackBar.openSnackBar('Discount percent must be between 0.01 and 100.', GlobalConstants.error);
            return;
        }
        this._dialogRef.disableClose = true;
        this.isSaving = true;
        const noteRaw = String(this.form.get('note')?.value ?? '').trim();
        const note = noteRaw || null;
        const usageLimitRaw = this.form.get('usage_limit')?.value;
        const usage_limit = usageLimitRaw != null && usageLimitRaw !== '' ? Number(usageLimitRaw) : null;
        const expiresRaw = String(this.form.get('expires_at')?.value ?? '').trim();
        const expires_at = expiresRaw ? new Date(expiresRaw).toISOString() : null;
        const assigned_user_ids = this.selectedUsers.map((u) => u.id);
        const menu_ids = this.selectedMenus.map((m) => m.id);
        const category_ids = this.selectedCategories.map((c) => c.id);
        this._service.update(this.data.id, { code, discount_percent: pct, note, usage_limit, expires_at, assigned_user_ids, menu_ids, category_ids }).subscribe({
            next: (res) => {
                this.isSaving = false;
                this._dialogRef.disableClose = false;
                this.resData.emit(res.data);
                this._snackBar.openSnackBar(res.message || 'Updated.', GlobalConstants.success);
                this._dialogRef.close();
            },
            error: (err: HttpErrorResponse) => {
                this._dialogRef.disableClose = false;
                this.isSaving = false;
                this._snackBar.openSnackBar(err?.error?.message || GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    closeDialog(): void { this._dialogRef.close(); }
}
