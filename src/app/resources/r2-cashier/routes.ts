import { Routes } from "@angular/router";
import { OrderComponent } from "./c1-order/component";
import { SaleComponent } from "./c2-sale/component";
import { IngredientStockComponent } from "./c3-ingredient-stock/component";

export default [
    {
        path: 'order',
        component: OrderComponent
    },
    {
        path: 'pos',
        component: SaleComponent
    },
    {
        path: 'ingredient-stock',
        component: IngredientStockComponent
    },
] as Routes;
