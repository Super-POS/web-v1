// ================================================================================>> Core Library
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

// ================================================================================>> Third Party Library
// Material
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

// RxJS
import { Subject, takeUntil } from 'rxjs';

// ================================================================================>> Custom Library
// Env
import { env } from 'envs/env';

// // Service
// import { UserService } from 'app/core/user/user.service';

// // Type
// import { User } from 'app/core/user/user.types';

// Component
import { ChangePasswordComponent } from './change-password/component';
import { UpdateProfileDialogComponent } from './update/component';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { User } from 'app/core/user/interface';
import { UserService } from 'app/core/user/service';

@Component({
    selector    : 'profile',
    standalone  : true,
    templateUrl : './template.html',
    styleUrl    : './style.scss',
    imports     : [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatTableModule,
        MatPaginatorModule,
        MatProgressSpinner
    ]
})

export class ProfileComponent implements OnInit {

    public user             : User;
    public fileUrl          : string = env.FILE_BASE_URL;
    public src              : string;
    public staticImg        : string = '/images/default/avatar.jpg';

    public isLoading        : boolean = false;

    private _unsubscribeAll : Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef   : ChangeDetectorRef,
        private _userService         : UserService,
        private _dialog              : MatDialog,
        private _dialogConfigService : DialogConfigService
    ) { }

    ngOnInit(): void {
        // ===>> Get Data from Global User Service
        this._userService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe((user: User) => {
            // Data Maping
            this.user = user;

            // Check if the avatar is a valid image
            const validImgExtensions = /\.(jpg|jpeg|png|gif|bmp|webp)$/i;
            this.src = this.user.avatar && validImgExtensions.test(this.user.avatar)
                ? this.staticImg
                : `${this.fileUrl}/${this.user.avatar}`;

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    updateProfile(): void {

        const dialogConfig = this._dialogConfigService.getDialogConfig(this.user)

        this._dialog.open(UpdateProfileDialogComponent, dialogConfig);
    }

    updatePassword(): void {

        const dialogConfig = this._dialogConfigService.getDialogConfig(this.user)

        const dialogRef = this._dialog.open(ChangePasswordComponent, dialogConfig);

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.user = result;
            }
        });
    }

}
