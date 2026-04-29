/** Shape from GET `/cashier/orders/incoming-website` (manage module). */
export interface IncomingWebsiteOrder {
    id: number;
    receipt_number: string;
    total_price: number | null;
    channel: string;
    status: string;
    ordered_at: string | null;
    customer?: { id: number; name: string; avatar?: string | null };
    details?: Array<{
        id: number;
        unit_price: number;
        qty: number;
        menu?: { id: number; name: string; code?: string };
    }>;
}

export interface IncomingWebsiteResponse {
    data: IncomingWebsiteOrder[];
}
