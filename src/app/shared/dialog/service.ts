import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable }   from '@angular/core';
import { env }          from 'envs/env';
import { Observable }   from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DetailsService {

    constructor(private httpClient: HttpClient) { }

    // Method to fetch a list of products from the POS system
    download(id: number): Observable<{ statsu_code: number, data: string }> {
        return this.httpClient.get<{ statsu_code: number, data: string }>(`${env.API_BASE_URL}/share/print/order-invoice/${id}`, {
            headers: new HttpHeaders().set('Content-Type', 'application/json')
        });
    }
}
