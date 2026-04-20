import { CommonModule, HashLocationStrategy, LocationStrategy, NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit }  from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule }              from '@angular/forms';
import { MatButtonModule }          from '@angular/material/button';
import { MatCheckboxModule }        from '@angular/material/checkbox';
import { MatNativeDateModule }      from '@angular/material/core';
import { MatDatepickerModule }      from '@angular/material/datepicker';
import { MatDialog, MatDialogConfig }   from '@angular/material/dialog';
import { MatFormFieldModule }           from '@angular/material/form-field';
import { MatIconModule }                from '@angular/material/icon';
import { MatInputModule }               from '@angular/material/input';
import { MatMenuModule }        from '@angular/material/menu';
import { MatPaginatorModule }   from '@angular/material/paginator';
import { MatSelectModule }      from '@angular/material/select';
import { MatTableModule }       from '@angular/material/table';
import { MatTabsModule }        from '@angular/material/tabs';
import { RouterModule }         from '@angular/router';
import { UserService }          from 'app/core/user/service';
import { User }                 from 'app/core/user/interface';
import { format }               from 'date-fns';
import { env }                  from 'envs/env';
import { SnackbarService }      from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants          from 'helper/shared/constants';
import { UiSwitchModule }       from 'ngx-ui-switch';
import { BehaviorSubject, Subject }     from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { BarChartComponent }            from './bar-chart/component';
import { SaleCashierBarChartComponent } from './bar-chart-sale/component';
import { CicleChartComponent }          from './cicle-chart/component';
import { SaleCicleChartComponent }      from './cicle-chart-sale/component';
import { DashbordService }              from './service';
import {  CashierData, DashboardResponse, ProductTypeData, SalesData, StataticData }    from './interface'; //CashierData
import { ReportComponent }              from './report/component';

