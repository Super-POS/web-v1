import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HelperConfirmationConfig } from 'helper/services/confirmation/interface';
import { HelperConfirmationDialogComponent } from 'helper/services/confirmation/dialog/component';
import { merge } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class HelperConfirmationService {
    private _matDialog: MatDialog = inject(MatDialog);
    private _defaultConfig: HelperConfirmationConfig = {
        title: 'Confirm action',
        message: 'Are you sure you want to confirm this action?',
        icon: {
            show: true,
            name: 'heroicons_outline:exclamation-triangle',
            color: 'warn',
        },
        actions: {
            confirm: {
                show: true,
                label: 'Confirm',
                color: 'warn',
            },
            cancel: {
                show: true,
                label: 'Cancel',
            },
        },
        dismissible: false,
    };

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    open(
        config: HelperConfirmationConfig = {}
    ): MatDialogRef<HelperConfirmationDialogComponent> {
        // Merge the user config with the default config
        const userConfig = merge({}, this._defaultConfig, config);

        // Open the dialog
        return this._matDialog.open(HelperConfirmationDialogComponent, {
            autoFocus: false,
            disableClose: !userConfig.dismissible,
            data: userConfig,
            panelClass: 'helper-confirmation-dialog-panel',
        });
    }
}
