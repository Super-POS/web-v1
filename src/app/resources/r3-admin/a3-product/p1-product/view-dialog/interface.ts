export interface List {
    data: Data[],
    pagination: {
        currentPage: number,
        perPage: number,
        totalItems: number,
        totalPages: number
    }
}

// Interface representing data for a receipt
export interface Data {
    id: number,
    receipt_number: number,
    total_price: number,
    platform: string,
    ordered_at?: Date,
    cashier: { id: number, name: string },
}
