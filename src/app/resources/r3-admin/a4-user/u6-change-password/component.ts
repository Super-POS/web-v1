// ================================================================>> Core Library (Angular)
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

// ================================================================>> Third Party Library (material)
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// ================================================================>> Custom Library (Application-specific)
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { PasswordReq } from '../interface';
import { UserService } from '../service';

@Component({
    selector: 'profile-change-password',
    standalone: true,
    templateUrl: './component.html',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule
    ]
})

export class ChangePasswordUserComponent implements OnInit {

    passwordForm: UntypedFormGroup;
    saving: boolean = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) public id: number,
        private _service: UserService,
        private formBuilder: UntypedFormBuilder,
        private snackBarService: SnackbarService,
        private dialogRef: MatDialogRef<ChangePasswordUserComponent>

    ) { }

    ngOnInit(): void {

        // Initialize the form when the component is created
        this.ngBuilderForm();
    }

    ngBuilderForm(): void {
        // Add the custom validator to check if new_password and confirm_password match
        this.passwordForm = this.formBuilder.group({
            new_password: [null, [Validators.required]],
            confirm_password: [null, [Validators.required]],
        }, { validator: passwordMatchValidator }); // Add custom validator
    }

    submit(): void {
        if (this.passwordForm.invalid) {
            return;
        }

        this.passwordForm.disable();
        const body: PasswordReq = {
            password: this.passwordForm.value.new_password,
            confirm_password: this.passwordForm.value.confirm_password
        };

        this._service.updatePassword(this.id, body).subscribe({
            next: response => {
                this.passwordForm.enable();
                this.dialogRef.close()
                this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
            },
            error: (err: HttpErrorResponse) => {
                this.passwordForm.enable();
                const errors: { type: string, message: string }[] | undefined = err.error?.errors;
                let message: string = err.error?.message ?? GlobalConstants.genericError;

                if (errors && errors.length > 0) {
                    message = errors.map((obj) => obj.message).join(', ');
                }
                this.snackBarService.openSnackBar(message, GlobalConstants.error);
            }
        });
    }
}

// Custom validator function to check if passwords match
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('new_password')?.value;
    const confirmPassword = control.get('confirm_password')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
}
