import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';
import { ErpRecipeCostItem, ErpRecipeSummary } from './interface';

@Injectable({ providedIn: 'root' })
export class ErpRecipeCostingService {
    private base = `${env.API_BASE_URL}/erp/recipe-costing`;

    constructor(private http: HttpClient) {}

    listAll(): Observable<{ data: ErpRecipeCostItem[] }> {
        return this.http.get<{ data: ErpRecipeCostItem[] }>(this.base);
    }

    getSummary(): Observable<{ data: ErpRecipeSummary }> {
        return this.http.get<{ data: ErpRecipeSummary }>(`${this.base}/summary`);
    }

    getDetail(menuId: number): Observable<{ data: ErpRecipeCostItem }> {
        return this.http.get<{ data: ErpRecipeCostItem }>(`${this.base}/${menuId}`);
    }
}
