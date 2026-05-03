import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { env } from 'envs/env';

@Injectable({
    providedIn: 'root',
})
export class ExchangeRateSettingService {
    static readonly FALLBACK_KHR_PER_USD = 4100;

    private readonly _httpOptions = {
        headers: new HttpHeaders({
            'Content-type': 'application/json',
            withCredentials: 'true',
        } as Record<string, string>),
    };

    private readonly _khrPerUsd = new BehaviorSubject<number>(ExchangeRateSettingService.FALLBACK_KHR_PER_USD);

    readonly khrPerUsd$ = this._khrPerUsd.asObservable();

    constructor(private readonly _http: HttpClient) {}

    get khrPerUsd(): number {
        return this._khrPerUsd.value;
    }

    static khrToUsd(khr: number | null | undefined, rate: number): number {
        const k = Number(khr ?? 0);
        const r = Number(rate);
        if (!Number.isFinite(k) || !Number.isFinite(r) || r <= 0) {
            return 0;
        }
        return Math.round((k / r) * 10000) / 10000;
    }

    static usdToKhr(usd: number | null | undefined, rate: number): number {
        const u = Number(usd ?? 0);
        const r = Number(rate);
        if (!Number.isFinite(u) || !Number.isFinite(r) || r <= 0) {
            return 0;
        }
        return Math.round(u * r);
    }

    khrToUsd(khr: number | null | undefined, rate?: number): number {
        return ExchangeRateSettingService.khrToUsd(khr, rate ?? this.khrPerUsd);
    }

    usdToKhr(usd: number | null | undefined, rate?: number): number {
        return ExchangeRateSettingService.usdToKhr(usd, rate ?? this.khrPerUsd);
    }

    fetchAdmin(): Observable<{ data: { khr_per_usd: number }; message?: string }> {
        return this._http
            .get<{ data: { khr_per_usd: number }; message?: string }>(
                `${env.API_BASE_URL}/admin/exchange-rate`,
                this._httpOptions,
            )
            .pipe(
                tap((res) => {
                    const v = Number(res?.data?.khr_per_usd);
                    if (Number.isFinite(v) && v > 0) {
                        this._khrPerUsd.next(v);
                    }
                }),
            );
    }

    patchAdmin(khr_per_usd: number): Observable<{ data: { khr_per_usd: number }; message?: string }> {
        return this._http.patch<{ data: { khr_per_usd: number }; message?: string }>(
            `${env.API_BASE_URL}/admin/exchange-rate`,
            { khr_per_usd },
            this._httpOptions,
        ).pipe(
            tap((res) => {
                const v = Number(res?.data?.khr_per_usd);
                if (Number.isFinite(v) && v > 0) {
                    this._khrPerUsd.next(v);
                }
            }),
        );
    }

    fetchCashier(): Observable<{ data: { khr_per_usd: number }; message?: string }> {
        return this._http
            .get<{ data: { khr_per_usd: number }; message?: string }>(
                `${env.API_BASE_URL}/cashier/exchange-rate`,
                this._httpOptions,
            )
            .pipe(
                tap((res) => {
                    const v = Number(res?.data?.khr_per_usd);
                    if (Number.isFinite(v) && v > 0) {
                        this._khrPerUsd.next(v);
                    }
                }),
            );
    }
}
