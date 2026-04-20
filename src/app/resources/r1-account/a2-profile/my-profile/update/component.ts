// ================================================================================>> Core Library
import { CommonModule } from '@angular/common';
import { Component, Inject, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

// ================================================================================>> Third Party Library
// Material
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

// ================================================================================>> Custom Library
// Env
import { env } from 'envs/env';

// Helper
import GlobalConstants from 'helper/shared/constants';

// Service
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { ProfileService } from '../../profile.service';
import { ErrorHandleService } from 'app/shared/error-handle.service';

// Interface
import { ResponseProfile } from '../../profile.type';
import { User } from 'app/core/user/interface';


@Component({
    selector    : 'update-form',
    standalone  : true,
    templateUrl : './template.html',
    styleUrl    : './style.scss',
    imports     : [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIcon,
        MatIconModule,
        MatInputModule,
        MatOptionModule,
        MatDialogModule,
        MatDividerModule,
        MatFormFieldModule
    ],
})
export class UpdateProfileDialogComponent {

    public form      : UntypedFormGroup;
    public src       : string = 'assets/images/avatars/avatar.jpeg';
    public isLoading : boolean;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: User,

        private _dialogRef          : MatDialogRef<UpdateProfileDialogComponent>,
        private _formBuilder        : UntypedFormBuilder,
        private _accountService     : ProfileService,
        private _snackBarService    : SnackbarService,
        private _errorHandleService : ErrorHandleService,
    ) { }

    ngOnInit(): void {
        const avatarPath = this.data.avatar.replace(/^\/+/, '');
        this.src = `${env.FILE_BASE_URL.replace(/\/?$/, '/')}${avatarPath}`;
        this.ngBuilderForm();
    }

    ngBuilderForm(): void {
        this.form = this._formBuilder.group({
            avatar : [null],
            name   : [this.data?.name,   Validators.required],
            email  : [this.data?.email, [Validators.required, Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]],
            phone  : [this.data?.phone, [Validators.required, Validators.pattern("^[0-9]*$")]],
        });
    }

    onFileChange(event: any): void {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.src = e.target.result; // Preview image
                this.form.get('avatar')?.setValue(e.target.result); // Base64 string
            };
            reader.readAsDataURL(file);
        } else {
            this._snackBarService.openSnackBar('Please select an image file.', GlobalConstants.error);
        }
    }

    srcChange(base64: string): void {
        this.form.get('avatar').setValue(base64);
    }

    submit(): void {

        this.form.disable();

        if (!this.form.value.avatar) {
            this.form.removeControl('avatar');
        }

        this._accountService.profile(this.form.value).subscribe({
            next: (res: ResponseProfile) => {

                if (res.token) {

                    localStorage.removeItem('accessToken');

                    localStorage.setItem('accessToken', res.token);
                }

                window.location.reload();

                this._snackBarService.openSnackBar(res.message, GlobalConstants.success);

                this._dialogRef.close();
            },
            error: (err) => {

                this._errorHandleService.handleHttpError(err);

                this.form.enable();
            },
        });
    }
}
