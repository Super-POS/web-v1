
export interface Notification {
    id: number,
    receipt_number: number,
    order_number?: number | null,
    total_price: number,
    ordered_at?: Date,
    cashier: { id: number, name: string, avatar: string },
    read: boolean;
}
