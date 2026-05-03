/** Shape from GET `/cashier/orders/incoming-website` (manage module). */
export interface IncomingWebsiteOrder {
    id: number;
    receipt_number: string;
    /** Cycling short counter 001–100 */
    order_number?: number | null;
    total_price: number | null;
    coupon_code?: string | null;
    discount_percent?: number | null;
    discount_amount?: number | null;
    channel: string;
    status: string;
    ordered_at: string | null;
    customer?: { id: number; name: string; avatar?: string | null };
    details?: Array<{
        id: number;
        unit_price: number;
        qty: number;
        line_note?: string | null;
        menu?: { id: number; name: string; code?: string };
        detailModifiers?: Array<{ group_name: string; option_label: string }>;
        /** if API ever returns snake_case */
        detail_modifiers?: Array<{ group_name: string; option_label: string }>;
    }>;
}

export interface IncomingWebsiteResponse {
    data: IncomingWebsiteOrder[];
}
