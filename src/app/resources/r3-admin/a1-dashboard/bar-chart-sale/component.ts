import { NgIf }             from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatIconModule }    from '@angular/material/icon';
import { env }              from 'envs/env';
import { SnackbarService }  from 'helper/services/snack-bar/snack-bar.service';
import { ExchangeRateSettingService } from 'helper/services/exchange-rate-setting/exchange-rate-setting.service';
import { ApexOptions, NgApexchartsModule } from "ng-apexcharts";
import { DashbordService }  from '../service';
import { CashierData }      from '../interface';
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
    @Input() dataSouce: CashierData;

    @Input() usdRate = ExchangeRateSettingService.FALLBACK_KHR_PER_USD;

    fileUrl = env.FILE_BASE_URL;

    private _lastLabels: string[] = [];
    private _lastData: number[] = [];

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
            return;
        }
        if (changes['usdRate'] && !changes['usdRate'].firstChange && this._lastData.length > 0) {
            this.updateChart(this._lastLabels, this._lastData);
        }
    }
    // Process data and update the chart
    private processDataAndUpdateChart(): void {
        if (!this.dataSouce?.data?.length) {
            return;
        }
        const labels = this.dataSouce.data.map((e) => e.name);
        const data = this.dataSouce.data.map((e) => e.totalAmount);
        this.updateChart(labels, data);
    }

    private updateChart(labels: string[], data: number[]): void {
        const r = this.usdRate;
        this._lastLabels = [...labels];
        this._lastData = [...data];
        const maxKhr = Math.max(...data, 0) + 10_000;
        const formatUsdTick = (khrTick: number): string => {
            const usd = ExchangeRateSettingService.khrToUsd(khrTick, r);
            if (!Number.isFinite(usd)) {
                return '0';
            }
            return usd >= 1_000 ? `${(usd / 1_000).toFixed(1)}k` : usd.toFixed(usd >= 10 ? 0 : 2);
        };

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
                { name: "Sales volume (USD)", data: data, color: '#3D5AFE' }
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
                max: maxKhr,
                tickAmount: 5,
                labels: {
                    formatter: formatUsdTick,
                }
            },
            tooltip: {
                y: {
                    formatter: (khrPoint: number) =>
                        `$${ExchangeRateSettingService.khrToUsd(khrPoint, r).toFixed(2)}`,
                },
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
