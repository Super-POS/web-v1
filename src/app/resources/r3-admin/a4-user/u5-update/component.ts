import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, OnInit, Output, inject } from '@angular/core';
import { AbstractControl, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

import { env } from 'envs/env';
import { PortraitComponent } from 'helper/components/portrait/component';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { RequestUserUpdate, User } from '../interface';
import { UserService } from '../service';
@Component({
    selector: 'shared-update-user',
    standalone: true,
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatDividerModule,
        MatFormFieldModule,
        PortraitComponent,
        MatRadioModule,
        MatDialogModule
    ]
})
export class UpdateUserComponent implements OnInit {
    src: string = 'icons/photo.svg';
    @Output() onServiceAdded = new EventEmitter<void>();
    @Output() ResponseData = new EventEmitter<User>();
    createUser: UntypedFormGroup;
    isLoading = false;
    currentDate = new Date();
    private userService = inject(UserService);
    fileUrl: string = env.FILE_BASE_URL;
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { roles: { id: number; name: string }[], element: User },
        private dialogRef: MatDialogRef<UpdateUserComponent>,
        private formBuilder: UntypedFormBuilder,
        private snackBarService: SnackbarService
    ) { }

    ngOnInit(): void {
        // Populate the form with existing user data for updating
        this.createUser = this.formBuilder.group({
            avatar: [this.data.element.avatar || null],
            name: [this.data.element.name || null, Validators.required],
            email: [this.data.element.email || null, Validators.required],
            phone: [this.data.element.phone || null, Validators.required],
            role_ids: [this.data.element.role.map(role => role.role_id) || [], [Validators.required, this.validateRoleIds]],
        });

        // Set initial avatar src
        this.src = this.fileUrl + this.data.element.avatar;
    }

    validateRoleIds(control: AbstractControl): ValidationErrors | null {
        return Array.isArray(control.value) && control.value.length > 0 ? null : { noRolesSelected: true };
    }

    submit(): void {
        this.isLoading = true;
        this.createUser.disable();

        // Prepare the user data payload for the update request
        const updatedUser: RequestUserUpdate = {
            name: this.createUser.value.name,
            phone: this.createUser.value.phone,
            email: this.createUser.value.email,
            avatar: this.createUser.value.avatar,  // Ensure it's in the correct format (existing URI or Base64)
            role_ids: Array.isArray(this.createUser.value.role_ids) ? this.createUser.value.role_ids : [] // Ensure role_ids is an array
        };

        // Make the API call to update the user
        this.userService.update(this.data.element.id, updatedUser).subscribe({
            next: (response) => {
                // Close the dialog on success and show a success message
                this.dialogRef.close();
                this.snackBarService.openSnackBar('User updated successfully', GlobalConstants.success);
            },
            error: (err) => {
                // Enable the form and display an error message on failure
                this.createUser.enable();
                this.isLoading = false;
                const message = err?.error?.errors?.map((e: any) => e.message).join(', ') || err?.error?.message || GlobalConstants.genericError;
                this.snackBarService.openSnackBar(message, GlobalConstants.error);
            }
        });
    }

    onFileChange(event: any): void {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.src = e.target.result; // Preview image
                this.createUser.get('avatar')?.setValue(e.target.result); // Base64 string
            };
            reader.readAsDataURL(file);
        } else {
            this.snackBarService.openSnackBar('Please select an image file.', GlobalConstants.error);
        }
    }

    closeDialog() {
        this.dialogRef.close();
    }

    srcChange(base64: string): void {
        this.createUser.get('avatar').setValue(base64);
    }
}
