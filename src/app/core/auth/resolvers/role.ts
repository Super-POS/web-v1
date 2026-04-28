import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { RoleEnum } from "helper/enums/role.enum";
import { UserPayload } from 'helper/interfaces/payload.interface';
import jwt_decode from 'jwt-decode';
import { of } from "rxjs";
import { AuthService } from "../service";

export const roleResolver = (allowedRoles: string[]) => {
    return () => {
        const router = inject(Router);
        const token = inject(AuthService).accessToken;
        const tokenPayload: UserPayload = jwt_decode(token);
        const role = tokenPayload.user.roles.find(role => role.is_default);
        if (!role) {
            router.navigateByUrl('');
            return of(false);
        }
        const slug = role.slug?.toLowerCase();
        const wantsAdmin = allowedRoles.includes(RoleEnum.ADMIN);
        const wantsCashier = allowedRoles.includes(RoleEnum.CASHIER);
        const isValidRole =
            allowedRoles.includes(role.name) ||
            (wantsAdmin && slug === 'admin') ||
            (wantsCashier && slug === 'cashier');
        if (!isValidRole) {
            switch (slug) {
                case 'admin':
                    router.navigateByUrl('/admin/dashboard');
                    break;
                case 'cashier':
                    router.navigateByUrl('/cashier/order');
                    break;
                default:
                    router.navigateByUrl('');
                    break;
            }
            return of(false);
        }
        return of(allowedRoles);
    };
};
