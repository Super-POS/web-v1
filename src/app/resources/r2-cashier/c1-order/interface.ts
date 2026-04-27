// ================================================================>> Custom Library
import { Data as DataSale } from "../c2-sale/interface";

// Interface for the list of sales orders
export interface List {
    data    : Data[]        // An array of Data objects representing sales orders
}

export interface IngredientStock {
    id: number;
    name: string;
    unit: string | null;
    quantity: number;
    low_stock_threshold: number;
}

// Per menu type group; API may return `menus` or legacy `products`
export interface Data {

    id      : number,
    name    : string,
    products: MenuItem[],
    menus?  : MenuItem[],
}

export interface MenuItemType {
    name: string;
}

/** One option in a modifier group (sugar, ice, …) */
export interface MenuModifierOption {
    id: number;
    label: string;
    code?: string;
    price_delta: number;
    sort_order: number;
    is_active?: boolean;
    is_default?: boolean;
}

/**
 * Normalized from API (Sequelize may nest `MenuModifierGroup` on each group).
 */
export interface NormalizedModifierGroup {
    id: number;
    name: string;
    code: string;
    sort_order: number;
    is_required: boolean;
    options: MenuModifierOption[];
}

/** One line item (menu) on the ordering screen */
export interface MenuItem {
    id: number;
    name: string;
    image: string;
    unit_price: number;
    code: string;
    type: MenuItemType;
    /** When present, cashier may need to pick options before add-to-cart */
    modifierGroups?: NormalizedModifierGroup[];
}

/** One row in the POS cart (same menu can appear on multiple lines with different modifiers) */
export interface OrderCartLine {
    /** Stable merge key: menu + chosen options + note */
    lineKey: string;
    id: number;
    name: string;
    qty: number;
    temp_qty: number;
    /** Per unit, including modifier deltas */
    unit_price: number;
    image: string;
    code: string;
    type: MenuItemType;
    modifier_option_ids: number[];
    line_note?: string;
    /** Human-readable, e.g. "Sugar: 50% · Ice: Regular" */
    modifierSummary: string;
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
