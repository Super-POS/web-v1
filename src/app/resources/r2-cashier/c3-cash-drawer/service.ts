import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';
import { CashDrawerResponse, MakeChangeBody, MakeChangeResponse } from './interface';

@Injectable({ providedIn: 'root' })
export class CashierCashDrawerService {

    constructor(private http: HttpClient) {}

    getCurrent(): Observable<CashDrawerResponse> {
        return this.http.get<CashDrawerResponse>(`${env.API_BASE_URL}/cashier/cash-drawer`);
    }

    makeChange(body: MakeChangeBody): Observable<MakeChangeResponse> {
        return this.http.post<MakeChangeResponse>(`${env.API_BASE_URL}/cashier/cash-drawer/change`, body);
    }
}
