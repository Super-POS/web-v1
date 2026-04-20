// ================================================================>> Core Library (Angular)
import { HttpClient, HttpHeaders, HttpParams }           from '@angular/common/http';
import { inject, Injectable }   from '@angular/core';

// ================================================================>> Third-Party Library (RxJS)
import { catchError, Observable, of, switchMap, tap } from 'rxjs';

// ================================================================>> Custom Library
import { env }                          from 'envs/env';
import { LoadingSpinnerService }        from 'helper/shared/loading/service';
import { List }                         from './interface';
import { DataSaleResponse } from '../a1-dashboard/interface';


@Injectable({
    providedIn: 'root',
})
export class SaleService {

    constructor(private httpClient: HttpClient) { }
    private loadingSpinner = inject(LoadingSpinnerService);
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

    //Method to delete data
    delete(id: number = 0): Observable<{ status_code: number, message: string }> {
        return this.httpClient.delete<{ status_code: number, message: string }>(`${env.API_BASE_URL}/admin/sales/${id}`);
    }

    // Method to fetch product report
    downloadReport(params): Observable<any> {
        // const params = new HttpParams()
        return this.httpClient.get<DataSaleResponse>(`${env.API_BASE_URL}/share/report/generate-sale-report`, { params });
    }

}
