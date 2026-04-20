// ================================================================================>> Core Library
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, inject } from '@angular/core';

// ================================================================================>> Thrid Party Library
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';

// RxJS
import { Subject } from 'rxjs';

// UI Swtich
import { UiSwitchModule } from 'ngx-ui-switch';

// ================================================================================>> Custom Library
// Environment
import { env } from 'envs/env';

// Local
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import FileSaver from 'file-saver';
import { CapitalizePipe } from 'helper/pipes/capitalize.pipe';
import { HelperConfirmationConfig, HelperConfirmationService } from 'helper/services/confirmation';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { ChangePasswordUserComponent } from '../u6-change-password/component';
import { CreateUserComponent } from '../u4-create/component';
import { FilterUserComponent } from '../u3-filter/component';
import { List, ResponseUser, User } from '../interface';
import { UserService } from '../service';
import { ViewUserComponent } from '../u2-view/component';
import { SkeletonComponent } from './skeleton';
@Component({
    selector: 'shared-list-user',
    standalone: true,
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    imports: [
        MatTableModule,
        CommonModule,
        MatIconModule,
        RouterLink,
        MatButtonModule,
        MatPaginatorModule,
        MatIconModule,
        RouterLink,
        MatTooltipModule,
        CapitalizePipe,
        MatMenuModule,
        UiSwitchModule,
        SkeletonComponent,
    ],
})
export class UserComponent implements OnInit, OnDestroy {

    private _unsubscribeAll: Subject<List> = new Subject<List>();
    private userService = inject(UserService);
    private snackBarService = inject(SnackbarService);
    private helpersConfirmationService = inject(HelperConfirmationService);
    private matDialog = inject(MatDialog);

    displayedColumns: string[] = ['no', 'profile', 'number', 'status', 'last_log', 'total_sale', 'total_price', 'action'];
    dataSource: MatTableDataSource<User> = new MatTableDataSource<User>([]);
    fileUrl: string = env.FILE_BASE_URL;
    link: string = undefined;
    total: number = 10;
    limit: number = 10;
    page: number = 1;
    key: string = '';
    isLoading: boolean = false;
    roles: { id: number; name: string }[] = [];
    constructor(private route: ActivatedRoute, private cdr: ChangeDetectorRef, private dialog: MatDialog) { }
    ngOnInit(): void {
        this.getData(this.page, this.limit);
        this._setUp()
    }

    _setUp(): void {
        this.userService.setup().subscribe({
            next: (response) => {
                this.roles = response.roles;
            },
            error: (err) => {
            }
        });
    }

