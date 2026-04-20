
// ================================================================================>> Core Library
import { AsyncPipe, CommonModule }              from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule }     from '@angular/forms';
import { RouterModule }                         from '@angular/router';

// ================================================================================>> Thrid Party Library
// Material
import { MatAutocompleteModule }    from '@angular/material/autocomplete';
import { MatButtonModule }          from '@angular/material/button';
import { MatOptionModule }          from '@angular/material/core';
import { MatDatepickerModule }      from '@angular/material/datepicker';
import { MatDialog, MatDialogConfig, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule }         from '@angular/material/divider';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatIconModule }            from '@angular/material/icon';
import { MatInputModule }           from '@angular/material/input';
import { MatMenuModule }            from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule }           from '@angular/material/radio';
import { MatSelectModule }          from '@angular/material/select';
import { MatTooltipModule }         from '@angular/material/tooltip';

import { PortraitComponent }        from 'helper/components/portrait/component';
import { Subject }                  from 'rxjs';
import { ReportGenerateComponent }  from './report/component';
@Component({
    selector: 'app-report-main',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: true,
    imports: [
        RouterModule,
        FormsModule,
        MatIconModule,
        CommonModule,
        MatTooltipModule,
        AsyncPipe,
        MatProgressSpinnerModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatAutocompleteModule,
        MatDatepickerModule,
        MatButtonModule,
        MatMenuModule,
        MatDividerModule,
        MatRadioModule,
        MatDialogModule,
        PortraitComponent
    ]
})
export class ReportComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    constructor(
        private dialogRef: MatDialogRef<ReportComponent>,
    ) { }

    // ngOnInit method
    ngOnInit(): void {

    }
    private matDialog = inject(MatDialog);
    chooseType(type: number) {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.autoFocus = false;
        dialogConfig.data = { type };
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';

        // Open the appropriate dialog based on the type
        let component: any;
        switch (type) {
            case 1:
            case 2:
            case 3:
                component = ReportGenerateComponent;
                break;
            default:
                console.error('Invalid type:', type);
                return; // Exit if the type is not recognized
        }

        this.matDialog.open(component, dialogConfig);
    }


    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    closeDialog() {
        this.dialogRef.close();
    }
}
