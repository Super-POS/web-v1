import { NgIf }             from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatIconModule }    from '@angular/material/icon';
import { env }              from 'envs/env';
import { SnackbarService }  from 'helper/services/snack-bar/snack-bar.service';
import { ApexOptions, NgApexchartsModule } from "ng-apexcharts";
import { DashbordService }  from '../service';
import { CashierData, DashboardResponse }      from '../interface';
@Component({
    selector: 'sup-bar-chart-sale',
    standalone: true,
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    imports: [NgApexchartsModule, MatIconModule, NgIf],
})
export class SaleCashierBarChartComponent implements OnInit, OnChanges {
    @ViewChild("chartContainer1", { read: ElementRef }) chartContainer!: ElementRef;
    chartOptions: Partial<ApexOptions> = {};
    @Input() dataSouce: CashierData; // Receive data source from parent
    fileUrl = env.FILE_BASE_URL;
    constructor(
        private _cdr: ChangeDetectorRef,
        private _snackBarService: SnackbarService,
        private _dashboardService: DashbordService
    ) { }

    // Fetch data on initialization
    ngOnInit(): void {
        if (this.dataSouce) {
            this.processDataAndUpdateChart();
        }
    }

    // Fetch data on changes
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['dataSouce'] && !changes['dataSouce'].firstChange) {
            this.processDataAndUpdateChart();
        }
    }
    // Process data and update the chart
    private processDataAndUpdateChart(): void {
        const labels = this.dataSouce.data.map((e)=>e.name); // Extract names
        const data = this.dataSouce.data.map((e)=>e.totalAmount); // Extract total amounts
        this.updateChart(labels, data); // Update chart with processed data
    }

    // Update the chart with the processed data
    private updateChart(labels: string[], data: number[]): void {
        this.chartOptions = {
            chart: {
                height: 270,
                type: 'bar',
                fontFamily: 'Barlow, Kantumruy Pro sans-serif',
                foreColor: '#6e729b',
                toolbar: { show: false },
                events: {
                    mounted: () => {
                        setTimeout(() => this.modifyGridLines(), 500);
                    }
                }
            },
            stroke: {
                curve: 'smooth',
                width: 0
            },
            series: [
                { name: "ចំនួនលក់", data: data, color: '#3D5AFE' }
            ],
            plotOptions: {
                bar: { columnWidth: "20%" }
            },
            dataLabels: { enabled: false },
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                fontWeight: 400,
                offsetY: -5,
                fontSize: '12px',
                labels: { colors: '#64748b', useSeriesColors: false }
            },
            xaxis: {
                categories: labels,
                labels: {
                    style: {
                        fontSize: '12px',
                    },
                },
            },
            yaxis: {
                min: 0,
                max: Math.max(...data) + 10000,
                tickAmount: 5,
                labels: {
                    formatter: function (value) { return value.toFixed(0); }
                }
            },
            grid: {
                show: true,
                borderColor: '#e0e0e0',
                strokeDashArray: 5,
                xaxis: { lines: { show: true } },
                yaxis: { lines: { show: true } }
            },
        };

        this._cdr.detectChanges(); // Trigger change detection to update the chart
    }

    // Modify grid lines to remove the dashed lines
    private modifyGridLines(): void {
        const verticalGridLines = this.chartContainer.nativeElement.querySelectorAll('.apexcharts-gridlines-vertical line');
        if (verticalGridLines.length > 0) {
            verticalGridLines[0].style.strokeDasharray = '0'; // First vertical line
            verticalGridLines[verticalGridLines.length - 1].style.strokeDasharray = '0'; // Last vertical line
        }
    }
}
