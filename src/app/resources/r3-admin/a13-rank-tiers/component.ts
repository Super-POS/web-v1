import { DecimalPipe, NgClass, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { PosBreadcrumbComponent, PosListPageComponent } from 'app/shared/list-page';
import { RankTier, UpdateRankTierPayload } from './interface';
import { AdminRankTierService } from './service';

@Component({
    selector: 'admin-rank-tiers',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        PosListPageComponent,
        PosBreadcrumbComponent,
        NgIf,
        NgClass,
        DecimalPipe,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatTableModule,
        MatTooltipModule,
    ],
})
export class AdminRankTiersComponent implements OnInit {
    private _service    = inject(AdminRankTierService);
    private _snackBar   = inject(SnackbarService);
    private _cdr        = inject(ChangeDetectorRef);

    readonly displayedColumns = ['tier', 'label', 'min_points', 'action'];

    tiers   : RankTier[] = [];
    isLoading            = false;

    editingId  : number | null = null;
    editLabel  : string        = '';
    editPoints : number        = 0;
    isSaving                   = false;

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.isLoading = true;
        this._cdr.markForCheck();
        this._service.listAll().subscribe({
            next: (res) => {
                this.tiers     = res.data ?? [];
                this.isLoading = false;
                this._cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this._snackBar.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                this._cdr.markForCheck();
            },
        });
    }

    startEdit(tier: RankTier): void {
        this.editingId  = tier.id;
        this.editLabel  = tier.label;
        this.editPoints = tier.min_points;
        this._cdr.markForCheck();
    }

    cancelEdit(): void {
        this.editingId = null;
        this._cdr.markForCheck();
    }

    saveEdit(tier: RankTier): void {
        const payload: UpdateRankTierPayload = {};
        if (this.editLabel.trim() !== tier.label)      payload.label      = this.editLabel.trim();
        if (this.editPoints       !== tier.min_points) payload.min_points = this.editPoints;

        if (!Object.keys(payload).length) {
            this.cancelEdit();
            return;
        }

        this.isSaving = true;
        this._service.update(tier.id, payload).subscribe({
            next: (res) => {
                const idx = this.tiers.findIndex(t => t.id === tier.id);
                if (idx >= 0) this.tiers[idx] = res.data;
                this.tiers     = [...this.tiers];
                this.editingId = null;
                this.isSaving  = false;
                this._snackBar.openSnackBar(res.message ?? 'Rank tier updated.', GlobalConstants.success);
                this._cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isSaving = false;
                this._snackBar.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                this._cdr.markForCheck();
            },
        });
    }

    tierBadgeClass(tier: number): string {
        if (tier <= 3)  return 'bg-amber-100  text-amber-800  dark:bg-amber-900  dark:text-amber-200';
        if (tier <= 6)  return 'bg-green-100  text-green-800  dark:bg-green-900  dark:text-green-200';
        if (tier <= 10) return 'bg-blue-100   text-blue-800   dark:bg-blue-900   dark:text-blue-200';
        return               'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
}
