import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { NavigationService } from "app/core/navigation/service";
import { UserService } from "app/core/user/service";
import { NotificationsService } from "app/layout/common/notifications/service";
import { UserPayload } from 'helper/interfaces/payload.interface';
import { forkJoin } from "rxjs";
import { AuthService } from "./core/auth/service";
import jwt_decode from 'jwt-decode';

export const initialDataResolver = () => {
    const router = inject(Router);
    const token = inject(AuthService).accessToken;
    const navigationService = inject(NavigationService);
    const notificationsService = inject(NotificationsService);
    const tokenPayload: UserPayload = jwt_decode(token);
    const user = inject(UserService).user = tokenPayload.user;
    
    if (!user.roles) {
        localStorage.clear();
        return router.navigateByUrl('');
    }
    
    const role = user.roles.find(role => role.is_default);
    if (!role) {
        localStorage.clear();
        return router.navigateByUrl('');
    }
    
    navigationService.navigations = role;
    const notificationsObservable = notificationsService.getAll();
    // Fork join multiple API endpoint calls to wait all of them to finish
    return forkJoin({notificationsObservable});
};
