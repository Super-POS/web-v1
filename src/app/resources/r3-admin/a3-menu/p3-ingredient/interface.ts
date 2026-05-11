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

export const WASTAGE_REASONS = [
    'Cooking practice',
    'Test drinks by staff',
    'Expired food',
    'Broken items',
    'Spilled milk or coffee',
    'Product samples',
    'Kitchen mistakes',
    'Other',
] as const;

export type WastageReason = (typeof WASTAGE_REASONS)[number];

/** POST .../ingredients/:id/wastage — deducts from current quantity on the server. */
export interface IngredientWastagePayload {
    amount: number;
    reason: string;
}
