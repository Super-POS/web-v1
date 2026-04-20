import { NgIf }             from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatIconModule }    from '@angular/material/icon';
import { SnackbarService }  from 'helper/services/snack-bar/snack-bar.service';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { DashbordService }  from '../service';
import {CashierData, DashboardResponse }      from '../interface';

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
    @Input() dataSouce: CashierData; // Receive data source from parent

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
        }
    }


      // Process data and update the chart
      private processDataAndUpdateChart(): void {
        const labels = this.dataSouce.data.map((e)=>e.name)// Extract names
        const data = this.dataSouce.data.map((e)=>e.totalAmount); // Extract total amounts
        this._updateChart(labels, data); // Update chart with processed data
    }

    // Update the chart with the processed data
    private _updateChart(labels: string[], data: number[]): void {
        const totalSum = data.reduce((a, b) => a + b, 0);

        this.chartOptions = {
            chart: {
                type: 'donut',
                height: 400,
            },
            series: data, // Use the data from the API
            labels: labels.map((label, index) => `${label} (${data[index]})`), // Format the labels with values
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
                                formatter: () => `${totalSum}` // Display total sum of data
                            }
                        }
                    }
                }
            },
            tooltip: {
                enabled: true,
                y: {
                    formatter: (val) => `${val}`, // Display raw value only
                },
            },
            dataLabels: {
                enabled: true, // Enable data labels
                formatter: function (val, opts) {
                    return opts.w.config.series[opts.seriesIndex]; // Show only raw values
                },
                style: {
                    fontSize: '12px',
                    colors: ['#000']
                }
            }
        };

        this._cdr.detectChanges(); // Trigger change detection to update the chart
    }
}
