import { Routes }               from "@angular/router";

import { DashboardComponent }   from "./a1-dashboard/component";
import { SaleComponent }        from "./a2-sale/component";
import { ProductComponent }     from "./a3-menu/p1-menu/component";
import { ProductCreatePageComponent } from "./a3-menu/p1-menu/create-page/component";
import { ProductTypeComponent } from "./a3-menu/p2-category/listing/component";
import { ProductIngredientComponent } from "./a3-menu/p3-ingredient/component";
import { UserComponent }        from "./a4-user/u1-listing/component";

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
                component       : ProductComponent
            },
            {
                path            : 'create',
                component       : ProductCreatePageComponent
            },
            {
                path            : 'category',
                component       : ProductTypeComponent
            },
            {
                path            : 'ingredient',
                component       : ProductIngredientComponent
            },
        ]
    },
    {
        path                    : 'users',
        component               : UserComponent
    },

] as Routes;
