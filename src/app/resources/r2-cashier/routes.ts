import { Routes } from "@angular/router";
import { OrderComponent } from "./c1-order/component";
import { SaleComponent } from "./c2-sale/component";

export default [
    {
        path: 'order',
        component: OrderComponent
    },
    {
        path: 'pos',
        component: SaleComponent
    },
] as Routes;
