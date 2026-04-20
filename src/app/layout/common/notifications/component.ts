import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DatePipe, NgClass, NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild,
    ViewContainerRef,
    ViewEncapsulation,
} from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { Notification } from 'app/layout/common/notifications/interface';
import { NotificationsService } from 'app/layout/common/notifications/service';
import { env } from 'envs/env';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'notifications',
    templateUrl: './template.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'notifications',
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        NgClass,
        NgTemplateOutlet,
        RouterLink,
        DatePipe,
    ],
})
export class NotificationsComponent implements OnInit, OnDestroy {
    @ViewChild('notificationsOrigin') private _notificationsOrigin: MatButton;
    @ViewChild('notificationsPanel')
    private _notificationsPanel: TemplateRef<any>;
    fileUrl: string = env.FILE_BASE_URL;
    notifications: Notification[] = [];
    unreadCount: number = 0;
    private _overlayRef: OverlayRef;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _notificationsService: NotificationsService,
        private _overlay: Overlay,
        private _viewContainerRef: ViewContainerRef
    ) { }

    ngOnInit(): void {
        this._notificationsService.notifications$.pipe(takeUntil(this._unsubscribeAll)).subscribe((data: Notification[]) => {
            this.notifications = data;
            this._calculateUnreadCount(); // Recalculate unread count
            this._changeDetectorRef.markForCheck(); // Trigger view update
        });

        // // Connect to the WebSocket server
        this._notificationsService.connect();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        // Disconnect from the WebSocket server
        this._notificationsService.disconnect();

        if (this._overlayRef) {
            this._overlayRef.dispose();
        }
    }

    openPanel(): void {
        if (!this._notificationsPanel || !this._notificationsOrigin) {
            return;
        }

        if (!this._overlayRef) {
            this._createOverlay();
        }

        this._overlayRef.attach(new TemplatePortal(this._notificationsPanel, this._viewContainerRef));
    }

    closePanel(): void {
        this._overlayRef.detach();
    }

    markAllAsRead(): void {
        this._notificationsService.markAllAsRead().subscribe();
    }

    toggleRead(notification: Notification): void {
        notification.read = !notification.read;
        this._notificationsService.update(notification.id, notification).subscribe();
    }

    delete(notification: Notification): void {
        this._notificationsService.delete(notification.id).subscribe();
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    private _createOverlay(): void {
        this._overlayRef = this._overlay.create({
            hasBackdrop: true,
            backdropClass: 'helper-backdrop-on-mobile',
            scrollStrategy: this._overlay.scrollStrategies.block(),
            positionStrategy: this._overlay
                .position()
                .flexibleConnectedTo(this._notificationsOrigin._elementRef.nativeElement)
                .withLockedPosition(true)
                .withPush(true)
                .withPositions([
                    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
                    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
                    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
                    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
                ]),
        });
        this._overlayRef.backdropClick().subscribe(() => this._overlayRef.detach());
    }

    private _calculateUnreadCount(): void {
        this.unreadCount = this.notifications.filter(notification => !notification.read).length;
    }
}
