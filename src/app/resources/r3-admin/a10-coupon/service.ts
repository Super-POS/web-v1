import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { env } from 'envs/env';
import { AdminCouponRow, CouponCategoryOption, CouponMenuOption, CouponUserOption } from './interface';

@Injectable({ providedIn: 'root' })
export class AdminCouponService {
    constructor(private http: HttpClient) {}

    list(): Observable<{ data: AdminCouponRow[] }> {
        return this.http.get<{ data: AdminCouponRow[] }>(`${env.API_BASE_URL}/admin/coupons`, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        });
    }

    searchUsers(key: string): Observable<{ data: CouponUserOption[] }> {
        const params = new HttpParams()
            .set('page', '1')
            .set('page_size', '20')
            .set('key', key.trim());
        return this.http.get<{ data: CouponUserOption[] }>(`${env.API_BASE_URL}/admin/users`, { params });
    }

    searchMenus(key: string): Observable<{ data: CouponMenuOption[] }> {
        const params = new HttpParams()
            .set('page_size', '30')
            .set('key', key.trim());
        return this.http.get<{ data: CouponMenuOption[] }>(`${env.API_BASE_URL}/admin/menus`, { params });
    }

    fetchCategories(): Observable<{ data: CouponCategoryOption[] }> {
        return this.http.get<{ data: CouponCategoryOption[] }>(`${env.API_BASE_URL}/admin/menu/categories`);
    }

    create(body: {
        code?: string;
        auto_generate_code?: boolean;
        discount_percent: number;
        is_active?: boolean;
        note?: string | null;
        usage_limit?: number | null;
        expires_at?: string | null;
        assigned_user_ids?: number[];
        menu_ids?: number[];
        category_ids?: number[];
    }): Observable<{ data: AdminCouponRow; message: string }> {
        return this.http.post<{ data: AdminCouponRow; message: string }>(`${env.API_BASE_URL}/admin/coupons`, body, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        });
    }

    update(
        id: number,
        body: {
            code?: string;
            discount_percent?: number;
            is_active?: boolean;
            note?: string | null;
            usage_limit?: number | null;
            expires_at?: string | null;
            assigned_user_ids?: number[];
            menu_ids?: number[];
            category_ids?: number[];
        },
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
