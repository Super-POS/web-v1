export interface IngredientItem {
    id: number;
    product_id?: number;
    name: string;
    unit?: string;
    quantity: number;
    low_stock_threshold?: number;
    created_at: Date;
}

export interface IngredientResponse {
    data: IngredientItem[];
}

export interface IngredientCreatePayload {
    name: string;
    unit?: string;
    quantity: number;
    low_stock_threshold?: number;
}

export interface IngredientUpdatePayload {
    name: string;
    unit?: string;
    quantity: number;
    low_stock_threshold?: number;
}

/** POST .../ingredients/:id/restock — adds to current quantity on the server. */
export interface IngredientRestockPayload {
    add: number;
}