    getData(
        _page: number = 1,
        _page_size: number = 10,
        filter_data: { timeType?: string; platform?: string; type?: number; startDate?: string; endDate?: string } = {}
    ): void {
        const params: {
            page: number;
            page_size: number;
            key?: string;
            type?: number;
            startDate?: string;
            endDate?: string;
        } = {
            page: _page,
            page_size: _page_size,
            ...filter_data // Spread operator to add filters dynamically
        };

        if (this.key !== '') {
            params.key = this.key;
        }

        this.isLoading = true;
        this.userService.getData(params).subscribe({
            next: res => {
                this.dataSource.data = res.data ?? [];
                this.total = res.pagination.totalItems;
                this.limit = res.pagination.perPage;
                this.page = res.pagination.currentPage;
                this.isLoading = false;
            },
            error: err => {
                this.isLoading = false;
                this.snackBarService.openSnackBar(err.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
            }
        });
    }
    filter_data: { timeType: string; platform: string; type: number; startDate: string; endDate: string };
    openFilterDialog(): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.autoFocus = false;
        dialogConfig.restoreFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';

        const dialogRef = this.dialog.open(FilterUserComponent, dialogConfig);

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.filter_data = result;
                this.cdr.detectChanges();
                this.getData(1, 10, this.filter_data);
            }
        });
    }
    ResponseData = new EventEmitter<ResponseUser>();
    create(): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.data = this.roles;
        dialogConfig.width = "550px";
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.panelClass = 'custom-dialog-container';

        dialogConfig.autoFocus = false;
        dialogConfig.autoFocus = false;
        const dialogRef = this.matDialog.open(CreateUserComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((user: User | null) => {
            this.getData();
        });
    }

    view(element: User): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.data = { element, roles: this.roles }; // Pass both user and roles
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '750px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';
        const dialogRef = this.matDialog.open(ViewUserComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((user: User | null) => {
            this.getData();
        });
    }

    changPassword(id: number) {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';
        dialogConfig.data = id
        const dialogRef = this.matDialog.open(ChangePasswordUserComponent, dialogConfig);

        this.cdr.detectChanges();
    }

    onPageChanged(event: PageEvent): void {
        if (event && event.pageSize) {
            this.limit = event.pageSize;
            this.page = event.pageIndex + 1;
            this.getData(this.page, this.limit);
        }
    }

    onDelete(element: User): void {
        // Build the config form
        const configAction: HelperConfirmationConfig = {
            title: `Remove <strong> ${element.name} </strong>`,
            message: 'Are you sure you want to remove this user permanently? <span class="font-medium">This action cannot be undone!</span>',
            icon: ({
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn',
            }),
            actions: {
                confirm: {
                    show: true,
                    label: 'Remove',
                    color: 'warn',
                },
                cancel: {
                    show: true,
                    label: 'Cancel',
                },
            },
            dismissible: true,
        };
        // Open the dialog and save the reference of it
        const dialogRef = this.helpersConfirmationService.open(configAction);

        // Subscribe to afterClosed from the dialog reference
        dialogRef.afterClosed().subscribe((result: string) => {
            if (result && typeof result === 'string' && result === 'confirmed') {
                this.userService.delete(element.id).subscribe({
                    next: (response: { statusCode: number, message: string }) => {
                        this.dataSource.data = this.dataSource.data.filter((v: User) => v.id != element.id);
                        this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
                    },
                    error: (err: HttpErrorResponse) => {
                        const error: { httpStatus: 400, message: string } = err.error;
                        this.snackBarService.openSnackBar(error.message, GlobalConstants.error);
                    }
                });
            }
        });
    }

    //=============================================>> Status
    onChange(status: boolean, user: User): void {
        const body = {
            is_active: status ? true : false
        };
        console.log(body)
        this.userService.updateStatus(user.id, body).subscribe({
            next: (response) => {
                this.cdr.detectChanges();
                this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
            },
            error: (err) => {
                const error: { httpStatus: number, message: string } = err.error;
                this.snackBarService.openSnackBar(error.message, GlobalConstants.error);
            }
        })
    }

    saving: boolean = false;
    getReport() {
        this.saving = true;
        this.userService.getDataCashierReport().subscribe({
            next: (response) => {
                this.saving = false;
                let blob = this.b64toBlob(response.data, 'application/pdf');
                FileSaver.saveAs(blob, 'របាយការណ៍លក់តាមអ្នក គិតប្រាក់' + '.pdf');
                // Show a success message using the snackBarService
                this.snackBarService.openSnackBar('របាយការណ៍ទាញយកបានជោគជ័យ', GlobalConstants.success);
            },
            error: (err: HttpErrorResponse) => {
                // Set saving to false to indicate the operation is completed (even if it failed)
                this.saving = false;
                // Extract error information from the response
                const errors: { type: string; message: string }[] | undefined = err.error?.errors;
                let message: string = err.error?.message ?? GlobalConstants.genericError;

                // If there are field-specific errors, join them into a single message
                if (errors && errors.length > 0) {
                    message = errors.map((obj) => obj.message).join(', ');
                }
                // Show an error message using the snackBarService
                this.snackBarService.openSnackBar(message, GlobalConstants.error);
            },
        });
    }

    b64toBlob(b64Data: string, contentType: string, sliceSize?: number) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;
        var byteCharacters = atob(b64Data);
        var byteArrays = [];
        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);
            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        var blob = new Blob(byteArrays, { type: contentType });
        return blob;
    }
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
