import { DecimalPipe, NgForOf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MenuItem, MenuSizeOption } from '../interface';
import { UsdFromKhrPipe } from 'helper/pipes/usd-from-khr.pipe';

export interface SizePickResult {
    size: 'S' | 'M' | 'L';
    unit_price: number;
}

@Component({
    selector: 'cashier-size-pick-dialog',
    standalone: true,
    templateUrl: './template.html',
    imports: [
        NgForOf,
        DecimalPipe,
        MatDialogModule,
        MatButtonModule,
        UsdFromKhrPipe,
    ],
})
export class SizePickDialogComponent {
    readonly data: MenuItem & { _khrPerUsd: number } = inject(MAT_DIALOG_DATA);
    private dialogRef = inject(MatDialogRef<SizePickDialogComponent>);

    readonly sizeLabels: Record<string, string> = { S: 'Small', M: 'Medium', L: 'Large' };

    get sizes(): MenuSizeOption[] {
        return (this.data.sizes ?? []).sort((a, b) => {
            const order = ['S', 'M', 'L'];
            return order.indexOf(a.size) - order.indexOf(b.size);
        });
    }

    pick(s: MenuSizeOption): void {
        this.dialogRef.close({ size: s.size, unit_price: s.price } as SizePickResult);
    }
}
