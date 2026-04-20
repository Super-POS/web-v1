import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { env } from 'envs/env';
import { Observable, of, switchMap } from 'rxjs';
import { ResponseLogin, ResponseSuccessfullLogin } from './interface';

@Injectable({ providedIn: 'root' })
export class AuthService {

    private _httpClient = inject(HttpClient);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------
    /**
     * Setter & getter for access token
     */
    set accessToken(token: string) {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string {
        return localStorage.getItem('accessToken') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign in
     *
     * @param credentials
    */
    // Method to sign in a user in the POS system
    signIn(credentials: { username: string; password: string; platform?: string }): Observable<ResponseLogin> {
        // Set default platform to "Web" if not provided
        const { username, password, platform = 'Web' } = credentials;

        const requestBody = {
            username,
            password,
            platform,
        };

        return this._httpClient.post<ResponseLogin>(`${env.API_BASE_URL}/account/auth/login`, requestBody).pipe(
            switchMap((response: ResponseLogin) => {
                this.accessToken = response.token; // Store the access token
                return of(response); // Return the response as a new observable
            }),
        );
    }

    checkExistUser(credentials: { username: string }): Observable<{ data: boolean; message: string }> {
        const { username } = credentials;

        const requestBody = {
            username,
        };
        return this._httpClient.post<{ data: boolean; message: string }>(
            `${env.API_BASE_URL}/account/auth/check-user`,
            requestBody
        ).pipe(
            switchMap((response) => {
                return of(response); // Return the response as an observable
            }),
        );
    }

    sendOtp(credentials: { username: string }): Observable<{ status: boolean, message: string }> {
        return this._httpClient.post(`${env.API_BASE_URL}/account/auth/send-otp`, credentials).pipe(
            switchMap((response: { status: boolean, message: string }) => {
                // Return a new observable with the response
                return of(response);
            }),
        );
    }

    verifyOtp(credentials: { username: string; otp: string; platform?: string }): Observable<ResponseSuccessfullLogin> {
        const { username, otp, platform = 'Web' } = credentials;

        const requestBody = {
            username,
            otp,
            platform,
        };
        return this._httpClient.post<ResponseSuccessfullLogin>(`${env.API_BASE_URL}/account/auth/verify-otp`, requestBody).pipe(
            switchMap((response: ResponseSuccessfullLogin) => {
                this.accessToken = response.token; // Store access token from the response
                return of(response); // Return a new observable with the response
            }),
        );
    }

    /**
     * Sign out
     */
    signOut(): Observable<boolean> {
        // Remove the access token from the local storage
        localStorage.removeItem('accessToken');
        // Return the observable
        return of(true);
    }
}
