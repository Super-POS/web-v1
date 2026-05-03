import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';
import { AdminCouponRow } from './interface';

@Injectable({ providedIn: 'root' })
export class AdminCouponService {
    constructor(private http: HttpClient) {}

    list(): Observable<{ data: AdminCouponRow[] }> {
        return this.http.get<{ data: AdminCouponRow[] }>(`${env.API_BASE_URL}/admin/coupons`, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        });
    }

    create(body: { code: string; discount_percent: number; is_active?: boolean; note?: string | null }): Observable<{ data: AdminCouponRow; message: string }> {
        return this.http.post<{ data: AdminCouponRow; message: string }>(`${env.API_BASE_URL}/admin/coupons`, body, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        });
    }

    update(
        id: number,
        body: { code?: string; discount_percent?: number; is_active?: boolean; note?: string | null },
    ): Observable<{ data: AdminCouponRow; message: string }> {
        return this.http.patch<{ data: AdminCouponRow; message: string }>(`${env.API_BASE_URL}/admin/coupons/${id}`, body, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        });
    }

    remove(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${env.API_BASE_URL}/admin/coupons/${id}`, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        });
    }
}
