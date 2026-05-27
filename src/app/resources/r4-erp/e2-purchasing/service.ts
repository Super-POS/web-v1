import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';
import { ErpPurchaseOrder, ErpSupplier } from './interface';

@Injectable({ providedIn: 'root' })
export class ErpPurchasingService {
    private base = `${env.API_BASE_URL}/erp/purchasing`;

    constructor(private http: HttpClient) {}

    // ── Suppliers ──────────────────────────────────────────────────────────────

    listSuppliers(): Observable<{ data: ErpSupplier[] }> {
        return this.http.get<{ data: ErpSupplier[] }>(`${this.base}/suppliers`);
    }

    getSupplier(id: number): Observable<{ data: ErpSupplier }> {
        return this.http.get<{ data: ErpSupplier }>(`${this.base}/suppliers/${id}`);
    }

    createSupplier(body: Partial<ErpSupplier>): Observable<{ data: ErpSupplier; message: string }> {
        return this.http.post<{ data: ErpSupplier; message: string }>(`${this.base}/suppliers`, body);
    }

    updateSupplier(id: number, body: Partial<ErpSupplier>): Observable<{ data: ErpSupplier; message: string }> {
        return this.http.patch<{ data: ErpSupplier; message: string }>(`${this.base}/suppliers/${id}`, body);
    }

    // ── Purchase Orders ────────────────────────────────────────────────────────

    listPurchaseOrders(params: { supplier_id?: number; status?: string } = {}): Observable<{ data: ErpPurchaseOrder[] }> {
        let httpParams = new HttpParams();
        if (params.supplier_id != null) { httpParams = httpParams.set('supplier_id', String(params.supplier_id)); }
        if (params.status)              { httpParams = httpParams.set('status', params.status); }
        return this.http.get<{ data: ErpPurchaseOrder[] }>(`${this.base}/purchase-orders`, { params: httpParams });
    }

    getPurchaseOrder(id: number): Observable<{ data: ErpPurchaseOrder }> {
        return this.http.get<{ data: ErpPurchaseOrder }>(`${this.base}/purchase-orders/${id}`);
    }

    createPurchaseOrder(body: Partial<ErpPurchaseOrder>): Observable<{ data: ErpPurchaseOrder; message: string }> {
        return this.http.post<{ data: ErpPurchaseOrder; message: string }>(`${this.base}/purchase-orders`, body);
    }

    updatePOStatus(id: number, body: { status: string }): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.base}/purchase-orders/${id}/status`, body);
    }

    receiveGoods(id: number, body: { received_date: string; notes?: string; items: { item_id: number; received_quantity: number }[] }): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.base}/purchase-orders/${id}/receive`, body);
    }
}
