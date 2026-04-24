export interface IngredientItem {
    id: number;
    product_id?: number;
    name: string;
    unit?: string;
    quantity: number;
    created_at: Date;
}

export interface IngredientResponse {
    data: IngredientItem[];
}

export interface IngredientCreatePayload {
    name: string;
    unit?: string;
    quantity: number;
}

export interface IngredientUpdatePayload {
    name: string;
    unit?: string;
    quantity: number;
}
