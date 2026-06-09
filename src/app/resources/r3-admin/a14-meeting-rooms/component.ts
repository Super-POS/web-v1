import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { HelperConfirmationConfig, HelperConfirmationService } from 'helper/services/confirmation';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { AdminMeetingRoomRow } from './interface';
import { AdminMeetingRoomService } from './service';
import { PosBreadcrumbComponent, PosListPageComponent } from 'app/shared/list-page';

@Component({
    selector: 'app-admin-meeting-rooms',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        PosListPageComponent,
        PosBreadcrumbComponent,
        CommonModule,
        DecimalPipe,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatTableModule,
        MatPaginatorModule,
    ],
})
export class AdminMeetingRoomsComponent implements OnInit {
    @ViewChild(MatPaginator) set matPaginator(paginator: MatPaginator | undefined) {
        if (paginator) {
            this.dataSource.paginator = paginator;
        }
    }

    displayedColumns = ['name', 'type', 'capacity', 'price', 'status', 'description', 'actions'] as const;
    dataSource = new MatTableDataSource<AdminMeetingRoomRow>([]);
    isLoading = false;
    readonly pageSizeOptions = [15, 30, 50, 100];
    readonly defaultPageSize = 15;

    constructor(
        private service: AdminMeetingRoomService,
        private snackBar: SnackbarService,
        private cdr: ChangeDetectorRef,
        private router: Router,
        private confirmation: HelperConfirmationService,
    ) {}

    ngOnInit(): void {
        this.load();

        this.router.events
            .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
            .subscribe(() => {
                const path = this.router.url.split('?')[0];
                if (path === '/admin/meeting-rooms') {
                    this.load();
                }
            });
    }

    typeLabel(type: string | undefined): string {
        const t = (type ?? '').toLowerCase();
        if (t === 'vip') return 'VIP';
        if (t === 'conference') return 'Conference';
        if (t === 'executive') return 'Executive';
        if (t === 'standard') return 'Standard';
        return type ?? '—';
    }

    statusLabel(status: string | undefined): string {
        const s = (status ?? '').toLowerCase();
        if (s === 'available') return 'Available';
        if (s === 'maintenance') return 'Maintenance';
        if (s === 'inactive') return 'Inactive';
        return status ?? '—';
    }

    openCreatePage(): void {
        this.router.navigate(['/admin/meeting-rooms/create']);
    }

    openEditPage(row: AdminMeetingRoomRow): void {
        this.router.navigate(['/admin/meeting-rooms/edit', row.id]);
    }

    load(): void {
        this.isLoading = true;
        this.service.list().subscribe({
            next: (res) => {
                this.dataSource.data = res.data ?? [];
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this.snackBar.openSnackBar(
                    err?.error?.message ?? GlobalConstants.genericError,
                    GlobalConstants.error,
                );
                this.cdr.markForCheck();
            },
        });
    }

    remove(row: AdminMeetingRoomRow): void {
        const config: HelperConfirmationConfig = {
            title: `Delete room <strong>${row.name}</strong>`,
            message:
                'This room will be removed permanently. Rooms with active bookings cannot be deleted. <span class="font-medium">This action cannot be undone.</span>',
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn',
            },
            actions: {
                confirm: { show: true, label: 'Delete', color: 'warn' },
                cancel: { show: true, label: 'Cancel' },
            },
            dismissible: true,
        };
        this.confirmation.open(config).afterClosed().subscribe((result: string | undefined) => {
            if (result !== 'confirmed') return;
            this.service.remove(row.id).subscribe({
                next: (res) => {
                    this.snackBar.openSnackBar(res.message ?? 'Deleted.', GlobalConstants.success);
                    this.load();
                },
                error: (err: HttpErrorResponse) => {
                    this.snackBar.openSnackBar(
                        err?.error?.message ?? GlobalConstants.genericError,
                        GlobalConstants.error,
                    );
                },
            });
        });
    }
}
