import { DatePipe, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import GlobalConstants from 'helper/shared/constants';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { CreateDialogComponent } from './create-dialog/component';
import { IngredientItem } from './interface';
import { UpdateDialogComponent } from './update-dialog/component';
import { ProductIngredientService } from './service';

@Component({
    selector: 'product-ingredient',
    standalone: true,
    templateUrl: './template.html',
    imports: [
        NgIf,
        DatePipe,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatTableModule,
    ],
})
export class ProductIngredientComponent implements OnInit {
    private _service = inject(ProductIngredientService);
    private _matDialog = inject(MatDialog);
    private _snackBarService = inject(SnackbarService);

    displayedColumns: string[] = ['no', 'name', 'unit', 'quantity', 'created_at', 'action'];
    dataSource: MatTableDataSource<IngredientItem> = new MatTableDataSource<IngredientItem>([]);

    isLoading = false;

    ngOnInit(): void {
        this.loadIngredients();
    }

    loadIngredients(): void {
        this.isLoading = true;
        this._service.getData().subscribe({
            next: (res) => {
                this.dataSource.data = res?.data ?? [];
                this.isLoading = false;
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this._snackBarService.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    openCreateDialog(): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';

        const dialogRef = this._matDialog.open<CreateDialogComponent>(CreateDialogComponent, dialogConfig);
        dialogRef.componentInstance.resData.subscribe((res: IngredientItem) => {
            const data = this.dataSource.data;
            data.unshift(res);
            this.dataSource.data = data;
        });
    }

    openUpdateDialog(item: IngredientItem, index: number = 0): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';
        dialogConfig.data = item;

        const dialogRef = this._matDialog.open<UpdateDialogComponent>(UpdateDialogComponent, dialogConfig);
        dialogRef.componentInstance.resData.subscribe((res: IngredientItem) => {
            const data = this.dataSource.data;
            data[index] = { ...data[index], ...res };
            this.dataSource.data = data;
        });
    }

    onDelete(item: IngredientItem): void {
        const confirmed = confirm(`Delete ingredient "${item.name}"?`);
        if (!confirmed) {
            return;
        }

        this._service.delete(item.id).subscribe({
            next: (res) => {
                this._snackBarService.openSnackBar(res.message, GlobalConstants.success);
                this.dataSource.data = this.dataSource.data.filter((v) => v.id !== item.id);
            },
            error: (err: HttpErrorResponse) => {
                this._snackBarService.openSnackBar(err?.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }
}
