// Cashier sales list — matches api-v1 (page, limit, total, totalPage)
export interface List {
    data: Data[];
    status?: string;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPage: number;
    };
}

// Interface representing data for a receipt
export interface Data {

    id: number;
    receipt_number: number;
    total_price: number;
    coupon_code?: string | null;
    discount_percent?: number | null;
    discount_amount?: number | null;
    ordered_at?: Date;
    /** api-v1 OrderChannelEnum */
    channel?: string;
    /** Legacy UI field; normalized in SaleService from channel */
    platform?: string;
    status?: string;
    payment_status?: 'paid' | 'cancelled' | 'pending';
    cashier: { id: number; name: string; avatar?: string };
    details: Detail[];
    orderDetails?: Detail[];
}

// Interface representing details of a product in a receipt
export interface Detail {
    id: number,
    unit_price: number,
    qty: number,
    product: Product
}

export interface Product {
    id: number,
    name: string,
    code: string,
    image: string,
    type: ProductType
}

// Interface representing the type of a product
export interface ProductType {
    name: string
}
