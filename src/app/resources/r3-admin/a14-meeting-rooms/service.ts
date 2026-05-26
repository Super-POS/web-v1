import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';
import { AdminMeetingRoomRow } from './interface';

export type MeetingRoomPayload = {
    name: string;
    description?: string | null;
    capacity: number;
    price_per_hour?: number | null;
    type?: string;
    status?: string;
    notes?: string | null;
};

@Injectable({ providedIn: 'root' })
export class AdminMeetingRoomService {
    constructor(private http: HttpClient) {}

    private headers(): HttpHeaders {
        return new HttpHeaders({ 'Content-Type': 'application/json' });
    }

    list(): Observable<{ data: AdminMeetingRoomRow[] }> {
        return this.http.get<{ data: AdminMeetingRoomRow[] }>(`${env.API_BASE_URL}/admin/meeting-rooms`, {
            headers: this.headers(),
        });
    }

    getById(id: number): Observable<{ data: AdminMeetingRoomRow }> {
        return this.http.get<{ data: AdminMeetingRoomRow }>(`${env.API_BASE_URL}/admin/meeting-rooms/${id}`, {
            headers: this.headers(),
        });
    }

    create(body: MeetingRoomPayload): Observable<{ data: AdminMeetingRoomRow; message: string }> {
        return this.http.post<{ data: AdminMeetingRoomRow; message: string }>(
            `${env.API_BASE_URL}/admin/meeting-rooms`,
            body,
            { headers: this.headers() },
        );
    }

    update(id: number, body: Partial<MeetingRoomPayload>): Observable<{ data: AdminMeetingRoomRow; message: string }> {
        return this.http.patch<{ data: AdminMeetingRoomRow; message: string }>(
            `${env.API_BASE_URL}/admin/meeting-rooms/${id}`,
            body,
            { headers: this.headers() },
        );
    }

    remove(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${env.API_BASE_URL}/admin/meeting-rooms/${id}`, {
            headers: this.headers(),
        });
    }
}
