import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { env } from 'envs/env';
import { IncomingWebsiteOrder, IncomingWebsiteResponse } from './interface';

/** Manage endpoints under `/cashier/orders` — website incoming queue + accept / cancel. */
@Injectable({
    providedIn: 'root',
})
export class IncomingWebOrdersService {
    constructor(private readonly httpClient: HttpClient) {}

    private headers(): HttpHeaders {
        return new HttpHeaders().set('Content-Type', 'application/json');
    }

    list(): Observable<IncomingWebsiteResponse> {
        return this.httpClient.get<IncomingWebsiteResponse>(
            `${env.API_BASE_URL}/cashier/orders/incoming-website`,
            { headers: this.headers() },
        );
    }

    /** pending → preparing */
    accept(orderId: number): Observable<{ data: IncomingWebsiteOrder; message: string }> {
        return this.httpClient.patch<{ data: IncomingWebsiteOrder; message: string }>(
            `${env.API_BASE_URL}/cashier/orders/${orderId}/accept`,
            {},
            { headers: this.headers() },
        );
    }

    /** deny — cancel order (allowed while awaiting_payment or pending, etc.). */
    deny(orderId: number): Observable<{ data: IncomingWebsiteOrder; message: string }> {
        return this.httpClient.patch<{ data: IncomingWebsiteOrder; message: string }>(
            `${env.API_BASE_URL}/cashier/orders/${orderId}/cancel`,
            {},
            { headers: this.headers() },
        );
    }
}
