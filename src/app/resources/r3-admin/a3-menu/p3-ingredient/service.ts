import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { env } from 'envs/env';
import {
    IngredientCreatePayload,
    IngredientItem,
    IngredientResponse,
    IngredientUpdatePayload,
} from './interface';

@Injectable({
    providedIn: 'root',
})
export class ProductIngredientService {
    private _httpOptions = {
        headers: new HttpHeaders().set('Content-Type', 'application/json'),
    };

    constructor(private _httpClient: HttpClient) {}

    getData(): Observable<IngredientResponse> {
        return this._httpClient.get<IngredientResponse>(`${env.API_BASE_URL}/admin/menu/ingredients`, {
            headers: this._httpOptions.headers,
        });
    }

    create(body: IngredientCreatePayload): Observable<{ data: IngredientItem; message: string }> {
        return this._httpClient.post<{ data: IngredientItem; message: string }>(
            `${env.API_BASE_URL}/admin/menu/ingredients`,
            body,
            this._httpOptions
        );
    }

    update(id: number, body: IngredientUpdatePayload): Observable<{ data: IngredientItem; message: string }> {
        return this._httpClient.put<{ data: IngredientItem; message: string }>(
            `${env.API_BASE_URL}/admin/menu/ingredients/${id}`,
            body,
            this._httpOptions
        );
    }

    delete(id: number): Observable<{ message: string }> {
        return this._httpClient.delete<{ message: string }>(`${env.API_BASE_URL}/admin/menu/ingredients/${id}`, {
            headers: this._httpOptions.headers,
        });
    }
}
