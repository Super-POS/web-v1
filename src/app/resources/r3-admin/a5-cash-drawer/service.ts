import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';
import { CashDrawerResponse, DepositBody, TransactionLogsResponse } from './interface';

@Injectable({ providedIn: 'root' })
export class AdminCashDrawerService {

    constructor(private http: HttpClient) {}

    getCurrent(): Observable<CashDrawerResponse> {
        return this.http.get<CashDrawerResponse>(`${env.API_BASE_URL}/admin/cash-drawer`);
    }

    deposit(body: DepositBody): Observable<{ status_code: number; message: string }> {
        return this.http.post<{ status_code: number; message: string }>(`${env.API_BASE_URL}/admin/cash-drawer/deposit`, body);
    }

    getLogs(page: number = 1, limit: number = 20): Observable<TransactionLogsResponse> {
        return this.http.get<TransactionLogsResponse>(`${env.API_BASE_URL}/admin/cash-drawer/logs`, {
            params: { page: page.toString(), limit: limit.toString() }
        });
    }
}
