import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { UserService } from 'app/core/user/service';
import { User } from 'app/core/user/interface';
import { Notification } from 'app/layout/common/notifications/interface';
import { env } from 'envs/env';
import { map, Observable, ReplaySubject, switchMap, take } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class NotificationsService implements OnDestroy {
    private _notifications: ReplaySubject<Notification[]> = new ReplaySubject<Notification[]>(1);
    private _socket: Socket | undefined;
    private _user: User | undefined;
    private _notificationsCache: Notification[] = [];

    constructor(
        private _httpClient: HttpClient,
        private _userService: UserService
    ) {
        // Wait for user data and connect to socket when available
        this._userService.user$.pipe(take(1)).subscribe((user: User) => {
            this._user = user;
            if (user) {
                // this.connect();
            }
        });
    }

    get notifications$(): Observable<Notification[]> {
        return this._notifications.asObservable();
    }

    set notifications(value: Notification[]) {
        this._notificationsCache = value;
        this._notifications.next(value);
    }

    // delete code
    connect(): void {
        // if (!this._socket) {
        //     // this._socket = io(env.SOCKET_URL + '/notifications-getway', {
        //     //     transports: ['websocket'],
        //     // });

        //     this._socket.on('connect', () => {
        //         console.log('WebSocket connected');
        //         this.register();
        //     });

        //     this._socket.on('new-order-notification', (data: { data: Notification[] }) => {
        //         const newNotifications = data.data;
        //         this._notificationsCache = [...newNotifications];
        //         this._notifications.next(this._notificationsCache);
        //     });

        //     this._socket.on('notification-update', (data: { data: Notification[] }) => {
        //         const updatedNotifications = data.data;
        //         this._notificationsCache = [...updatedNotifications];
        //         this._notifications.next(this._notificationsCache);
        //     });

        //     this._socket.on('disconnect', () => {
        //         console.log('WebSocket disconnected');
        //     });

        //     this._socket.on('connect_error', (error: any) => {
        //         console.error(`WebSocket connection error: ${error.message}`, error);
        //     });
        // }
    }

    register(): void {
        if (this._user && this._user.id) {
            this._socket?.emit('register', this._user.id);
        } else {
            console.error('User ID not found for registration');
        }
    }

    disconnect(): void {
        if (this._socket) {
            this._socket.disconnect();
            this._socket = undefined; // Clear socket reference
        }
    }

    getAll(): Observable<Notification[]> {
        const apiUrl = `${env.API_BASE_URL}/share/notifications`;

        return this._httpClient.get<{ data: Notification[] }>(apiUrl).pipe(
            map(response => {
                const notifications = response.data;
                this.notifications = notifications;
                return notifications;
            })
        );
    }

    markAllAsRead(): Observable<boolean> {
        return this.notifications$.pipe(
            take(1),
            switchMap(notifications =>
                this._httpClient.get<boolean>('api/common/notifications/mark-all-as-read').pipe(
                    map((isUpdated: boolean) => {
                        if (isUpdated) {
                            const updatedNotifications = notifications.map(notification => ({
                                ...notification,
                                read: true,
                            }));
                            this._notificationsCache = updatedNotifications;
                            this._notifications.next(updatedNotifications);
                        }
                        return isUpdated;
                    })
                )
            )
        );
    }

    update(id: number, notification: Notification): Observable<Notification> {
        return this._httpClient.patch<Notification>(
            `${env.API_BASE_URL}/share/notifications/${id}/read`,
            { read: notification.read }
        );
    }

    delete(id: number): Observable<boolean> {
        return this.notifications$.pipe(
            take(1),
            switchMap(notifications =>
                this._httpClient.delete<boolean>(
                    `${env.API_BASE_URL}/share/notifications/${id}`,
                    { params: { id: id.toString() } }
                ).pipe(
                    map((isDeleted: boolean) => {
                        if (isDeleted) {
                            const updatedNotifications = notifications.filter(item => item.id !== id);
                            this._notifications.next(updatedNotifications);
                        }
                        return isDeleted;
                    })
                )
            )
        );
    }

    ngOnDestroy(): void {
        this.disconnect(); // Ensure socket is cleaned up on destroy
    }
}
