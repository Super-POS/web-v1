// ================================================================>> Core Library (Angular)
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams }   from '@angular/common/http';
import * as core                                                    from '@angular/core';

// ================================================================>> Third party Library
import { Observable, catchError, map, of, switchMap, throwError }        from 'rxjs';

// ================================================================>> Custom Library (Application-specific)
import { env } from 'envs/env';


import { DataSaleResponse }          from '../../a1-dashboard/interface';
import { Data, List, SetupResponse } from './interface';

@core.Injectable({
    providedIn: 'root',
})

export class MenuService {

    private _httpOptions = {
        headers: new HttpHeaders({
            'Content-type': 'application/json',
            'withCredentials': 'true',
        }),
    };

    constructor(private httpClient: HttpClient) { };

    // Method to fetch setup data (API returns menuTypes; UI uses productTypes)
    getSetupData(){
        return this.httpClient.get<SetupResponse & { menuTypes?: { id: number; name: string }[] }>(
            `${env.API_BASE_URL}/admin/menus/setup-data`, this._httpOptions,
        ).pipe(
            map((res) => ({
                ...res,
                productTypes: (res as { productTypes?: { id: number; name: string }[] }).productTypes
                    ?? (res as { menuTypes?: { id: number; name: string }[] }).menuTypes
                    ?? [],
            })),
        );
    }

    // Method to fetch all products
    getData(params = null){
        return this.httpClient.get<List>(`${env.API_BASE_URL}/admin/menus`, { headers: this._httpOptions.headers, params });
    }

    // CreateMenuDto requires recipes (empty array = no stock depletion per recipe)
    create(body: {
        code: string;
        name: string;
        type_id: number;
        image: string;
        unit_price: number;
        recipes?: { ingredient_id: number; quantity: number }[];
    }): Observable<{ data: Data, message: string }> {
        const payload = { ...body, recipes: body.recipes ?? [] };
        return this.httpClient.post<{ data: Data, message: string }>(`${env.API_BASE_URL}/admin/menus`, payload, {
            headers: new HttpHeaders().set('Content-Type', 'application/json')
        });
    }

    // Method to update an existing product
    update(id: number, body: {
        code: string;
        name: string;
        type_id: number;
        image?: string;
        unit_price: number;
        recipes?: { ingredient_id: number; quantity: number }[];
    }): Observable<{ data: Data, message: string }> {
        return this.httpClient.put<{ data: Data, message: string }>(`${env.API_BASE_URL}/admin/menus/${id}`, body, {
            headers: new HttpHeaders().set('Content-Type', 'application/json')
        });
    }

    // Method to delete a product by ID
    delete(id: number = 0): Observable<{ status_code: number, message: string }> {
        return this.httpClient.delete<{ status_code: number, message: string }>(`${env.API_BASE_URL}/admin/menus/${id}`);
    }

    // Toggle availability on/off
    toggleAvailability(id: number, is_available: boolean): Observable<{ data: Data; message: string }> {
        return this.httpClient.patch<{ data: Data; message: string }>(
            `${env.API_BASE_URL}/admin/menus/${id}/availability`,
            { is_available },
            { headers: new HttpHeaders().set('Content-Type', 'application/json') }
        );
    }

    // Method to fetch product report
    getDataMenuReport(params = {}): Observable<any> {
        // const params = new HttpParams()
        return this.httpClient.get<DataSaleResponse>(`${env.API_BASE_URL}/share/report/generate-menu-report`, { params });
    }

    // downloadReportExcel(): Observable<any> {
    //     const params = new HttpParams()
    //     return this.httpClient.get(`${env.API_BASE_URL}/share/report/product-excel`, { params});
    // }

    // Method to fetch product by ID
    view(id: number): Observable<any> {
        return this.httpClient.get<any>(`${env.API_BASE_URL}/admin/menus/${id}`);
    }
}
