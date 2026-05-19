
export interface Notification {
    id: number,
    receipt_number: number,
    order_number?: number | null,
    total_price: number,
    ordered_at?: Date,
    /** Null when the cashier account was removed but the notification row remains. */
    cashier?: { id: number, name: string, avatar: string } | null,
    read: boolean;
}
