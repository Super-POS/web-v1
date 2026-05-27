import { Routes } from "@angular/router";

import { ErpAnalyticsComponent }               from "./e5-analytics/component";
import { ErpRecipeCostingComponent }            from "./e4-recipe-costing/component";
import { ErpEmployeesComponent }               from "./e1-payroll/p1-employees/component";
import { ErpAttendanceComponent }              from "./e1-payroll/p2-attendance/component";
import { ErpLeavesComponent }                  from "./e1-payroll/p3-leaves/component";
import { ErpPayrollPeriodsComponent }          from "./e1-payroll/p4-payroll/component";
import { ErpSuppliersComponent }               from "./e2-purchasing/p1-suppliers/component";
import { ErpPurchaseOrdersComponent }          from "./e2-purchasing/p2-purchase-orders/component";
import { ErpExpenseCategoriesComponent }       from "./e3-pl/p1-categories/component";
import { ErpExpensesComponent }                from "./e3-pl/p2-expenses/component";
import { ErpPlReportComponent }                from "./e3-pl/p3-report/component";

export default [
    {
        path      : '',
        component : ErpAnalyticsComponent,
    },
    {
        path      : 'analytics',
        component : ErpAnalyticsComponent,
    },
    {
        path      : 'recipe-costing',
        component : ErpRecipeCostingComponent,
    },
    {
        path      : 'payroll',
        children  : [
            {
                path      : 'employees',
                component : ErpEmployeesComponent,
            },
            {
                path      : 'attendance',
                component : ErpAttendanceComponent,
            },
            {
                path      : 'leaves',
                component : ErpLeavesComponent,
            },
            {
                path      : 'payrolls',
                component : ErpPayrollPeriodsComponent,
            },
        ],
    },
    {
        path      : 'purchasing',
        children  : [
            {
                path      : 'suppliers',
                component : ErpSuppliersComponent,
            },
            {
                path      : 'purchase-orders',
                component : ErpPurchaseOrdersComponent,
            },
        ],
    },
    {
        path      : 'pl',
        children  : [
            {
                path      : 'categories',
                component : ErpExpenseCategoriesComponent,
            },
            {
                path      : 'expenses',
                component : ErpExpensesComponent,
            },
            {
                path      : 'report',
                component : ErpPlReportComponent,
            },
        ],
    },
] as Routes;
