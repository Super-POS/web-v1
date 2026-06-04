import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';
import { ExchangeRateSettingService } from 'helper/services/exchange-rate-setting/exchange-rate-setting.service';
import {
    ErpCloneResult,
    ErpCostHistory,
    ErpRecipeCostItem,
    ErpRecipeSummary,
    ErpSnapshotResult,
} from './interface';

@Injectable({ providedIn: 'root' })
export class ErpRecipeCostingService {
    private base = `${env.API_BASE_URL}/erp/recipe-costing`;

    constructor(
        private http: HttpClient,
        private exchange: ExchangeRateSettingService,
    ) {}

    /** Convert a KHR amount to USD using the live exchange rate. */
    khrToUsd(khr: number | null | undefined): number {
        return this.exchange.khrToUsd(khr);
    }

    get khrPerUsd(): number {
        return this.exchange.khrPerUsd;
    }

    listAll(): Observable<{ data: ErpRecipeCostItem[] }> {
        return this.http.get<{ data: ErpRecipeCostItem[] }>(this.base);
    }

    getSummary(): Observable<{ data: ErpRecipeSummary }> {
        return this.http.get<{ data: ErpRecipeSummary }>(`${this.base}/summary`);
    }

    getDetail(menuId: number): Observable<{ data: ErpRecipeCostItem }> {
        return this.http.get<{ data: ErpRecipeCostItem }>(`${this.base}/${menuId}`);
    }

    getCostHistory(menuId: number): Observable<ErpCostHistory> {
        return this.http.get<ErpCostHistory>(`${this.base}/${menuId}/history`);
    }

    cloneRecipe(menuId: number, targetMenuId: number): Observable<ErpCloneResult> {
        return this.http.post<ErpCloneResult>(`${this.base}/${menuId}/clone/${targetMenuId}`, {});
    }

    snapshotCosts(): Observable<ErpSnapshotResult> {
        return this.http.post<ErpSnapshotResult>(`${this.base}/snapshot`, {});
    }
}
