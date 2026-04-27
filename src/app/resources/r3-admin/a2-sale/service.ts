// ================================================================>> Core Library (Angular)
import { HttpClient, HttpHeaders, HttpParams }           from '@angular/common/http';
import { Injectable }   from '@angular/core';

// ================================================================>> Third-Party Library (RxJS)
import { catchError, Observable } from 'rxjs';

// ================================================================>> Custom Library
import { env }                          from 'envs/env';
import { List }                         from './interface';
import { DataSaleResponse } from '../a1-dashboard/interface';
import { Data } from './interface';


@Injectable({
    providedIn: 'root',
})
export class SaleService {

    constructor(private httpClient: HttpClient) { }
    private _httpOptions = {
        headers: new HttpHeaders({
            'Content-type': 'application/json',
            'withCredentials': 'true',
        }),
    };



    //Method to get setup data
    getSetupData(): Observable<{ data: { id: number, name: string }[] }> {
        return this.httpClient.get<{ data: { id: number, name: string }[] }>(`${env.API_BASE_URL}/admin/sales/setup`);
    }

    //Method to get data
    // getData(params?: {
    //     page: number;
    //     page_size: number;
    //     key?: string;
    //     timeType?: string;
    //     platform?: string;
    //     cashier?: number;
    //     from?: string;
    //     to?: string;
    // }): Observable<List> {

    //     // Filter out null or undefined parameters
    //     const filteredParams: { [key: string]: any } = {};
    //     Object.keys(params || {}).forEach(key => {
    //         if (params![key] !== null && params![key] !== undefined) {
    //             filteredParams[key] = params![key];
    //         }
    //     });

    //     return this.httpClient.get<List>(`${env.API_BASE_URL}/admin/sales`, { params: filteredParams }).pipe(
    //         switchMap((response: List) => {
    //             this.loadingSpinner.open();
    //             return of(response);
    //         }),
    //         catchError((error) => {
    //             this.loadingSpinner.close();
    //             return new Observable(observer => {
    //                 observer.error(error);
    //                 observer.complete();
    //             });
    //         }),
    //         tap((_response: List) => {
    //             this.loadingSpinner.close();
    //         })
    //     );
    // }
    // Method to fetch all products
    getData(params = null){
        return this.httpClient.get<List>(`${env.API_BASE_URL}/admin/sales`, { headers: this._httpOptions.headers, params });
    }

    /** CSV export with same filters as list (no pagination). */
    exportCsv(params: Record<string, string | number>): Observable<Blob> {
        let httpParams = new HttpParams();
        Object.keys(params).forEach((k) => {
            const v = params[k];
            if (v !== undefined && v !== null && v !== '' && v !== 0) {
                httpParams = httpParams.set(k, String(v));
            }
        });
        return this.httpClient.get(`${env.API_BASE_URL}/admin/sales/export/csv`, {
            params: httpParams,
            responseType: 'blob',
        });
    }

    //Method to delete data
    delete(id: number = 0): Observable<{ status_code: number, message: string }> {
        return this.httpClient.delete<{ status_code: number, message: string }>(`${env.API_BASE_URL}/admin/sales/${id}`);
    }

    // Fetch one invoice detail for drawer view (admin first, then cashier fallback)
    view(id: number): Observable<{ data: Data }> {
        return this.httpClient.get<{ data: Data }>(`${env.API_BASE_URL}/admin/sales/${id}/view`).pipe(
            catchError(() =>
                this.httpClient.get<{ data: Data }>(`${env.API_BASE_URL}/cashier/sales/${id}/view`),
            ),
        );
    }

    // Method to fetch product report
    downloadReport(params): Observable<any> {
        // const params = new HttpParams()
        return this.httpClient.get<DataSaleResponse>(`${env.API_BASE_URL}/share/report/generate-sale-report`, { params });
    }

}
