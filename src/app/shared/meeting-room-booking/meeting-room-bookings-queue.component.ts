import { DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewChild,
    inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { HelperConfirmationConfig, HelperConfirmationService } from 'helper/services/confirmation';
import { ExchangeRateSettingService } from 'helper/services/exchange-rate-setting/exchange-rate-setting.service';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { UsdFromKhrPipe } from 'helper/pipes/usd-from-khr.pipe';

import { MeetingRoomBookingRow } from './interface';
import { MeetingRoomBookingService } from './meeting-room-booking.service';

type QueueFilter = 'pending' | 'confirmed' | 'all';

@Component({
    selector: 'app-meeting-room-bookings-queue',
    standalone: true,
    templateUrl: './meeting-room-bookings-queue.template.html',
    styleUrl: './meeting-room-bookings-queue.style.scss',
    imports: [
        NgIf,
        NgFor,
        DatePipe,
        DecimalPipe,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatTableModule,
        MatPaginatorModule,
        UsdFromKhrPipe,
    ],
})
export class MeetingRoomBookingsQueueComponent implements OnInit, OnDestroy {
    @ViewChild(MatPaginator)
    set paginator(p: MatPaginator | undefined) {
        this.dataSource.paginator = p ?? null;
    }

    readonly pageSize = 15;
    readonly filters: { id: QueueFilter; label: string }[] = [
        { id: 'pending', label: 'Awaiting approval' },
        { id: 'confirmed', label: 'Confirmed' },
        { id: 'all', label: 'All' },
    ];

    activeFilter: QueueFilter = 'pending';
    isLoading = false;
    busyId: number | null = null;
    usdRate = ExchangeRateSettingService.FALLBACK_KHR_PER_USD;

    displayedColumns: string[] = [
        'no',
        'id',
        'room',
        'guest',
        'schedule',
        'guests',
        'total',
        'payment',
        'status',
        'action',
    ];
    dataSource = new MatTableDataSource<MeetingRoomBookingRow>([]);

    private readonly _service = inject(MeetingRoomBookingService);
    private readonly _snackBar = inject(SnackbarService);
    private readonly _confirmation = inject(HelperConfirmationService);
    private readonly _exchangeRates = inject(ExchangeRateSettingService);
    private readonly _cdr = inject(ChangeDetectorRef);

    private _pollTimer: ReturnType<typeof setInterval> | null = null;

    ngOnInit(): void {
        this._exchangeRates.fetchCashier().subscribe({
            next: () => {
                this.usdRate = this._exchangeRates.khrPerUsd;
                this._cdr.markForCheck();
            },
            error: () => {
                this.usdRate = this._exchangeRates.khrPerUsd;
                this._cdr.markForCheck();
            },
        });
        this.refresh();
        this._pollTimer = setInterval(() => this.refreshQuiet(), 30_000);
    }

    ngOnDestroy(): void {
        if (this._pollTimer != null) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
    }

    setFilter(filter: QueueFilter): void {
        if (this.activeFilter === filter) {
            return;
        }
        this.activeFilter = filter;
        this.refresh();
    }

    refresh(): void {
        this.isLoading = true;
        const status = this.activeFilter === 'all' ? undefined : this.activeFilter;
        this._service.list(status).subscribe({
            next: (res) => {
                this.dataSource.data = this._sortRows(res?.data ?? []);
                this.isLoading = false;
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this._snackBar.openSnackBar(
                    err?.error?.message ?? GlobalConstants.genericError,
                    GlobalConstants.error,
                );
            },
        });
    }

    private refreshQuiet(): void {
        if (this.busyId != null) {
            return;
        }
        const status = this.activeFilter === 'all' ? undefined : this.activeFilter;
        this._service.list(status).subscribe({
            next: (res) => {
                this.dataSource.data = this._sortRows(res?.data ?? []);
            },
            error: () => {
                /* ignore poll errors */
            },
        });
    }

    private _sortRows(rows: MeetingRoomBookingRow[]): MeetingRoomBookingRow[] {
        const tier = (status: string | undefined): number => {
            const s = (status ?? '').toLowerCase();
            if (s === 'pending') return 0;
            if (s === 'confirmed') return 1;
            if (s === 'completed') return 2;
            if (s === 'cancelled') return 3;
            return 4;
        };
        return [...rows].sort((a, b) => {
            const d = tier(a.status) - tier(b.status);
            if (d !== 0) return d;
            const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
            const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
            return tb - ta;
        });
    }

    queuedRowOrdinal(pageRowIndex: number): number {
        const p = this.dataSource.paginator;
        if (p == null) return pageRowIndex + 1;
        return p.pageIndex * p.pageSize + pageRowIndex + 1;
    }

    scheduleLabel(row: MeetingRoomBookingRow): string {
        const date = row.check_in_date ?? '—';
        const start = this._formatTime(row.meeting_start_time);
        const end = this._formatTime(row.meeting_end_time);
        return `${date} · ${start}–${end}`;
    }

    private _formatTime(hhmm: string | undefined): string {
        if (!hhmm) return '—';
        const [hStr, mStr] = hhmm.split(':');
        const h = Number(hStr);
        const m = Number(mStr ?? 0);
        if (!Number.isFinite(h)) return hhmm;
        const am = h < 12;
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${h12}:${String(m).padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
    }

    bookingStatusLabel(row: MeetingRoomBookingRow): string {
        const s = (row.status ?? '').toLowerCase();
        if (s === 'pending') return 'Awaiting approval';
        if (s === 'confirmed') return 'Confirmed';
        if (s === 'cancelled') return 'Cancelled';
        if (s === 'completed') return 'Completed';
        return row.status ?? '—';
    }

    paymentStatusLabel(row: MeetingRoomBookingRow): string {
        const p = (row.payment_status ?? 'pending').toLowerCase();
        if (p === 'success') return 'Paid';
        if (p === 'failed') return 'Payment failed';
        if (p === 'expired') return 'Payment expired';
        return 'Payment pending';
    }

    isPaid(row: MeetingRoomBookingRow): boolean {
        return (row.payment_status ?? '').toLowerCase() === 'success';
    }

    isClosed(row: MeetingRoomBookingRow): boolean {
        const s = (row.status ?? '').toLowerCase();
        return s === 'cancelled' || s === 'completed';
    }

    canConfirm(row: MeetingRoomBookingRow): boolean {
        return (row.status ?? '').toLowerCase() === 'pending';
    }

    canComplete(row: MeetingRoomBookingRow): boolean {
        return (row.status ?? '').toLowerCase() === 'confirmed' && this.isPaid(row);
    }

    canMarkPaid(row: MeetingRoomBookingRow): boolean {
        if (this.isClosed(row) || this.isPaid(row)) return false;
        const s = (row.status ?? '').toLowerCase();
        return s === 'pending' || s === 'confirmed';
    }

    canDecline(row: MeetingRoomBookingRow): boolean {
        const s = (row.status ?? '').toLowerCase();
        return s === 'pending' || s === 'confirmed';
    }

    confirm(row: MeetingRoomBookingRow): void {
        if (!this.canConfirm(row)) return;
        const cfg: HelperConfirmationConfig = {
            title: 'Confirm booking?',
            message: `Approve ${row.guest_name} for ${row.room?.name ?? 'room'} on ${row.check_in_date}?`,
            icon: { show: true, name: 'heroicons_outline:check-circle', color: 'primary' },
            actions: {
                confirm: { show: true, label: 'Confirm', color: 'primary' },
                cancel: { show: true, label: 'Back' },
            },
        };
        this._confirmation.open(cfg).afterClosed().subscribe((ok) => {
            if (!ok) return;
            this._mutate(row.id, () => this._service.confirm(row.id), 'Booking confirmed.');
        });
    }

    complete(row: MeetingRoomBookingRow): void {
        if (!this.canComplete(row)) {
            if ((row.status ?? '').toLowerCase() === 'confirmed' && !this.isPaid(row)) {
                this._snackBar.openSnackBar(
                    'Record payment before marking this booking completed.',
                    GlobalConstants.error,
                );
            }
            return;
        }
        this._mutate(row.id, () => this._service.complete(row.id), 'Booking marked completed.');
    }

    markPaid(row: MeetingRoomBookingRow): void {
        if (!this.canMarkPaid(row)) return;
        const cfg: HelperConfirmationConfig = {
            title: 'Record payment?',
            message: `Mark booking #${row.id} for ${row.guest_name} as paid (cash / in person)?`,
            icon: { show: true, name: 'heroicons_outline:banknotes', color: 'primary' },
            actions: {
                confirm: { show: true, label: 'Mark paid', color: 'primary' },
                cancel: { show: true, label: 'Back' },
            },
        };
        this._confirmation.open(cfg).afterClosed().subscribe((ok) => {
            if (!ok) return;
            this._mutate(row.id, () => this._service.markPaid(row.id), 'Payment recorded.');
        });
    }

    decline(row: MeetingRoomBookingRow): void {
        if (!this.canDecline(row)) return;
        const cfg: HelperConfirmationConfig = {
            title: 'Cancel booking?',
            message: `Cancel reservation #${row.id} for ${row.guest_name}?`,
            icon: { show: true, name: 'heroicons_outline:x-circle', color: 'warn' },
            actions: {
                confirm: { show: true, label: 'Cancel booking', color: 'warn' },
                cancel: { show: true, label: 'Back' },
            },
        };
        this._confirmation.open(cfg).afterClosed().subscribe((ok) => {
            if (!ok) return;
            this._mutate(row.id, () => this._service.cancel(row.id), 'Booking cancelled.');
        });
    }

    private _mutate(
        id: number,
        call: () => ReturnType<MeetingRoomBookingService['confirm']>,
        successMsg: string,
    ): void {
        this.busyId = id;
        call().subscribe({
            next: (res) => {
                this.busyId = null;
                this._snackBar.openSnackBar(res.message ?? successMsg, GlobalConstants.success);
                this.refresh();
            },
            error: (err: HttpErrorResponse) => {
                this.busyId = null;
                this._snackBar.openSnackBar(
                    err?.error?.message ?? GlobalConstants.genericError,
                    GlobalConstants.error,
                );
            },
        });
    }
}
