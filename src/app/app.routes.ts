import { Injectable } from '@angular/core';
import { CanActivate, Route, Router } from '@angular/router';
import { AuthGuard } from 'app/core/auth/guards/auth';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth';
import { LayoutComponent } from 'app/layout/component';
import { RoleEnum } from '../helper/enums/role.enum';
import { initialDataResolver } from './app.resolver';
import { roleResolver } from './core/auth/resolvers/role';

@Injectable({
    providedIn: 'root'
})
export class RedirectGuard implements CanActivate {
    constructor(private router: Router) { }

    canActivate(): boolean {

        this.router.navigate(['/admin/dashboard']);

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
