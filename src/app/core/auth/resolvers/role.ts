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
        const isValidRole = allowedRoles.includes(role.name);
        // If the user's role is not valid
        if (!isValidRole) {
            switch (role.name) {
                case RoleEnum.ADMIN:    router.navigateByUrl('/admin/dashboard'); break;
                case RoleEnum.CASHIER:     router.navigateByUrl('/cashier/order'); break;
            }
            // Show unauthorized access message
            return of(false);
        }
        // Allow access
        return of(allowedRoles);
    };
};
