import { NgIf }     from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit,
    SimpleChanges, ViewChild
} from '@angular/core';
import { MatIconModule }    from '@angular/material/icon';
import { SnackbarService }  from 'helper/services/snack-bar/snack-bar.service';
import { ApexOptions, NgApexchartsModule } from "ng-apexcharts";
import { DashbordService }  from '../service';
import { DashboardResponse } from '../interface';

@Component({
    selector: 'sup-bar-chart',
    standalone: true,
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    imports: [NgApexchartsModule, MatIconModule, NgIf],
})
export class BarChartComponent implements OnInit, OnChanges, AfterViewInit {
    @Input() selectedDate: { thisWeek?: string; thisMonth?: string; threeMonthAgo?: string; sixMonthAgo?: string } | null = null;
    @ViewChild("chartContainer", { read: ElementRef }) chartContainer!: ElementRef;

    chartOptions: Partial<ApexOptions> = {};
    public data: DashboardResponse | null = null;

    private dayMapping: { [key: string]: string } = {
        'Monday': 'ចន្ទ',
        'Tuesday': 'អង្គារ',
        'Wednesday': 'ពុធ',
        'Thursday': 'ព្រហស្បតិ៍',
        'Friday': 'សុក្រ',
        'Saturday': 'សៅរ៍',
        'Sunday': 'អាទិត្យ'
    };

    constructor(
        private _cdr: ChangeDetectorRef,
        private _snackBarService: SnackbarService,
        private _dashboardService: DashbordService
    ) { }

    // Fetch data on initialization
    ngOnInit(): void {
        this.fetchData(); // Fetch data on initialization
    }

    // Fetch data on changes
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['selectedDate'] && this.selectedDate) {
            this.fetchData(this.selectedDate);
        }
    }

    // Modify grid lines after view is initialized
    ngAfterViewInit(): void {
        this.modifyGridLines(); // Ensure the element is available
    }

    // get data 
    private fetchData(filters: { thisWeek?: string; thisMonth?: string; threeMonthAgo?: string; sixMonthAgo?: string } = {}): void {
        this._dashboardService.getDashboardData(filters).subscribe({
            next: (response: DashboardResponse) => {
                // console.log('Full API Response:', response);
                // console.log('Sales Data:', response?.dashboard.salesData);
    
                const labels = response?.dashboard.salesData.labels.map(label => this.dayMapping[label] || label) || [];
                const data = response?.dashboard.salesData.data || [];
    
                // console.log('Processed Labels:', labels);
                // console.log('Processed Data:', data);
    
                if (labels.length && data.length) {
                    this.updateChart(labels, data);
                } else {
                    this._snackBarService.openSnackBar('No data available', 'Info');
                }
            },
            error: (err) => {
                const errorMessage = err.error?.message || 'Error fetching data';
                this._snackBarService.openSnackBar(errorMessage, 'Error');
            }
        });
    }
    

    // Update the chart with new data
    private updateChart(labels: string[], data: number[]): void {
        const maxValue = Math.max(...data) + 10000;

        this.chartOptions = {
            chart: {
                height: 300,
                type: 'bar',
                fontFamily: 'Barlow, Kantumruy Pro sans-serif',
                foreColor: '#6e729b',
                toolbar: { show: false },
            },
            stroke: { curve: 'smooth', width: 0 },
            series: [{ name: "ចំនួនលក់", data, color: '#3D5AFE' }],
            plotOptions: { bar: { columnWidth: "50%" } },
            dataLabels: { enabled: false },
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                fontWeight: 400,
                offsetY: -5,
                fontSize: '18px',
                labels: { colors: '#64748b', useSeriesColors: false }
            },
            xaxis: { categories: labels },
            yaxis: {
                min: 0,
                max: maxValue,
                tickAmount: 5,
                labels: {
                    formatter: (value: number) =>
                        value >= 1_000 ? (value / 1_000).toFixed(1) + 'k' : value.toString(),
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

        this._cdr.detectChanges();
    }

    // Modify grid lines to remove the dashed lines
    private modifyGridLines(): void {
        if (this.chartContainer) {
            const verticalGridLines = this.chartContainer.nativeElement.querySelectorAll('.apexcharts-gridlines-vertical line');
            if (verticalGridLines.length > 0) {
                verticalGridLines[0].style.strokeDasharray = '0';
                verticalGridLines[verticalGridLines.length - 1].style.strokeDasharray = '0';
            }
        }
    }
}
