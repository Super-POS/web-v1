import { Injectable } from '@angular/core';
import { HelperNavigationItem } from 'helper/components/navigation';
import { Observable, ReplaySubject } from 'rxjs';
import { Role } from '../user/interface';
import { RoleEnum } from 'helper/enums/role.enum';
import { navigationData } from './data';

@Injectable({ providedIn: 'root' })
export class NavigationService {

    private _navigation: ReplaySubject<HelperNavigationItem[]> = new ReplaySubject<HelperNavigationItem[]>(1);

    set navigations(role: Role) {
        const roleName = String(role?.name || '').trim();
        const roleSlug = String(role?.slug || '').trim().toLowerCase();
        const isAdmin =
            roleName === RoleEnum.ADMIN ||
            roleName === 'Administrator' ||
            roleSlug === 'admin';
        const isCashier =
            roleName === RoleEnum.CASHIER ||
            roleName === 'Cashier' ||
            roleSlug === 'cashier';

        if (isAdmin) {
            this._navigation.next(navigationData.admin);
            return;
        }
        if (isCashier) {
            this._navigation.next(navigationData.user);
            return;
        }
        this._navigation.next([]);
    }

    get navigations$(): Observable<HelperNavigationItem[]> {
        return this._navigation.asObservable();
    }
}
