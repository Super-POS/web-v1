// ================================================================>> Custom Library
import { Data as DataSale } from "../c2-sale/interface";

// Interface for the list of sales orders
export interface List {
    data    : Data[]        // An array of Data objects representing sales orders
}

// Per menu type group; API may return `menus` or legacy `products`
export interface Data {

    id      : number,
    name    : string,
    products: MenuItem[],
    menus?  : MenuItem[],
}

/** One line item (menu) on the ordering screen */
export interface MenuItem {

    id      : number,
    name    : string,
    image   : string,
    unit_price: number;
    code: string,
    type: MenuItemType
}

interface MenuItemType{
    name: string;
}
// Interface for the response of creating or updating a sales order
export interface ResponseOrder {

    data    : DataSale,
    message : string
}

/** api-v1 POST /cashier/ordering/baray/payment-intent */
export interface BarayPaymentIntentResponse {
    data: {
        _id: string;
        url: string;
        status: string;
        expires_at: string;
        payment_transaction_id: number;
    };
    message: string;
}
