import { Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

@Injectable({
    providedIn: 'root',
})

export class DialogConfigService {
    /**
     * Returns a preconfigured MatDialogConfig object.
     * @param data Optional data to pass to the dialog.
     * @param customOptions Optional custom configuration overrides.
     */
    getDialogConfig(data: any = null, customOptions: Partial<MatDialogConfig> = {}): MatDialogConfig {
        const defaultConfig : MatDialogConfig = {
            autoFocus               : false,
            position                : { right: '0', top: '0' },
            width                   : '600px',
            height                  : '100vh',
            enterAnimationDuration  : '0s',
            panelClass              : 'side-dialog',
            data                    : data || null,
        };

        return { ...defaultConfig, ...customOptions };
    }
}
