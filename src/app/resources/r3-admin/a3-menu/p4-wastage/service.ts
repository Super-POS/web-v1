import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { env } from 'envs/env';
import {
    IngredientOption,
    IngredientWastageListResponse,
    IngredientWastageRecord,
    RecipeOption,
    RecipeWastageListResponse,
    RecipeWastageRecord,
    RecordIngredientWastagePayload,
    RecordRecipeWastagePayload,
} from './interface';

@Injectable({ providedIn: 'root' })
export class MenuWastageService {
    private _headers = new HttpHeaders().set('Content-Type', 'application/json');

    constructor(private _http: HttpClient) {}

    // ── Ingredient options (for the record dialog dropdown) ───────────────────
    getIngredientOptions(): Observable<{ data: IngredientOption[] }> {
        return this._http.get<{ data: IngredientOption[] }>(
            `${env.API_BASE_URL}/admin/menu/ingredients`,
            { headers: this._headers }
        );
    }

    // ── Ingredient wastage list ────────────────────────────────────────────────
    getIngredientWastages(): Observable<IngredientWastageListResponse> {
        return this._http.get<IngredientWastageListResponse>(
            `${env.API_BASE_URL}/admin/wastages/ingredients`,
            { headers: this._headers }
        );
    }

    // ── Record ingredient wastage ─────────────────────────────────────────────
    recordIngredientWastage(body: RecordIngredientWastagePayload): Observable<{ data: IngredientWastageRecord; message: string }> {
        return this._http.post<{ data: IngredientWastageRecord; message: string }>(
            `${env.API_BASE_URL}/admin/wastages/ingredients`,
            body,
            { headers: this._headers }
        );
    }

    // ── Recipe options (for the record dialog dropdown) ───────────────────────
    // Uses the same endpoint as p1-menu: GET /admin/menus (returns paginated list)
    getRecipeOptions(): Observable<{ data: RecipeOption[] }> {
        return this._http.get<{ data: RecipeOption[]; pagination: unknown }>(
            `${env.API_BASE_URL}/admin/menus`,
            { headers: this._headers, params: { limit: '500', page: '1' } }
        );
    }

    // ── Recipe wastage list ───────────────────────────────────────────────────
    getRecipeWastages(): Observable<RecipeWastageListResponse> {
        return this._http.get<RecipeWastageListResponse>(
            `${env.API_BASE_URL}/admin/wastages/recipes`,
            { headers: this._headers }
        );
    }

    // ── Record recipe wastage ─────────────────────────────────────────────────
    recordRecipeWastage(body: RecordRecipeWastagePayload): Observable<{ data: RecipeWastageRecord; message: string }> {
        return this._http.post<{ data: RecipeWastageRecord; message: string }>(
            `${env.API_BASE_URL}/admin/wastages/recipes`,
            body,
            { headers: this._headers }
        );
    }
}
