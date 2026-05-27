import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';
import { ErpExpense, ErpExpenseCategory, ErpPlReport } from './interface';

@Injectable({ providedIn: 'root' })
export class ErpPlService {
    private base = `${env.API_BASE_URL}/erp/pl`;

    constructor(private http: HttpClient) {}

    // ── Expense Categories ─────────────────────────────────────────────────────

    listCategories(): Observable<{ data: ErpExpenseCategory[] }> {
        return this.http.get<{ data: ErpExpenseCategory[] }>(`${this.base}/expense-categories`);
    }

    createCategory(body: { name: string; type: string; description?: string }): Observable<{ data: ErpExpenseCategory; message: string }> {
        return this.http.post<{ data: ErpExpenseCategory; message: string }>(`${this.base}/expense-categories`, body);
    }

    updateCategory(id: number, body: Partial<ErpExpenseCategory>): Observable<{ data: ErpExpenseCategory; message: string }> {
        return this.http.patch<{ data: ErpExpenseCategory; message: string }>(`${this.base}/expense-categories/${id}`, body);
    }

    deleteCategory(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.base}/expense-categories/${id}`);
    }

    // ── Expenses ───────────────────────────────────────────────────────────────

    listExpenses(params: { start_date?: string; end_date?: string; category_id?: number } = {}): Observable<{ data: ErpExpense[] }> {
        let httpParams = new HttpParams();
        if (params.start_date)          { httpParams = httpParams.set('start_date', params.start_date); }
        if (params.end_date)            { httpParams = httpParams.set('end_date', params.end_date); }
        if (params.category_id != null) { httpParams = httpParams.set('category_id', String(params.category_id)); }
        return this.http.get<{ data: ErpExpense[] }>(`${this.base}/expenses`, { params: httpParams });
    }

    createExpense(body: Partial<ErpExpense>): Observable<{ data: ErpExpense; message: string }> {
        return this.http.post<{ data: ErpExpense; message: string }>(`${this.base}/expenses`, body);
    }

    deleteExpense(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.base}/expenses/${id}`);
    }

    // ── Report ─────────────────────────────────────────────────────────────────

    getReport(params: { start_date: string; end_date: string }): Observable<{ data: ErpPlReport }> {
        let httpParams = new HttpParams()
            .set('start_date', params.start_date)
            .set('end_date', params.end_date);
        return this.http.get<{ data: ErpPlReport }>(`${this.base}/report`, { params: httpParams });
    }
}
