import { DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { HelperConfirmationConfig, HelperConfirmationService } from 'helper/services/confirmation';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';

import { IncomingWebsiteOrder } from './interface';
import { IncomingWebOrdersService } from './service';

@Component({
    selector: 'cashier-incoming-web-orders',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [NgIf, NgFor, DatePipe, DecimalPipe, MatIconModule, MatButtonModule, MatTableModule],
})
export class IncomingWebOrdersComponent implements OnInit, OnDestroy {
    private readonly _service = inject(IncomingWebOrdersService);
    private readonly _snackBarService = inject(SnackbarService);
    private readonly _confirmation = inject(HelperConfirmationService);

    displayedColumns: string[] = ['no', 'receipt', 'customer', 'total', 'status', 'ordered_at', 'items', 'action'];
    dataSource = new MatTableDataSource<IncomingWebsiteOrder>([]);

    isLoading = false;
    busyOrderId: number | null = null;

    private _pollTimer: ReturnType<typeof setInterval> | null = null;

    ngOnInit(): void {
        this.refresh();
        this._pollTimer = setInterval(() => this.refreshQuiet(), 30_000);
    }

    ngOnDestroy(): void {
        if (this._pollTimer != null) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
    }

    refresh(): void {
        this.isLoading = true;
        this._service.list().subscribe({
            next: (res) => {
                this.dataSource.data = res?.data ?? [];
                this.isLoading = false;
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this._snackBarService.openSnackBar(
                    err?.error?.message ?? GlobalConstants.genericError,
                    GlobalConstants.error,
                );
            },
        });
    }

    /** Silent refresh for polling — keep loading spinner off */
    private refreshQuiet(): void {
        if (this.busyOrderId != null) {
            return;
        }
        this._service.list().subscribe({
            next: (res) => {
                this.dataSource.data = res?.data ?? [];
            },
            error: () => {
                /* ignore poll errors */
            },
        });
    }

    statusLabel(row: IncomingWebsiteOrder): string {
        const s = (row.status ?? '').toLowerCase();
        if (s === 'awaiting_payment') {
            return 'Awaiting payment';
        }
        if (s === 'pending') {
            return 'Needs acceptance';
        }
        return row.status ?? '—';
    }

    itemsPreview(row: IncomingWebsiteOrder): string {
        const lines = row.details ?? [];
        if (lines.length === 0) {
            return '—';
        }
        const parts = lines.slice(0, 3).map((d) => `${d.qty}× ${d.menu?.name ?? 'Item'}`);
        const extra = lines.length > 3 ? ` (+${lines.length - 3})` : '';
        return parts.join(', ') + extra;
    }

    canAccept(row: IncomingWebsiteOrder): boolean {
        return (row.status ?? '').toLowerCase() === 'pending';
    }

    accept(row: IncomingWebsiteOrder): void {
        if (!this.canAccept(row)) {
            return;
        }
        this.busyOrderId = row.id;
        this._service.accept(row.id).subscribe({
            next: (res) => {
                this.busyOrderId = null;
                this._snackBarService.openSnackBar(res.message ?? 'Order accepted.', GlobalConstants.success);
                this.refresh();
            },
            error: (err: HttpErrorResponse) => {
                this.busyOrderId = null;
                this._snackBarService.openSnackBar(
                    err?.error?.message ?? GlobalConstants.genericError,
                    GlobalConstants.error,
                );
            },
        });
    }

    deny(row: IncomingWebsiteOrder): void {
        const configAction: HelperConfirmationConfig = {
            title: `Decline order <strong>#${row.receipt_number}</strong>?`,
            message:
                'The customer will need to place a new order if they still want food. This cannot be undone.',
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn',
            },
            actions: {
                confirm: {
                    show: true,
                    label: 'Decline order',
                    color: 'warn',
                },
                cancel: {
                    show: true,
                    label: 'Keep',
                },
            },
            dismissible: true,
        };

        const dialogRef = this._confirmation.open(configAction);
        dialogRef.afterClosed().subscribe((result: string) => {
            if (result !== 'confirmed') {
                return;
            }
            this.busyOrderId = row.id;
            this._service.deny(row.id).subscribe({
                next: (res) => {
                    this.busyOrderId = null;
                    this._snackBarService.openSnackBar(res.message ?? 'Order declined.', GlobalConstants.success);
                    this.refresh();
                },
                error: (err: HttpErrorResponse) => {
                    this.busyOrderId = null;
                    this._snackBarService.openSnackBar(
                        err?.error?.message ?? GlobalConstants.genericError,
                        GlobalConstants.error,
                    );
                },
            });
        });
    }
}
