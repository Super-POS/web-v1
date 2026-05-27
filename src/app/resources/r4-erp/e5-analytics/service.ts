import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';
import {
    ErpAnalyticsDashboard,
    ErpBestSeller,
    ErpPeakHour,
    ErpProfitByProduct,
    ErpSalesTrendPoint,
    ErpWasteItem,
} from './interface';

@Injectable({ providedIn: 'root' })
export class ErpAnalyticsService {
    private base = `${env.API_BASE_URL}/erp/analytics`;

    constructor(private http: HttpClient) {}

    getDashboard(params: { start_date: string; end_date: string }): Observable<{ data: ErpAnalyticsDashboard }> {
        const httpParams = new HttpParams()
            .set('start_date', params.start_date)
            .set('end_date', params.end_date);
        return this.http.get<{ data: ErpAnalyticsDashboard }>(`${this.base}/dashboard`, { params: httpParams });
    }

    getBestSellers(params: { start_date: string; end_date: string; limit?: number }): Observable<{ data: ErpBestSeller[] }> {
        let httpParams = new HttpParams()
            .set('start_date', params.start_date)
            .set('end_date', params.end_date);
        if (params.limit != null) { httpParams = httpParams.set('limit', String(params.limit)); }
        return this.http.get<{ data: ErpBestSeller[] }>(`${this.base}/best-sellers`, { params: httpParams });
    }

    getSalesTrend(params: { start_date: string; end_date: string; granularity: 'daily' | 'weekly' | 'monthly' }): Observable<{ data: ErpSalesTrendPoint[] }> {
        const httpParams = new HttpParams()
            .set('start_date', params.start_date)
            .set('end_date', params.end_date)
            .set('granularity', params.granularity);
        return this.http.get<{ data: ErpSalesTrendPoint[] }>(`${this.base}/sales-trend`, { params: httpParams });
    }

    getPeakHours(params: { start_date: string; end_date: string }): Observable<{ data: ErpPeakHour[] }> {
        const httpParams = new HttpParams()
            .set('start_date', params.start_date)
            .set('end_date', params.end_date);
        return this.http.get<{ data: ErpPeakHour[] }>(`${this.base}/peak-hours`, { params: httpParams });
    }

    getProfitByProduct(params: { start_date: string; end_date: string }): Observable<{ data: ErpProfitByProduct[] }> {
        const httpParams = new HttpParams()
            .set('start_date', params.start_date)
            .set('end_date', params.end_date);
        return this.http.get<{ data: ErpProfitByProduct[] }>(`${this.base}/profit-by-product`, { params: httpParams });
    }

    getWasteAnalysis(params: { start_date: string; end_date: string }): Observable<{ data: ErpWasteItem[] }> {
        const httpParams = new HttpParams()
            .set('start_date', params.start_date)
            .set('end_date', params.end_date);
        return this.http.get<{ data: ErpWasteItem[] }>(`${this.base}/waste-analysis`, { params: httpParams });
    }
}
