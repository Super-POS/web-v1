import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { env } from 'envs/env';
import {
    IngredientCreatePayload,
    IngredientItem,
    IngredientResponse,
    IngredientRestockPayload,
    IngredientUpdatePayload,
} from './interface';

@Injectable({
    providedIn: 'root',
})
export class MenuIngredientService {
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

    getRestockList(): Observable<IngredientResponse> {
        return this._httpClient.get<IngredientResponse>(`${env.API_BASE_URL}/admin/menu/ingredients/restock/list`, {
            headers: this._httpOptions.headers,
        });
    }

    restock(id: number, body: IngredientRestockPayload): Observable<{ data: IngredientItem; message: string }> {
        return this._httpClient.post<{ data: IngredientItem; message: string }>(
            `${env.API_BASE_URL}/admin/menu/ingredients/${id}/restock`,
            body,
            this._httpOptions
        );
    }
}
