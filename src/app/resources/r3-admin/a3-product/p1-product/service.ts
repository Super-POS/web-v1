// ================================================================>> Core Library (Angular)
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams }   from '@angular/common/http';
import * as core                                                    from '@angular/core';

// ================================================================>> Third party Library
import { Observable, catchError, of, switchMap, throwError }        from 'rxjs';

// ================================================================>> Custom Library (Application-specific)
import { env } from 'envs/env';


import { DataSaleResponse }          from '../../a1-dashboard/interface';
import { Data, List, RecipeItem, SetupResponse } from './interface';

@core.Injectable({
    providedIn: 'root',
})

export class ProductService {

    private _httpOptions = {
        headers: new HttpHeaders({
            'Content-type': 'application/json',
            'withCredentials': 'true',
        }),
    };

    constructor(private httpClient: HttpClient) { };

    private normalizeProductPayload(
        body: { code: string; name: string; type_id: number; unit_price: number; stock?: number; image?: string; recipe?: RecipeItem[] },
        isUpdate: boolean = false
    ): { code: string; name: string; type_id: number; unit_price: number; image?: string } {
        const payload: { code: string; name: string; type_id: number; unit_price: number; image?: string } = {
            code: body.code,
            name: body.name,
            type_id: body.type_id,
            unit_price: body.unit_price,
        };

        if (!isUpdate || body.image) {
            payload.image = body.image;
        }

        return payload;
    }

    // Method to fetch setup data
    getSetupData(){
        return this.httpClient.get<SetupResponse>(`${env.API_BASE_URL}/admin/products/setup-data`, this._httpOptions);
    }

    // Method to fetch all products
    getData(params = null){
        return this.httpClient.get<List>(`${env.API_BASE_URL}/admin/products`, { headers: this._httpOptions.headers, params });
    }

    // Method to create a new product
    create(body: { code: string, name: string, type_id: number, unit_price: number, stock?: number, image: string, recipe?: RecipeItem[] }): Observable<{ data: Data, message: string }> {
        const payload = this.normalizeProductPayload(body);
        return this.httpClient.post<{ data: Data, message: string }>(`${env.API_BASE_URL}/admin/products`, payload, {
            headers: new HttpHeaders().set('Content-Type', 'application/json')
        });
    }

    // Method to update an existing product
    update(id: number, body: { code: string, name: string, type_id: number, unit_price: number, stock?: number, image?: string, recipe?: RecipeItem[] }): Observable<{ data: Data, message: string }> {
        const payload = this.normalizeProductPayload(body, true);
        return this.httpClient.put<{ data: Data, message: string }>(`${env.API_BASE_URL}/admin/products/${id}`, payload, {
            headers: new HttpHeaders().set('Content-Type', 'application/json')
        });
    }

    // Method to delete a product by ID
    delete(id: number = 0): Observable<{ status_code: number, message: string }> {
        return this.httpClient.delete<{ status_code: number, message: string }>(`${env.API_BASE_URL}/admin/products/${id}`);
    }

    // Method to fetch product report
    getDataProductReport(params = {}): Observable<any> {
        // const params = new HttpParams()
        return this.httpClient.get<DataSaleResponse>(`${env.API_BASE_URL}/share/report/generate-product-report`, { params });
    }

    // downloadReportExcel(): Observable<any> {
    //     const params = new HttpParams()
    //     return this.httpClient.get(`${env.API_BASE_URL}/share/report/product-excel`, { params});
    // }

    // Method to fetch product by ID
    view(id: number): Observable<any> {
        return this.httpClient.get<any>(`${env.API_BASE_URL}/admin/products/${id}`);
    }
}
