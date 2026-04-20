// ================================================================================>> Core Library
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, Output, inject } from '@angular/core';
import { AbstractControl, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';

// ================================================================================>> Thrid Party Library
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

// ================================================================================>> Custom Library

// Local
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { PortraitComponent } from 'helper/components/portrait/component';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { User } from '../interface';
import { UserService } from '../service';

@Component({
    selector: 'shared-create-user',
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
export class CreateUserComponent {
    src: string = 'icons/image.jpg';
    @Output() onServiceAdded = new EventEmitter<void>();
    @Output() ResponseData = new EventEmitter<User>();
    createUser: UntypedFormGroup;
    isLoading = false;
    currentDate = new Date();
    private userService = inject(UserService);

    constructor(
        @Inject(MAT_DIALOG_DATA) public roles: { id: number; name: string }[] = [],
        private dialogRef: MatDialogRef<CreateUserComponent>,
        private formBuilder: UntypedFormBuilder,
        private snackBarService: SnackbarService
    ) { }

    ngOnInit(): void {
        this.createUser = this.formBuilder.group({
            avatar: [null, Validators.required],
            name: [null, Validators.required],
            email: [null, Validators.required],
            phone: [null, Validators.required],
            role_ids: [[], [Validators.required, this.validateRoleIds]],
            password: [null, Validators.required]
        });
    }

    validateRoleIds(control: AbstractControl): ValidationErrors | null {
        return Array.isArray(control.value) && control.value.length > 0 ? null : { noRolesSelected: true };
    }

    submit(): void {
        this.isLoading = true;
        this.createUser.disable();
        this.userService.create(this.createUser.value).subscribe({
            next: (response) => {
                const user: User = {
                    id: response.data.id,
                    name: response.data.name,
                    phone: response.data.phone,
                    email: response.data.email,
                    avatar: response.data.avatar,
                    is_active: response.data.is_active,
                    created_at: response.data.created_at,
                    last_login: response.data.last_login,
                    totalOrders: response.data.totalOrders,
                    totalSales: response.data.totalSales,
                    role: response.data.role.map((roleData: any) => ({
                        id: roleData.id,
                        role_id: roleData.role_id,
                        role: {
                            id: roleData.role.id,
                            name: roleData.role.name
                        }
                    }))
                };

                // Emit the created user data to the parent component
                this.ResponseData.emit(user);
                this.dialogRef.close();
                this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
            },
            error: (err) => {
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