@Component({
    selector: 'admin-dashboard',
    standalone: true,
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    imports: [
        CommonModule,
        RouterModule,
        MatIconModule,
        MatButtonModule,
        NgClass,
        NgFor,
        NgIf,
        MatMenuModule,
        MatTabsModule,
        MatTableModule,
        MatCheckboxModule,
        UiSwitchModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        ReactiveFormsModule,
        BarChartComponent,
        CicleChartComponent,
        MatDatepickerModule,
        MatNativeDateModule,
        SaleCashierBarChartComponent,
        SaleCicleChartComponent,
    ],
    providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }],
})
export class DashboardComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private _organizationDataSubject = new BehaviorSubject<StataticData[]>([]);
    organizationData$ = this._organizationDataSubject.asObservable();

    user: User;
    public selectedDateName = 'ថ្ងៃនេះ';
    public selectedDateNameChasier = 'ថ្ងៃនេះ';
    public selectedDateNameSale = 'សប្តាហ៍នេះ';
    public selectedDateNameProduct = 'សប្តាហ៍នេះ';
    public dashboardData : DashboardResponse;
    public cashierData: CashierData;
    public productType: ProductTypeData;
    public saleData: SalesData;
    fileUrl = env.FILE_BASE_URL;

    today?: string;
    yesterday?: string;
    thisWeek?: string;
    thisMonth?: string;
    threeMonthAgo?: string;
    sixMonthAgo?: string;

    dateTypeControl = new FormControl('today', { updateOn: 'blur' });
    dateTypeControlChasier = new FormControl('today', { updateOn: 'blur' });
    dateTypeControlProduct = new FormControl('thisWeek', { updateOn: 'blur' });
    dateTypeControlSale = new FormControl('thisWeek', { updateOn: 'blur' });

    form: FormGroup;
    stataticData: StataticData;
   
    activeTab: string = 'all';
    displayedColumns: string[] = ['number_doc', 'title_doc', 'ministry_doc', 'action_doc'];
    isCart1Visible = false;
    intervalId: any;

    public dateType = [
        { id: 'today', name: 'ថ្ងៃនេះ' },
        { id: 'yesterday', name: 'ម្សិលមិញ' },
        { id: 'thisWeek', name: 'សប្តាហ៍នេះ' },
        { id: 'thisMonth', name: 'ខែនេះ' },
        { id: 'threeMonthAgo', name: '3 ខែមុន' },
        { id: 'sixMonthAgo', name: '6 ខែមុន' },
    ];

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _userService: UserService,
        private _snackBarService: SnackbarService,
        private _service: DashbordService,
    ) { }

    // Fetch data on initialization
    ngOnInit(): void {
        const now = new Date();
        this.today = format(now, 'yyyy-MM-dd');
        this.initializeForm();
        this.fetchUserData();
        this.startCarousel();
        this.setupDateTypeListeners();
        this.getDashboardData(this.selectedDateName? { today: this.today } : undefined);
        this.getCashierData(this.selectedDateNameChasier? { today: this.today } : undefined);
        this.getProductType(this.selectedDateNameProduct? { today: this.today } : undefined);
        this.getProductType(this.selectedDateNameSale? { thisWeek: this.thisWeek } : undefined);
    }


    // Initialize the form
    initializeForm(): void {
        this.form = new FormGroup({
            date_type: this.dateTypeControl,
            date_type_cashier: this.dateTypeControlChasier,
        });
    }   

    // Setup date type listeners
    setupDateTypeListeners(): void {
        this.dateTypeControl.valueChanges
            .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this._unsubscribeAll))
            .subscribe(() => this.dateTypeHandler(1));

        this.dateTypeControlChasier.valueChanges
            .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this._unsubscribeAll))
            .subscribe(() => this.dateTypeHandler(2));

        this.dateTypeControlProduct.valueChanges
            .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this._unsubscribeAll))
            .subscribe(() => this.dateTypeHandler(3));

        this.dateTypeControlSale.valueChanges
            .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this._unsubscribeAll))
            .subscribe(() => this.dateTypeHandler(4));
    }

    // fetch user data
    fetchUserData(): void {
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user) => {
                this.user = user;
                this._changeDetectorRef.markForCheck();
            });
    }

    selectDateType(type: { id: string; name: string }, typeNumber: number): void {
        let params: any = {};
        
        console.log('Selected Type:', type);
    
        switch (typeNumber) {
            case 1:
                this.selectedDateName = type.name;
                this.dateTypeControl.setValue(type.id, { emitEvent: true });
                break;
            case 2:
                this.selectedDateNameChasier = type.name;
                this.dateTypeControlChasier.setValue(type.id, { emitEvent: true });
                break;
            case 3:
                this.selectedDateNameProduct = type.name;
                this.dateTypeControlProduct.setValue(type.id, { emitEvent: true });
                break;
            case 4:
                this.selectedDateNameSale = type.name;
                this.dateTypeControlSale.setValue(type.id, { emitEvent: true });
                break;
        }
    
        // Set date filter params correctly
        const today = new Date();
        const formattedToday = today.toISOString().slice(0, 10); // YYYY-MM-DD
        const yesterday = new Date(today.setDate(today.getDate() - 1)).toISOString().slice(0, 10);
        const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const thisWeek = '2025-W08'; // Adjust if backend expects another format
    
        if (type.id === 'today') params.today = formattedToday;
        if (type.id === 'yesterday') params.yesterday = yesterday;
        if (type.id === 'thisWeek') params.thisWeek = thisWeek;
        if (type.id === 'thisMonth') params.thisMonth = thisMonth;
    
        // console.log('Params being sent:', params);
    
        // Call API based on typeNumber
        switch (typeNumber) {
            case 1:
                this.getDashboardData(params);
                break;
            case 2:
                this.getCashierData(params);
                break;
            case 3:
                this.selectedDate3=params;
                this.getProductType(params);
                break;
            case 4:
                
                this.selectedDate4 = params; // Ensure selectedDate4 updates
                this.getSale(params);
                break;
        }
    
        this._changeDetectorRef.markForCheck();
    }

    getDashboardData(params?: { 
        today?: string; 
        yesterday?: string; 
        thisWeek?: string; 
        thisMonth?: string; 
        threeMonthAgo?: string; 
        sixMonthAgo?: string; 
    }): void {
        this._service.getDashboardData(params) // Pass parameters here
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    if (response?.dashboard) {
                        this.dashboardData = response;
                        // this.cashierData = response.dashboard.cashierData.data;

                        // console.log("Dashboard Data:", this.dashboardData);
                        // console.log("cashierData:", this.cashierData);
                    } else {
                        // console.warn("Invalid API response format:", response);
                        this._snackBarService.openSnackBar('គ្មានទិន្នន័យ',GlobalConstants.error)
                    }
                },
                error: (error) => {
                    // console.error("Error fetching dashboard data:", error);
                    this._snackBarService.openSnackBar(error,GlobalConstants.error)
                }
            });
    }

   
    getCashierData(params?: { 
        today?: string; 
        yesterday?: string; 
        thisWeek?: string; 
        thisMonth?: string; 
        threeMonthAgo?: string; 
        sixMonthAgo?: string; 
    }): void {
        this._service.getDashboardData(params)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: DashboardResponse) => {
                    if (response?.dashboard?.cashierData) {
                        this.cashierData = response.dashboard.cashierData;
                        // console.log("cashierData:", this.cashierData);
                    } else {
                        this._snackBarService.openSnackBar('គ្មានទិន្នន័យ',GlobalConstants.error)
                        this.cashierData = null;
                    }
                },
                error: (error) => {
                    this._snackBarService.openSnackBar(error,GlobalConstants.error)
                    this.cashierData = null;
                }
            });
    }

    getProductType(params?: { 
        today?: string; 
        yesterday?: string; 
        thisWeek?: string; 
        thisMonth?: string; 
        threeMonthAgo?: string; 
        sixMonthAgo?: string; 
    }): void {
        this._service.getDashboardData(params)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: DashboardResponse) => {
                    if (response?.dashboard?.productTypeData) {
                        this.productType = response.dashboard.productTypeData
                        // console.log("productType:", this.productType);
                    } else {
                        this._snackBarService.openSnackBar('គ្មានទិន្នន័យ',GlobalConstants.error)
                        this.cashierData = null;
                    }
                },
                error: (error) => {
                    this._snackBarService.openSnackBar(error,GlobalConstants.error)
                    this.cashierData = null;
                }
            });
    }

    getSale(params?: { 
        today?: string; 
        yesterday?: string; 
        thisWeek?: string; 
        thisMonth?: string; 
        threeMonthAgo?: string; 
        sixMonthAgo?: string; 
    }): void {
        // Ensure params is not undefined
        params = params ?? {};
    
        // console.log("Fetching sales data with params:", params);
    
        this._service.getDashboardData(params)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: DashboardResponse) => {
                    if (response?.dashboard?.salesData) {
                        this.saleData = response.dashboard.salesData;
                        console.log("Sale Data:", this.saleData);
                    } else {
                        this._snackBarService.openSnackBar('គ្មានទិន្នន័យ',GlobalConstants.error)
                        this.saleData = null; // Fix incorrect assignment
                    }
                },
                error: (error) => {
                    this._snackBarService.openSnackBar(error,GlobalConstants.error)
                    this.saleData = null;
                }
            });
    }
    

    // Handle date type changes
    dateTypeHandler(typeNumber: number): void {
        let selectedType: string | null = null;

        // Dynamically fetch the selected type based on the typeNumber
        switch (typeNumber) {
            case 1:
                selectedType = this.dateTypeControl.value;
                break;
            case 2:
                selectedType = this.dateTypeControlChasier.value;
                break;
            case 3:
                selectedType = this.dateTypeControlProduct.value;
                break;
            case 4:
                selectedType = this.dateTypeControlSale.value;
                break;
            default:
                console.warn('Invalid type number:', typeNumber);
                return; // Exit if the type number is invalid
        }
        // Apply the selected date type
        switch (selectedType) {
            case 'today':
                this.applyToday();
                break;
            case 'yesterday':
                this.applyYesterday();
                break;
            case 'thisWeek':
                this.applyThisWeek();
                break;
            case 'thisMonth':
                this.applyThisMonth();
                break;
            case 'threeMonthAgo':
                this.applyThreeMonthAgo();
                break;
            case 'sixMonthAgo':
                this.applySixMonthAgo();
                break;
        }

        // this.fetchData(typeNumber);
    }

    // Apply today date
    applyToday(): void {
        this.today = format(new Date(), 'yyyy-MM-dd');
        this.clearOtherDates('today');
    }


    // Apply yesterday date
    applyYesterday(): void {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        this.yesterday = format(yesterday, 'yyyy-MM-dd');
        this.clearOtherDates('yesterday');
    }

    // Apply this week date
    applyThisWeek(): void {
        const firstDayOfWeek = new Date();
        firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay());
        this.thisWeek = format(firstDayOfWeek, 'yyyy-MM-dd');
        this.clearOtherDates('thisWeek');
    }

    // Apply this month date
    applyThisMonth(): void {
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        this.thisMonth = format(firstDayOfMonth, 'yyyy-MM-dd');
        this.clearOtherDates('thisMonth');
    }

    // Apply three months ago date
    applyThreeMonthAgo(): void {
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        this.threeMonthAgo = format(threeMonthsAgo, 'yyyy-MM-dd');
        this.clearOtherDates('threeMonthAgo');
    }


    // Apply six months ago date
    applySixMonthAgo(): void {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        this.sixMonthAgo = format(sixMonthsAgo, 'yyyy-MM-dd');
        this.clearOtherDates('sixMonthAgo');
    }


    // Clear other dates
    clearOtherDates(activeDate: string): void {
        if (activeDate !== 'today') this.today = undefined;
        if (activeDate !== 'yesterday') this.yesterday = undefined;
        if (activeDate !== 'thisWeek') this.thisWeek = undefined;
        if (activeDate !== 'thisMonth') this.thisMonth = undefined;
        if (activeDate !== 'threeMonthAgo') this.threeMonthAgo = undefined;
        if (activeDate !== 'sixMonthAgo') this.sixMonthAgo = undefined;
    }


    // Get cache key
    getCacheKey(isMain: boolean): string {
        // Determine the appropriate date for cache key generation
        const datePart = this.today || this.yesterday || this.thisWeek || this.thisMonth || 'default';
        const prefix = isMain ? 'main' : 'cashier';
        const cacheKey = `${prefix}_${datePart}`;
        return cacheKey;
    }
    

  

    // Start carousel
    startCarousel(): void {
        this.toggleCart();
    }


    // Toggle cart visibility
    toggleCart(): void {
        this.isCart1Visible = !this.isCart1Visible;
    }

    // Open report dialog
    private matDialog = inject(MatDialog);
    report(): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';
        this.matDialog.open(ReportComponent, dialogConfig);
    }

    // Fetch data
    selectedDate3: { thisWeek: string; thisMonth: string, threeMonthAgo: string, sixMonthAgo: string } | null = null;
    selectedDate4: { thisWeek: string; thisMonth: string, threeMonthAgo: string, sixMonthAgo: string } | null = null;


    // Show cart
    showCart(cart1: boolean) {
        this.isCart1Visible = cart1;
    }

    // Toggle views
    listView = true; // Start with the list view by default
    chartView = false;
    lineView = false;
    // Toggle views
    showListView() {
        this.listView = true;
        this.chartView = false;
        this.lineView = false;
    }

    showChartView() {
        this.listView = false;
        this.chartView = true;
        this.lineView = false;
    }

    showLineView() {
        this.listView = false;
        this.chartView = false;
        this.lineView = true;
    }


    // Unsubscribe from all subscriptions
    ngOnDestroy(): void {
        clearInterval(this.intervalId);
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
