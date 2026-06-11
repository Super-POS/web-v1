import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';
import { AdminMission, CreateMissionPayload, MissionParticipant, UpdateMissionPayload } from './interface';

@Injectable({ providedIn: 'root' })
export class AdminMissionService {
    private readonly base    = `${env.API_BASE_URL}/admin/missions`;
    private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    constructor(private http: HttpClient) {}

    list(): Observable<{ data: AdminMission[] }> {
        return this.http.get<{ data: AdminMission[] }>(this.base, { headers: this.headers });
    }

    create(payload: CreateMissionPayload): Observable<{ data: AdminMission; message: string }> {
        return this.http.post<{ data: AdminMission; message: string }>(this.base, payload, { headers: this.headers });
    }

    update(id: number, payload: UpdateMissionPayload): Observable<{ data: AdminMission; message: string }> {
        return this.http.patch<{ data: AdminMission; message: string }>(
            `${this.base}/${id}`,
            payload,
            { headers: this.headers },
        );
    }

    remove(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.base}/${id}`, { headers: this.headers });
    }

    participants(id: number): Observable<{ data: MissionParticipant[] }> {
        return this.http.get<{ data: MissionParticipant[] }>(`${this.base}/${id}/participants`, { headers: this.headers });
    }
}
