import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { env } from 'envs/env';
import {
    MeetingRoomBookingListResponse,
    MeetingRoomBookingMutationResponse,
    MeetingRoomBookingStatus,
} from './interface';

/** Admin API — cashier and admin roles (`/api/admin/meeting-room-bookings`). */
@Injectable({ providedIn: 'root' })
export class MeetingRoomBookingService {
    constructor(private readonly http: HttpClient) {}

    private headers(): HttpHeaders {
        return new HttpHeaders().set('Content-Type', 'application/json');
    }

    list(status?: MeetingRoomBookingStatus): Observable<MeetingRoomBookingListResponse> {
        let params = new HttpParams();
        if (status) {
            params = params.set('status', status);
        }
        return this.http.get<MeetingRoomBookingListResponse>(
            `${env.API_BASE_URL}/admin/meeting-room-bookings`,
            { headers: this.headers(), params },
        );
    }

    confirm(id: number): Observable<MeetingRoomBookingMutationResponse> {
        return this.updateStatus(id, 'confirmed');
    }

    cancel(id: number): Observable<MeetingRoomBookingMutationResponse> {
        return this.updateStatus(id, 'cancelled');
    }

    complete(id: number): Observable<MeetingRoomBookingMutationResponse> {
        return this.updateStatus(id, 'completed');
    }

    markPaid(id: number): Observable<MeetingRoomBookingMutationResponse> {
        return this.http.patch<MeetingRoomBookingMutationResponse>(
            `${env.API_BASE_URL}/admin/meeting-room-bookings/${id}/mark-paid`,
            {},
            { headers: this.headers() },
        );
    }

    private updateStatus(
        id: number,
        status: MeetingRoomBookingStatus,
    ): Observable<MeetingRoomBookingMutationResponse> {
        return this.http.patch<MeetingRoomBookingMutationResponse>(
            `${env.API_BASE_URL}/admin/meeting-room-bookings/${id}/status`,
            { status },
            { headers: this.headers() },
        );
    }
}
