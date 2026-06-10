import { NgClass, NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { PosBreadcrumbComponent, PosListPageComponent } from 'app/shared/list-page';
import { RankTier } from '../interface';
import { AdminRankTierService } from '../service';
import { RankTierReward, CreateRewardPayload, UpdateRewardPayload } from './interface';
import { AdminRankTierRewardService } from './service';

@Component({
    selector: 'admin-rank-tier-rewards',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        PosListPageComponent,
        PosBreadcrumbComponent,
        NgIf,
        NgFor,
        NgClass,
        FormsModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatCheckboxModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatTableModule,
        MatTooltipModule,
    ],
})
export class AdminRankTierRewardsComponent implements OnInit {
    private _tierService   = inject(AdminRankTierService);
    private _rewardService = inject(AdminRankTierRewardService);
    private _snackBar      = inject(SnackbarService);
    private _cdr           = inject(ChangeDetectorRef);

    readonly displayedColumns = ['type', 'label', 'detail', 'status', 'action'];

    tiers          : RankTier[]       = [];
    selectedTierId : number | null    = null;
    rewards        : RankTierReward[] = [];

    isLoadingTiers   = false;
    isLoadingRewards = false;

    showAddForm  = false;
    addType      : 'coupon' | 'item' = 'coupon';
    addLabel     = '';
    addDesc      = '';
    addPercent   : number | null     = 10;
    addExpires   : number | null     = null;
    addMenuId    : number | null     = null;
    addQty       = 1;
    addActive    = true;
    isAdding     = false;

    editingId   : number | null = null;
    editLabel   = '';
    editDesc    = '';
    editPercent : number | null = null;
    editExpires : number | null = null;
    editMenuId  : number | null = null;
    editQty     = 1;
    editActive  = true;
    isSaving    = false;

    deletingId  : number | null = null;

    ngOnInit(): void {
        this.loadTiers();
    }

    loadTiers(): void {
        this.isLoadingTiers = true;
        this._cdr.markForCheck();
        this._tierService.listAll().subscribe({
            next: (res) => {
                this.tiers          = res.data ?? [];
                this.isLoadingTiers = false;
                this._cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isLoadingTiers = false;
                this._snackBar.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                this._cdr.markForCheck();
            },
        });
    }

    onTierChange(tierId: number): void {
        this.selectedTierId = tierId;
        this.cancelAdd();
        this.cancelEdit();
        this.loadRewards();
    }

    loadRewards(): void {
        if (!this.selectedTierId) return;
        this.isLoadingRewards = true;
        this._cdr.markForCheck();
        this._rewardService.list(this.selectedTierId).subscribe({
            next: (res) => {
                this.rewards          = res.data ?? [];
                this.isLoadingRewards = false;
                this._cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isLoadingRewards = false;
                this._snackBar.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                this._cdr.markForCheck();
            },
        });
    }

    openAddForm(): void {
        this.cancelEdit();
        this.addType    = 'coupon';
        this.addLabel   = '';
        this.addDesc    = '';
        this.addPercent = 10;
        this.addExpires = null;
        this.addMenuId  = null;
        this.addQty     = 1;
        this.addActive  = true;
        this.showAddForm = true;
        this._cdr.markForCheck();
    }

    cancelAdd(): void {
        this.showAddForm = false;
        this._cdr.markForCheck();
    }

    submitAdd(): void {
        if (!this.selectedTierId) return;
        const payload: CreateRewardPayload = {
            type     : this.addType,
            label    : this.addLabel.trim(),
            is_active: this.addActive,
        };
        if (this.addDesc.trim()) payload.description = this.addDesc.trim();
        if (this.addType === 'coupon') {
            payload.coupon_discount_percent = this.addPercent ?? 0;
            if (this.addExpires) payload.coupon_expires_days = this.addExpires;
        } else {
            if (this.addMenuId) payload.menu_id = this.addMenuId;
            payload.quantity = this.addQty;
        }

        this.isAdding = true;
        this._rewardService.create(this.selectedTierId, payload).subscribe({
            next: (res) => {
                this.rewards     = [...this.rewards, res.data];
                this.showAddForm = false;
                this.isAdding    = false;
                this._snackBar.openSnackBar(res.message ?? 'Reward added.', GlobalConstants.success);
                this._cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isAdding = false;
                this._snackBar.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                this._cdr.markForCheck();
            },
        });
    }

    startEdit(reward: RankTierReward): void {
        this.cancelAdd();
        this.editingId  = reward.id;
        this.editLabel  = reward.label;
        this.editDesc   = reward.description ?? '';
        this.editPercent = reward.coupon_discount_percent;
        this.editExpires = reward.coupon_expires_days;
        this.editMenuId  = reward.menu_id;
        this.editQty     = reward.quantity ?? 1;
        this.editActive  = reward.is_active;
        this._cdr.markForCheck();
    }

    cancelEdit(): void {
        this.editingId = null;
        this._cdr.markForCheck();
    }

    saveEdit(reward: RankTierReward): void {
        if (!this.selectedTierId) return;
        const payload: UpdateRewardPayload = {};
        if (this.editLabel.trim() !== reward.label)              payload.label       = this.editLabel.trim();
        if ((this.editDesc.trim() || null) !== reward.description) payload.description = this.editDesc.trim() || undefined;
        if (this.editActive !== reward.is_active)                 payload.is_active   = this.editActive;
        if (reward.type === 'coupon') {
            if (this.editPercent !== reward.coupon_discount_percent) payload.coupon_discount_percent = this.editPercent ?? 0;
            if (this.editExpires !== reward.coupon_expires_days)     payload.coupon_expires_days     = this.editExpires ?? undefined;
        } else {
            if (this.editMenuId !== reward.menu_id)             payload.menu_id  = this.editMenuId ?? undefined;
            if (this.editQty !== (reward.quantity ?? 1))        payload.quantity = this.editQty;
        }

        if (!Object.keys(payload).length) {
            this.cancelEdit();
            return;
        }

        this.isSaving = true;
        this._rewardService.update(this.selectedTierId, reward.id, payload).subscribe({
            next: (res) => {
                const idx = this.rewards.findIndex(r => r.id === reward.id);
                if (idx >= 0) this.rewards[idx] = res.data;
                this.rewards   = [...this.rewards];
                this.editingId = null;
                this.isSaving  = false;
                this._snackBar.openSnackBar(res.message ?? 'Reward updated.', GlobalConstants.success);
                this._cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isSaving = false;
                this._snackBar.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                this._cdr.markForCheck();
            },
        });
    }

    deleteReward(reward: RankTierReward): void {
        if (!this.selectedTierId || this.deletingId !== null) return;
        this.deletingId = reward.id;
        this._cdr.markForCheck();
        this._rewardService.remove(this.selectedTierId, reward.id).subscribe({
            next: (res) => {
                this.rewards    = this.rewards.filter(r => r.id !== reward.id);
                this.deletingId = null;
                this._snackBar.openSnackBar(res.message ?? 'Reward deleted.', GlobalConstants.success);
                this._cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.deletingId = null;
                this._snackBar.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                this._cdr.markForCheck();
            },
        });
    }

    typeBadgeClass(type: string): string {
        return type === 'coupon'
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
            : 'bg-teal-100   text-teal-800   dark:bg-teal-900   dark:text-teal-200';
    }
}
