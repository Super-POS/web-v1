// ================================================================>> Core Library (Angular)
import { HttpClient }           from '@angular/common/http';
import { inject, Injectable }   from '@angular/core';

// ================================================================>> Third-Party Library (RxJS)
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';

// ================================================================>> Custom Library
import { env }  from 'envs/env';
import { LoadingSpinnerService } from 'helper/shared/loading/service';
import { Data, Detail, List } from './interface';

function mapUiPlatformFilterToChannel(platform: string | null | undefined): string | undefined {
    if (platform == null) return undefined;
    if (platform === 'Web') return 'website';
    if (platform === 'Mobile') return 'telegram';
    return platform;
}

function detailWithProduct(d: any): Detail {
    return {
        ...d,
        product: d?.product || d?.menu,
    } as Detail;
}

function legacyPlatformFromChannel(channel: string | undefined): string {
    if (!channel) return 'Unknown';
    if (channel === 'website') return 'Web';
    if (channel === 'walk_in') return 'POS';
    if (channel === 'telegram') return 'Telegram';
    return 'Unknown';
}

function resolveOrderChannel(o: any): string | undefined {
    if (o?.channel) return o.channel;
    if (o?.platform === 'Web') return 'website';
    if (o?.platform === 'Mobile') return 'telegram';
    if (o?.platform === 'POS') return 'walk_in';
    return undefined;
}

function normalizeSaleRow(o: any): Data {
    const details = (o?.orderDetails || o?.details || []).map((d: any) => detailWithProduct(d));
    const ch = resolveOrderChannel(o);
    return {
        ...o,
        details,
        orderDetails: o?.orderDetails,
        channel: ch,
        platform: legacyPlatformFromChannel(ch),
    } as Data;
}

@Injectable({
    providedIn: 'root',
})
export class SaleService {

    constructor(private httpClient: HttpClient) { }

    // Method to fetch a list of sales from the POS system
    setup(): Observable<{ data: { id: number, name: string }[] }> {
        return this.httpClient.get<{ data: { id: number, name: string }[] }>(`${env.API_BASE_URL}/cashier/sales/setup`);
    }

    // Method to fetch a list of sales from the POS system
    private loadingSpinner = inject(LoadingSpinnerService);
    getData(params?: {
        page: number;
        limit: number;
        key?: string;
        timeType?: string;
        platform?: string;
        cashier?: number;
        startDate?: string;
        endDate?: string;
    }): Observable<List> {
        const filteredParams: { [key: string]: any } = {};
        Object.keys(params || {}).forEach(key => {
            if (params![key] === null || params![key] === undefined) {
                return;
            }
            if (key === 'platform') {
                const ch = mapUiPlatformFilterToChannel(params!.platform);
                if (ch) {
                    filteredParams['channel'] = ch;
                }
                return;
            }
            filteredParams[key] = params![key];
        });

        return this.httpClient.get<List>(`${env.API_BASE_URL}/cashier/sales`, { params: filteredParams }).pipe(
            map((response: List) => ({
                ...response,
                data: (response.data || []).map((row) => normalizeSaleRow(row)),
            })),
            switchMap((response: List) => {
                this.loadingSpinner.open();
                return of(response);
            }),
            catchError((error) => {
                this.loadingSpinner.close();
                return new Observable(observer => {
                    observer.error(error);
                    observer.complete();
                });
            }),
            tap((_response: List) => {
                this.loadingSpinner.close();
            })
        );
    }

    // Method to deleted a sale
    delete(id: number = 0): Observable<{ status_code: number, message: string }> {
        return this.httpClient.delete<{ status_code: number, message: string }>(`${env.API_BASE_URL}/cashier/sales/${id}`);
    }
}
