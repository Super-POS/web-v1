import { NgIf } from '@angular/common';
import {
    ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { DashbordService } from '../service';
import { DashboardResponse } from '../interface';

@Component({
    selector: 'cicle-chart',
    standalone: true,
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    imports: [NgApexchartsModule, MatIconModule, NgIf],
})

export class CicleChartComponent implements OnInit, OnChanges {
    @Input() selectedDate: { thisWeek: string; thisMonth: string, threeMonthAgo: string, sixMonthAgo: string } | null = null;
    @ViewChild("chartContainer2", { read: ElementRef, static: false }) chartContainer!: ElementRef<HTMLDivElement>;

    chartOptions: Partial<ApexOptions> = {};
    
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

        this._productService.getDashboardData(params).subscribe({
            next: (response: DashboardResponse) => {



                if (response && response.dashboard.productTypeData.labels && response.dashboard.productTypeData.data) {
                    this._updateChart(response.dashboard.productTypeData.labels, response.dashboard.productTypeData.data);

                } else {
                    this._snackBarService.openSnackBar('No data available', 'Info');
                }
            },
            error: (err) => {
                const errorMessage = err.error?.message || 'Error fetching product data';
                this._snackBarService.openSnackBar(errorMessage, 'Error');
            }
        });
    }

    // Update the chart with new data
    private _updateChart(labels: string[], data: string[]): void {
        const totalSum = data.map(Number).reduce((a, b) => a + b, 0);
        this.chartOptions = {
            chart: {
                type: 'donut',
                height: 400,
            },
            series: data.map(Number),
            labels: labels.map((label, index) => `${label} (${data[index]})`),
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                offsetY: -140,
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
            },
            colors: [
                '#a3e635', '#16a34a', '#d9f99d', '#86efac',
                '#81D4FA', '#80DEEA', '#A5D6A7', '#80CBC4', '#B39DDB'
            ],
            plotOptions: {
                pie: {
                    startAngle: -90,
                    endAngle: 90,
                    expandOnClick: true,
                    donut: {
                        size: '65%',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'Total',
                                formatter: () => `${totalSum}`
                            }
                        }
                    }
                }
            },
            tooltip: {
                enabled: true,
                y: {
                    formatter: (val) => `${val}`,
                }
            },
            dataLabels: {
                enabled: true,
                formatter: function (val, opts) {
                    return opts.w.config.series[opts.seriesIndex];
                },
                style: {
                    fontSize: '14px',
                    fontFamily: 'Arial, sans-serif',
                }
            }
        };

        this._cdr.detectChanges(); // Trigger change detection to update the chart
    }
}
