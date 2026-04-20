// ================================================================================>> Core Library
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

// ================================================================================>> Third Party Library
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

// ================================================================================>> Custom Library
// Helper
import GlobalConstants from 'helper/shared/constants';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { ProfileService } from '../../profile.service';

import { ErrorHandleService } from 'app/shared/error-handle.service';
import { PasswordReq } from '../../profile.type';

@Component({
    selector    : 'profile-change-password',
    standalone  : true,
    templateUrl : './template.html',
    styleUrl    : './style.scss',
    imports     : [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatDialogModule,
    ]
})

export class ChangePasswordComponent implements OnInit {

    public form      : UntypedFormGroup;
    public isLoading : boolean = false;

    constructor(
        private _dialogRef: MatDialogRef<ChangePasswordComponent>,

        private _formBuilder        : UntypedFormBuilder,
        private _snackBarService    : SnackbarService,
        private _service            : ProfileService,
        private _errorHandleService :  ErrorHandleService
    ) { }

    ngOnInit(): void {

        this.ngBuilderForm();
    }

    ngBuilderForm(): void {
        this.form = this._formBuilder.group({
            new_password     : [null, [Validators.required]],
            confirm_password : [null, [Validators.required]],
        }, { validators: _passwordMatchValidator });
    }

    submit(): void {

        if (this.form.invalid) {
            return;
        }

        this.form.disable();

        const body: PasswordReq = {
            password         : this.form.value.new_password,
            confirm_password : this.form.value.confirm_password
        };

        this._service.updatePassword(body).subscribe({
            next: response => {

                this.form.enable();

                this._snackBarService.openSnackBar(response.message, GlobalConstants.success);

                this._dialogRef.close()
            },
            error: (err: HttpErrorResponse) => {

                this._errorHandleService.handleHttpError(err);

                this.form.enable();
            }
        });
    }
}

function _passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('new_password')?.value;
    const confirmPassword = control.get('confirm_password')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
}
