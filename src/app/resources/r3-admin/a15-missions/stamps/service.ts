import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';
import { AdminStamp, CreateStampPayload, UpdateStampPayload } from './interface';

@Injectable({ providedIn: 'root' })
export class AdminStampService {
    private readonly base    = `${env.API_BASE_URL}/admin/missions/stamps`;
    private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    constructor(private http: HttpClient) {}

    list(): Observable<{ data: AdminStamp[] }> {
        return this.http.get<{ data: AdminStamp[] }>(this.base, { headers: this.headers });
    }

    create(payload: CreateStampPayload): Observable<{ data: AdminStamp; message: string }> {
        return this.http.post<{ data: AdminStamp; message: string }>(this.base, payload, { headers: this.headers });
    }

    update(id: number, payload: UpdateStampPayload): Observable<{ data: AdminStamp; message: string }> {
        return this.http.patch<{ data: AdminStamp; message: string }>(
            `${this.base}/${id}`,
            payload,
            { headers: this.headers },
        );
    }

    remove(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.base}/${id}`, { headers: this.headers });
    }
}
