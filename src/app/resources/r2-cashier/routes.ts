import { Routes } from "@angular/router";
import { OrderComponent } from "./c1-order/component";
import { OrderCheckoutComponent } from "./c1-order/checkout/component";
import { SaleComponent } from "./c2-sale/component";
import { IngredientStockComponent } from "./c3-ingredient-stock/component";
import { IncomingWebOrdersComponent } from "./incoming-web-orders/component";
import { MeetingRoomBookingsQueueComponent } from "app/shared/meeting-room-booking/meeting-room-bookings-queue.component";
import { CashierCashDrawerComponent } from "./c3-cash-drawer/component";

export default [
    {
        path: 'order',
        component: OrderComponent
    },
    {
        path: 'order/checkout',
        component: OrderCheckoutComponent
    },
    {
        path: 'incoming-web',
        component: IncomingWebOrdersComponent,
    },
    {
        path: 'room-bookings',
        component: MeetingRoomBookingsQueueComponent,
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
