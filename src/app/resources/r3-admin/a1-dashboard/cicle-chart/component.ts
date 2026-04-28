import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import {
    ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { DashbordService } from '../service';
import { TopSaleMenuItem } from '../interface';

@Component({
    selector: 'cicle-chart',
    standalone: true,
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    imports: [MatIconModule, NgIf, NgFor, DecimalPipe],
})

export class CicleChartComponent implements OnInit, OnChanges {
    @Input() selectedDate: { thisWeek?: string; thisMonth?: string; threeMonthAgo?: string; sixMonthAgo?: string } | null = null;
    @ViewChild("chartContainer2", { read: ElementRef, static: false }) chartContainer!: ElementRef<HTMLDivElement>;
    topMenus: TopSaleMenuItem[] = [];
    
    constructor(
        private _cdr: ChangeDetectorRef,
        private _snackBarService: SnackbarService,
        private _productService: DashbordService,
        
    ) { }

    


    // Fetch data on initialization
    ngOnInit(): void {
        if (this.selectedDate) {
            this._fetchProductData(
                this.selectedDate.thisWeek,
                this.selectedDate.thisMonth,
                this.selectedDate.threeMonthAgo,
                this.selectedDate.sixMonthAgo
            );
        } else {
            this._fetchProductData();
        }
    }

    // Fetch data on changes
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['selectedDate'] && this.selectedDate) {
            this._fetchProductData(
                this.selectedDate.thisWeek,
                this.selectedDate.thisMonth,
                this.selectedDate.threeMonthAgo,
                this.selectedDate.sixMonthAgo
            );
        }
    }

    // Fetch data from the server
    private _fetchProductData(
        thisWeek?: string,
        thisMonth?: string,
        threeMonthAgo?: string,
        sixMonthAgo?: string

    ): void {
        const params = {
            thisWeek: thisWeek || undefined,
            thisMonth: thisMonth || undefined,
            threeMonthAgo: threeMonthAgo || undefined,
            sixMonthAgo: sixMonthAgo || undefined,
        };

        this._productService.getTopSaleMenu(params).subscribe({
            next: (response) => {
                this.topMenus = response?.data ?? [];
                this._cdr.detectChanges();
            },
            error: (err) => {
                const errorMessage = err.error?.message || 'Error fetching product data';
                this._snackBarService.openSnackBar(errorMessage, 'Error');
            }
        });
    }
}
