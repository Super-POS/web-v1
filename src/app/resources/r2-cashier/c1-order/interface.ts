// ================================================================>> Custom Library
import { Data as DataSale } from "../c2-sale/interface";

// Interface for the list of sales orders
export interface List {
    data    : Data[]        // An array of Data objects representing sales orders
}

// Interface for a single sales order
export interface Data {

    id      : number,
    name    : string,
    products: Product[],
}

// Interface for a product within a sales order
export interface Product {

    id      : number,
    name    : string,
    image   : string,
    unit_price: number;
    code: string,
    type: ProductType
}

interface ProductType{
    name: string;
}
// Interface for the response of creating or updating a sales order
export interface ResponseOrder {

    data    : DataSale,
    message : string
}
