import { NgIf }             from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatIconModule }    from '@angular/material/icon';
import { SnackbarService }  from 'helper/services/snack-bar/snack-bar.service';
import { ExchangeRateSettingService } from 'helper/services/exchange-rate-setting/exchange-rate-setting.service';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { DashbordService }  from '../service';
import { CashierData }      from '../interface';

@Component({
    selector: 'cicle-chart-sale',
    standalone: true,
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    imports: [NgApexchartsModule, MatIconModule, NgIf],
})
export class SaleCicleChartComponent implements OnInit, OnChanges {
    @ViewChild("chartContainer2", { read: ElementRef, static: false }) chartContainer!: ElementRef<HTMLDivElement>;
    chartOptions: Partial<ApexOptions> = {};
    @Input() dataSouce: CashierData;

    @Input() usdRate = ExchangeRateSettingService.FALLBACK_KHR_PER_USD;

    constructor(
        private _cdr: ChangeDetectorRef,
        private _snackBarService: SnackbarService,
        private _cashierService: DashbordService // Inject your service here
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
        if (changes['usdRate'] && !changes['usdRate'].firstChange && this.dataSouce?.data?.length) {
            this.processDataAndUpdateChart();
        }
    }


      private processDataAndUpdateChart(): void {
        if (!this.dataSouce?.data?.length) {
            return;
        }
        const labels = this.dataSouce.data.map((e) => e.name);
        const data = this.dataSouce.data.map((e) => e.totalAmount);
        this._updateChart(labels, data);
    }

    private _updateChart(labels: string[], data: number[]): void {
        const r = this.usdRate;
        const totalKhr = data.reduce((a, b) => a + b, 0);
        const totalUsdStr = `$${ExchangeRateSettingService.khrToUsd(totalKhr, r).toFixed(2)}`;

        this.chartOptions = {
            chart: {
                type: 'donut',
                height: 400,
            },
            series: data,
            labels: labels.map((label, index) =>
                `${label} ($${ExchangeRateSettingService.khrToUsd(data[index], r).toFixed(2)})`,
            ),
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                offsetY: -120,
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                labels: {
                    colors: ['#000'], // Legend text color
                },
            },
            colors: [
                '#a3e635', '#16a34a', '#d9f99d', '#86efac',
                '#81D4FA', '#80DEEA', '#A5D6A7', '#80CBC4', '#B39DDB'
            ], // Customize colors as needed
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        chart: {},
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
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
                                fontSize: '18px',
                                fontFamily: 'Arial, sans-serif',
                                color: '#373d3f',
                                formatter: () => totalUsdStr
                            }
                        }
                    }
                }
            },
            tooltip: {
                enabled: true,
                y: {
                    formatter: (val: number) =>
                        `$${ExchangeRateSettingService.khrToUsd(val, r).toFixed(2)}`,
                },
            },
            dataLabels: {
                enabled: true,
                formatter: (_val: number, opts: any) =>
                    `$${ExchangeRateSettingService.khrToUsd(opts.w.config.series[opts.seriesIndex], r).toFixed(2)}`,
                style: {
                    fontSize: '12px',
                    colors: ['#000']
                }
            }
        };

        this._cdr.detectChanges(); // Trigger change detection to update the chart
    }
}
