import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';
import { FinancialReportQuery, FinancialReportResponse } from './interface';

@Injectable({ providedIn: 'root' })
export class AdminFinanceService {
    constructor(private http: HttpClient) {}

    getReport(query: FinancialReportQuery): Observable<FinancialReportResponse> {
        let params = new HttpParams();
        const keys: (keyof FinancialReportQuery)[] = [
            'today',
            'yesterday',
            'thisWeek',
            'thisMonth',
            'thisYear',
            'threeMonthAgo',
            'sixMonthAgo',
            'from',
            'to',
            'granularity',
        ];
        for (const key of keys) {
            const value = query[key];
            if (value !== undefined && value !== null && value !== '') {
                params = params.set(key, String(value));
            }
        }
        return this.http.get<FinancialReportResponse>(`${env.API_BASE_URL}/admin/reports/financial`, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            params,
        });
    }
}
