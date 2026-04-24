import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';
import { IngredientListResponse, IngredientRow } from './interface';

@Injectable({ providedIn: 'root' })
export class IngredientAdminService {
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  getList(): Observable<IngredientListResponse> {
    return this.http.get<IngredientListResponse>(`${env.API_BASE_URL}/admin/ingredients`, {
      headers: this.headers,
    });
  }

  update(
    id: number,
    body: { stock: number; low_stock_threshold?: number }
  ): Observable<{ data: IngredientRow; message: string }> {
    return this.http.put<{ data: IngredientRow; message: string }>(
      `${env.API_BASE_URL}/admin/ingredients/${id}`,
      body,
      { headers: this.headers }
    );
  }

  create(body: {
    name: string;
    unit: string;
    stock: number;
    low_stock_threshold?: number;
  }): Observable<{ data: IngredientRow; message: string }> {
    return this.http.post<{ data: IngredientRow; message: string }>(
      `${env.API_BASE_URL}/admin/ingredients`,
      body,
      { headers: this.headers }
    );
  }
}
