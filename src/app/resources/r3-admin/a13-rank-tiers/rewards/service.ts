import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';
import { RankTierReward, CreateRewardPayload, UpdateRewardPayload } from './interface';

@Injectable({ providedIn: 'root' })
export class AdminRankTierRewardService {
    private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    constructor(private http: HttpClient) {}

    private base(tierId: number): string {
        return `${env.API_BASE_URL}/admin/rank-tiers/${tierId}/rewards`;
    }

    list(tierId: number): Observable<{ data: RankTierReward[] }> {
        return this.http.get<{ data: RankTierReward[] }>(this.base(tierId), { headers: this.headers });
    }

    create(tierId: number, payload: CreateRewardPayload): Observable<{ data: RankTierReward; message: string }> {
        return this.http.post<{ data: RankTierReward; message: string }>(this.base(tierId), payload, { headers: this.headers });
    }

    update(tierId: number, rewardId: number, payload: UpdateRewardPayload): Observable<{ data: RankTierReward; message: string }> {
        return this.http.patch<{ data: RankTierReward; message: string }>(
            `${this.base(tierId)}/${rewardId}`,
            payload,
            { headers: this.headers },
        );
    }

    remove(tierId: number, rewardId: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.base(tierId)}/${rewardId}`, { headers: this.headers });
    }
}
