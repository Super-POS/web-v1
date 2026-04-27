import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { ModifierGroupRow } from '../interface';
import { ModifierAdminService } from '../service';

export type GroupDialogData = { group?: ModifierGroupRow };

@Component({
    selector: 'admin-modifier-group-dialog',
    templateUrl: './template.html',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
    ],
})
export class ModifierGroupDialogComponent {
    private _ref = inject(MatDialogRef<ModifierGroupDialogComponent, ModifierGroupRow | undefined>);
    private _fb = inject(UntypedFormBuilder);
    private _service = inject(ModifierAdminService);
    private _snack = inject(SnackbarService);
    data = inject<GroupDialogData>(MAT_DIALOG_DATA);

    isEdit = !!this.data?.group;
    isSaving = false;

    form = this._fb.group({
        name: [this.data?.group?.name ?? '', Validators.required],
    });

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.isSaving = true;
        const v = this.form.getRawValue();
        const body = {
            name: v.name,
            is_active: true,
        };
        const req$ = this.isEdit
            ? this._service.updateGroup(this.data!.group!.id, body)
            : this._service.createGroup(body);
        req$.subscribe({
            next: (res) => {
                this._snack.openSnackBar(res.message, GlobalConstants.success);
                this._ref.close(res.data);
            },
            error: (err: HttpErrorResponse) => {
                this.isSaving = false;
                this._snack.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    cancel(): void {
        this._ref.close(undefined);
    }
}
