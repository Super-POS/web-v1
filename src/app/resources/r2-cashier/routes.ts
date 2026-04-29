import { Routes } from "@angular/router";
import { OrderComponent } from "./c1-order/component";
import { SaleComponent } from "./c2-sale/component";
import { IngredientStockComponent } from "./c3-ingredient-stock/component";
import { IncomingWebOrdersComponent } from "./incoming-web-orders/component";
import { CashierCashDrawerComponent } from "./c3-cash-drawer/component";

export default [
    {
        path: 'order',
        component: OrderComponent
    },
    {
        path: 'incoming-web',
        component: IncomingWebOrdersComponent,
    },
    {
        path: 'pos',
        component: SaleComponent
    },
    {
        path: 'ingredient-stock',
        component: IngredientStockComponent
    },
    {
        path: 'cash-drawer',
        component: CashierCashDrawerComponent
    },
] as Routes;
