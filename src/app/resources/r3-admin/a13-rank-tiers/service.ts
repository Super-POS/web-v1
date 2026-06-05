import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';
import { RankTier, UpdateRankTierPayload } from './interface';

@Injectable({ providedIn: 'root' })
export class AdminRankTierService {
    private base    = `${env.API_BASE_URL}/admin/rank-tiers`;
    private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    constructor(private http: HttpClient) {}

    listAll(): Observable<{ data: RankTier[] }> {
        return this.http.get<{ data: RankTier[] }>(this.base, { headers: this.headers });
    }

    update(id: number, payload: UpdateRankTierPayload): Observable<{ data: RankTier; message: string }> {
        return this.http.patch<{ data: RankTier; message: string }>(
            `${this.base}/${id}`,
            payload,
            { headers: this.headers },
        );
    }
}
