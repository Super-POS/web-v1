import { DatePipe, DecimalPipe, NgClass, NgIf } from "@angular/common";
import { ChangeDetectorRef, Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { SnackbarService } from "helper/services/snack-bar/snack-bar.service";
import { UserService } from "../service";
// Environment
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSelectModule } from "@angular/material/select";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatTabsModule } from "@angular/material/tabs";
import { env } from 'envs/env';
import { User } from "../interface";
import { UpdateUserComponent } from "../u5-update/component";
import { Data } from "./interface";
@Component({
    selector: 'shared-view-user',
    standalone: true,
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    imports: [
        MatTableModule,
        NgClass,
        NgIf,
        DatePipe,
        DecimalPipe,
        FormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatIconModule,
        MatButtonModule,
        MatPaginatorModule,
        MatMenuModule,
        MatTabsModule,
        MatTableModule,
    ]
})
export class ViewUserComponent implements OnInit {

    fileUrl = env.FILE_BASE_URL;
    isLoading: boolean = false
    element: any
    displayedColumns: string[] = ['no', 'receipt', 'price', 'ordered_at', 'ordered_at_time', 'seller'];
    dataSource: MatTableDataSource<Data> = new MatTableDataSource<Data>([]);
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { element: User, roles: { id: number; name: string }[] },
        private _dialogRef: MatDialogRef<ViewUserComponent>,
        private _service: UserService,
        private _matDialog: MatDialog,
        private cdr: ChangeDetectorRef,
        private _snackbar: SnackbarService,
    ) { }

    ngOnInit(): void {
        this.viewData()
    }

    viewData() {
        this.isLoading = true;
        this._service.view(this.data.element.id).subscribe((res) => {
            this.element = res.data;
            this.dataSource.data = res.sale;
            this.isLoading = false;
        }, (err) => {
            this.isLoading = false;
            this._snackbar.openSnackBar(err.error.message, 'Dismiss');
        });
    }

    update(element: User): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.data = { element, roles: this.data.roles };
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';
        const dialogRef = this._matDialog.open(UpdateUserComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((user: User | null) => {
            this.viewData();
        });
    }

    closeDialog() {
        this._dialogRef.close();
    }

}
