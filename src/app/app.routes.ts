import { Injectable } from '@angular/core';
import { CanActivate, Route, Router } from '@angular/router';
import { AuthGuard } from 'app/core/auth/guards/auth';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth';
import { LayoutComponent } from 'app/layout/component';
import { RoleEnum } from '../helper/enums/role.enum';
import { initialDataResolver } from './app.resolver';
import { AuthService } from './core/auth/service';
import { roleResolver } from './core/auth/resolvers/role';
import { UserPayload } from 'helper/interfaces/payload.interface';
import jwt_decode from 'jwt-decode';

@Injectable({
    providedIn: 'root'
})
export class RedirectGuard implements CanActivate {
    constructor(private router: Router, private auth: AuthService) { }

    canActivate(): boolean {
        try {
            const token = this.auth.accessToken;
            if (token) {
                const payload: UserPayload = jwt_decode(token);
                const role = payload.user.roles.find(r => r.is_default);
                const slug = role?.slug?.toLowerCase();
                if (slug === 'super-user' || slug === 'super_user') {
                    this.router.navigate(['/erp/analytics']);
                } else if (slug === 'cashier') {
                    this.router.navigate(['/cashier/order']);
                } else {
                    this.router.navigate(['/admin/dashboard']);
                }
            } else {
                this.router.navigate(['/admin/dashboard']);
            }
        } catch {
            this.router.navigate(['/admin/dashboard']);
        }
        return false;
    }
}

export const appRoutes: Route[] = [
    // Redirect empty path to 'redirect'
    { path: '', pathMatch: 'full', redirectTo: 'redirect' },

    // Dummy route to handle redirection based on role
    {
        path: 'redirect',
        canActivate: [RedirectGuard],
        component: LayoutComponent
    },

    // Customer display — no auth, open on second device
    {
        path: 'customer-display',
        loadChildren: () => import('app/resources/customer-display/routes')
    },

    // Auth routes for guests
    {
        path: 'auth',
        canActivate: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        loadChildren: () => import('app/resources/r1-account/a1-auth/routes')
    },
    
    // Admin routes
    {
        path: '',
        canActivate: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: initialDataResolver
        },
        children: [
            {
                path: 'admin',
                resolve: {
                    role: roleResolver([RoleEnum.ADMIN])
                },
                loadChildren: () => import('app/resources/r3-admin/admin.routes')
            },

            // ERP — Super User
            {
                path: 'erp',
                resolve: {
                    role: roleResolver([RoleEnum.SUPER_USER])
                },
                loadChildren: () => import('app/resources/r4-erp/erp.routes')
            },

            // Role user
            {
                path: 'cashier',
                resolve: {
                    role: roleResolver([RoleEnum.CASHIER])
                },
                loadChildren: () => import('app/resources/r2-cashier/routes')
            },

            {
                path: 'profile',
                loadChildren: () => import('app/resources/r1-account/a2-profile/routes')
            },
            // 404
            {
                path: '404-not-found',
                pathMatch: 'full',
                loadChildren: () => import('app/shared/error/not-found.routes')
            },
            // Catch all
            {
                path: '**',
                redirectTo: '404-not-found'
            }
        ]
    }
];
