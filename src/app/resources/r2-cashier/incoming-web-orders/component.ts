import { DatePipe, DecimalPipe, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { HelperConfirmationConfig, HelperConfirmationService } from 'helper/services/confirmation';
import { PrintableOrder, PrintReceiptService } from 'helper/services/print-receipt/print-receipt.service';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';

import { IncomingWebsiteOrder } from './interface';
import { IncomingWebOrdersService } from './service';

@Component({
    selector: 'cashier-incoming-web-orders',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [NgIf, DatePipe, DecimalPipe, MatIconModule, MatButtonModule, MatMenuModule, MatTableModule, MatPaginatorModule],
})
export class IncomingWebOrdersComponent implements OnInit, OnDestroy {
    @ViewChild(MatPaginator)
    set paginator(p: MatPaginator | undefined) {
        this.dataSource.paginator = p ?? null;
    }

    readonly pageSize = 20;

    private readonly _service = inject(IncomingWebOrdersService);
    private readonly _snackBarService = inject(SnackbarService);
    private readonly _confirmation = inject(HelperConfirmationService);
    private readonly _printReceipt = inject(PrintReceiptService);

    displayedColumns: string[] = ['no', 'order_no', 'receipt', 'customer', 'total', 'status', 'ordered_at', 'items', 'action'];
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

    /** Preparing / ready first, then pending, etc.; within a tier by order # (001, 002…), then time. */
    private _sortIncomingWebQueue(rows: IncomingWebsiteOrder[]): IncomingWebsiteOrder[] {
        const tier = (status: string | undefined): number => {
            const s = (status ?? '').toLowerCase();
            if (s === 'preparing') {
                return 0;
            }
            if (s === 'ready') {
                return 1;
            }
            if (s === 'pending') {
                return 2;
            }
            if (s === 'awaiting_payment') {
                return 3;
            }
            if (s === 'completed') {
                return 4;
            }
            if (s === 'cancelled') {
                return 5;
            }
            return 6;
        };
        const orderNumKey = (row: IncomingWebsiteOrder): number => {
            const n = row.order_number;
            if (n == null || !Number.isFinite(Number(n))) {
                return Number.POSITIVE_INFINITY;
            }
            return Number(n);
        };
        return [...rows].sort((a, b) => {
            const d = tier(a.status) - tier(b.status);
            if (d !== 0) {
                return d;
            }
            const na = orderNumKey(a);
            const nb = orderNumKey(b);
            if (na !== nb) {
                return na - nb;
            }
            const ta = a.ordered_at ? new Date(a.ordered_at).getTime() : 0;
            const tb = b.ordered_at ? new Date(b.ordered_at).getTime() : 0;
            return ta - tb;
        });
    }

    /** Merge PATCH response into the table row so UI matches server (avoids GET race showing old `preparing`). */
    private _applyOrderSnapshot(patch: IncomingWebsiteOrder): void {
        const rows = [...this.dataSource.data];
        const i = rows.findIndex((r) => r.id === patch.id);
        if (i < 0) {
            return;
        }
        rows[i] = { ...rows[i], ...patch };
        this.dataSource.data = this._sortIncomingWebQueue(rows);
    }

    private _afterMutationRefresh(patch: IncomingWebsiteOrder | undefined, message: string): void {
        this._service.list().subscribe({
            next: (listRes) => {
                let rows = listRes?.data ?? [];
                if (patch?.id != null) {
                    const idx = rows.findIndex((o) => o.id === patch.id);
                    if (idx >= 0) {
                        rows = rows.map((o) => (o.id === patch.id ? { ...o, ...patch } : o));
                    }
                }
                this.dataSource.data = this._sortIncomingWebQueue(rows);
                this.busyOrderId = null;
                this._snackBarService.openSnackBar(message, GlobalConstants.success);
            },
            error: () => {
                if (patch?.id != null) {
                    this._applyOrderSnapshot(patch);
                }
                this.busyOrderId = null;
                this._snackBarService.openSnackBar(message, GlobalConstants.success);
            },
        });
    }

    refresh(): void {
        this.isLoading = true;
        this._service.list().subscribe({
            next: (res) => {
                this.dataSource.data = this._sortIncomingWebQueue(res?.data ?? []);
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
                this.dataSource.data = this._sortIncomingWebQueue(res?.data ?? []);
            },
            error: () => {
                /* ignore poll errors */
            },
        });
    }

    /** 1-based index across whole queue (respects pagination). */
    queuedRowOrdinal(pageRowIndex: number): number {
        const p = this.dataSource.paginator;
        if (p == null) {
            return pageRowIndex + 1;
        }
        return p.pageIndex * p.pageSize + pageRowIndex + 1;
    }

    /** Display order counter as 001–100 */
    shortOrderLabel(row: IncomingWebsiteOrder): string {
        const n = row.order_number;
        if (n == null || !Number.isFinite(Number(n))) {
            return '—';
        }
        return String(Math.floor(Number(n))).padStart(3, '0');
    }

    statusLabel(row: IncomingWebsiteOrder): string {
        const s = (row.status ?? '').toLowerCase();
        if (s === 'awaiting_payment') {
            return 'Awaiting payment';
        }
        if (s === 'pending') {
            return 'Needs acceptance';
        }
        if (s === 'preparing') {
            return 'Processing';
        }
        if (s === 'ready') {
            return 'Ready for pickup';
        }
        if (s === 'completed') {
            return 'Completed';
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

    canFinishProcessing(row: IncomingWebsiteOrder): boolean {
        const s = (row.status ?? '').toLowerCase();
        return s === 'preparing' || s === 'ready';
    }

    /** Completed (or cancelled) rows: no Accept / Finish / Decline. */
    isOrderClosed(row: IncomingWebsiteOrder): boolean {
        const s = (row.status ?? '').toLowerCase();
        return s === 'completed' || s === 'cancelled';
    }

    canDeclineOrCancel(row: IncomingWebsiteOrder): boolean {
        return !this.isOrderClosed(row);
    }

    private _toPrintableOrder(row: IncomingWebsiteOrder): PrintableOrder {
        const receiptNum = row.receipt_number;
        return {
            receipt_number: receiptNum,
            order_number: row.order_number ?? null,
            total_price: Number(row.total_price ?? 0),
            coupon_code: row.coupon_code ?? null,
            discount_percent:
                row.discount_percent != null && Number.isFinite(Number(row.discount_percent))
                    ? Number(row.discount_percent)
                    : null,
            discount_amount:
                row.discount_amount != null && Number.isFinite(Number(row.discount_amount))
                    ? Number(row.discount_amount)
                    : null,
            channel: row.channel,
            ordered_at: row.ordered_at ?? undefined,
            customer: row.customer?.name ? { name: row.customer.name } : undefined,
            details: (row.details ?? []).map((d) => ({
                unit_price: Number(d.unit_price ?? 0),
                qty: Math.max(1, Math.round(Number(d.qty) || 1)),
                menu: d.menu,
                line_note: d.line_note ?? undefined,
                detailModifiers: d.detailModifiers ?? d.detail_modifiers,
            })),
        };
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
                if (res.data) {
                    this._printReceipt.printBaristaPrepOnly(this._toPrintableOrder(res.data));
                }
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

    finishProcessing(row: IncomingWebsiteOrder): void {
        if (!this.canFinishProcessing(row)) {
            return;
        }
        this.busyOrderId = row.id;
        this._service.finishWeb(row.id).subscribe({
            next: (res) => {
                const patch = res?.data;
                if (patch) {
                    const forPrint: IncomingWebsiteOrder = { ...row, ...patch };
                    if (!forPrint.details?.length && row.details?.length) {
                        forPrint.details = row.details;
                    }
                    this._printReceipt.printCustomerAndCashierOnly(this._toPrintableOrder(forPrint));
                }
                this._afterMutationRefresh(patch, res.message ?? 'Order completed.');
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
        if (!this.canDeclineOrCancel(row)) {
            return;
        }
        const configAction: HelperConfirmationConfig = {
            title: `Decline order <strong>Order ${this.shortOrderLabel(row)}</strong> (Receipt #${row.receipt_number})?`,
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
