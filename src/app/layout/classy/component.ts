import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { HelperFullscreenComponent } from 'helper/components/fullscreen';
import { HelperLoadingBarComponent } from 'helper/components/loading-bar';
import { HelperNavigationService, HelperNavigationComponent, HelperNavigationItem, } from 'helper/components/navigation';
import { HelperMediaWatcherService } from 'helper/services/media-watcher';
import { NavigationService } from 'app/core/navigation/service';
import { UserService } from 'app/core/user/service';
import { Role, User } from 'app/core/user/interface';
import { LanguagesComponent } from 'app/layout/common/languages/component';
import { UserComponent } from 'app/layout/common/user/component';
import { Subject, takeUntil } from 'rxjs';
import { SchemeComponent } from 'app/layout/common/scheme/component';
import { NotificationsComponent } from '../common/notifications/component';

@Component({
    selector: 'classy-layout',
    templateUrl: './template.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        HelperLoadingBarComponent,
        HelperNavigationComponent,
        NotificationsComponent,
        UserComponent,
        MatIconModule,
        MatButtonModule,
        LanguagesComponent,
        HelperFullscreenComponent,
        SchemeComponent,
        RouterOutlet
    ],
    styleUrls: ['./style.scss'],

})
export class ClassyLayoutComponent implements OnInit, OnDestroy {
    isScreenSmall: boolean;
    navigations: HelperNavigationItem[];
    user: User;
    role: Role;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _navigationService: NavigationService,
        private _userService: UserService,
        private _helperMediaWatcherService: HelperMediaWatcherService,
        private _helperNavigationService: HelperNavigationService,
        private _changeDetectorRef: ChangeDetectorRef,
    ) { }

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to navigation data
        this._navigationService.navigations$.pipe(takeUntil(this._unsubscribeAll)).subscribe((navigation: HelperNavigationItem[]) => {
            this.navigations = navigation;
            // Mark for check
            this._changeDetectorRef.markForCheck();
        });

        // Subscribe to user changes
        this._userService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe((user: User) => {
            this.user = user;
            this.role = user?.roles?.find(role => role.is_default);
            // Mark for check
            this._changeDetectorRef.markForCheck();
        });

        // Subscribe to media changes
        this._helperMediaWatcherService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll)).subscribe(({ matchingAliases }) => {
            // Check if the screen is small
            this.isScreenSmall = !matchingAliases.includes('md');
        });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    /**
     * Toggle navigation
     *
     * @param name
     */
    toggleNavigation(name: string): void {
        // Get the navigation
        const navigation =
            this._helperNavigationService.getComponent<HelperNavigationComponent>(
                name
            );

        if (navigation) {
            // Toggle the opened status
            navigation.toggle();
        }
    }
}
