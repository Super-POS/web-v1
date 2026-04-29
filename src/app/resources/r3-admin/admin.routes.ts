import { Routes }               from "@angular/router";

import { DashboardComponent }   from "./a1-dashboard/component";
import { SaleComponent }        from "./a2-sale/component";
import { MenuListComponent }     from "./a3-menu/p1-menu/component";
import { MenuCreatePageComponent } from "./a3-menu/p1-menu/create-page/component";
import { MenuCategoryComponent } from "./a3-menu/p2-category/listing/component";
import { MenuIngredientComponent } from "./a3-menu/p3-ingredient/component";
import { AdminModifierComponent } from "./a3-menu/p6-modifier/component";
import { UserComponent }        from "./a4-user/u1-listing/component";
import { AdminCashDrawerComponent } from "./a5-cash-drawer/component";

export default [
    {
        path                    : 'dashboard',
        component               : DashboardComponent
    },
    {
        path                    : 'pos',
        component               : SaleComponent
    },
    {
        path                    : 'menu',
        children: [
            {
                path            : 'all',
                component       : MenuListComponent
            },
            {
                path            : 'create',
                component       : MenuCreatePageComponent
            },
            {
                path            : 'category',
                component       : MenuCategoryComponent
            },
            {
                path            : 'ingredient',
                component       : MenuIngredientComponent
            },
            {
                path            : 'modifier',
                component       : AdminModifierComponent
            },
        ]
    },
    {
        path                    : 'users',
        component               : UserComponent
    },
    {
        path                    : 'cash-drawer',
        component               : AdminCashDrawerComponent
    },

] as Routes;
