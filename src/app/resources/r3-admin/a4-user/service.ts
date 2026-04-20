// ================================================================================>> Core Library
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

// ================================================================================>> Thrid Party Library
// RxJS
import { BehaviorSubject, Observable, catchError, delayWhen, throwError, timer } from 'rxjs';

// ================================================================================>> Custom Library
// Environment
import { env } from 'envs/env';

// Local
import { DataSaleResponse } from '../a1-dashboard/interface';
import { List, PasswordReq, RequestCreateUser, RequestUserUpdate, ResponseUser } from './interface';

@Injectable({
    providedIn: 'root',
})
export class UserService {

    private _items: BehaviorSubject<List | null> = new BehaviorSubject(null);

    private url: string = env.API_BASE_URL;
    private httpOptions = {
        headers: new HttpHeaders().set('Content-Type', 'application/json'),
    };

    constructor(private httpClient: HttpClient) { }

    set items(value: List) {
        this._items.next(value);
    }
    get items$(): Observable<List> {
        return this._items.asObservable();
    }

    setup(): Observable<{ roles: { id: number; name: string }[] }> {
        return this.httpClient.get<{ roles: { id: number; name: string }[] }>(`${env.API_BASE_URL}/admin/users/setup`);
    }

    getData(params?: {
        page: number; page_size: number; key?: string, type?: number;
        startDate?: string;
        endDate?: string;
    }): Observable<List> {
        // Record the request start time
        const requestStartTime = Date.now();

        // Filter out null and undefined parameters
        const filteredParams: { [key: string]: any } = {};
        Object.keys(params || {}).forEach(key => {
            if (params![key] !== null && params![key] !== undefined) {
                filteredParams[key] = params![key];
            }
        });

        return this.httpClient.get<List>(`${env.API_BASE_URL}/admin/users`, { params: filteredParams }).pipe(
            // Only add a delay if the request finishes in less than 1 second
            delayWhen(() => {
                const timeElapsed = Date.now() - requestStartTime;
                return timer(Math.max(0, 1000 - timeElapsed));
            }),
            catchError((error: HttpErrorResponse) => {
                console.error('Error occurred:', error);
                return throwError(() => error); // Use throwError to pass the error
            })
        );
    }

    view(id: number): Observable<any> {
        return this.httpClient.get<any>(`${env.API_BASE_URL}/admin/users/${id}`);
    }

    create(body: RequestCreateUser): Observable<ResponseUser> {
        return this.httpClient.post<ResponseUser>(`${env.API_BASE_URL}/admin/users`, body, this.httpOptions);
    }

    update(id: number, body: RequestUserUpdate): Observable<ResponseUser> {
        return this.httpClient.put<ResponseUser>(
            `${env.API_BASE_URL}/admin/users/${id}`,
            body,
            this.httpOptions
        );
    }

    delete(id: number): any {
        return this.httpClient.delete(`${env.API_BASE_URL}/admin/users/${id}`, this.httpOptions);
    }

    updateStatus(id: number = 0, body: { is_active: boolean }): Observable<{ statusCode: number, message: string }> {
        return this.httpClient.put<{ statusCode: number, message: string }>(`${this.url}/admin/users/status/${id}`, body, this.httpOptions);
    }

    updatePassword(id: number, body: PasswordReq): Observable<any> {
        return this.httpClient.put(`${env.API_BASE_URL}/admin/users/update-password/${id}`, body);
    }

    getDataCashierReport(): Observable<any> {
        const params = new HttpParams()
        return this.httpClient.get<DataSaleResponse>(`${env.API_BASE_URL}/share/report/cashier`, { params });
    }
}
