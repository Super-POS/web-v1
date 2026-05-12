export const WASTAGE_REASONS = [
    'expired',
    'damaged',
    'spoiled',
    'over_cooked',
    'other',
] as const;

export type WastageReason = (typeof WASTAGE_REASONS)[number];

// ── Ingredient wastage ────────────────────────────────────────────────────────

export interface IngredientOption {
    id: number;
    name: string;
    unit?: string;
    quantity: number;
}

export interface IngredientWastageRecord {
    id: number;
    ingredient_id: number;
    // flat (returned by some endpoints)
    ingredient_name?: string;
    unit?: string;
    // nested (returned by others)
    ingredient?: { id: number; name: string; unit?: string };
    quantity: number;
    reason: string;
    note?: string;
    created_at: string;
}

export interface IngredientWastageListResponse {
    data: IngredientWastageRecord[];
}

export interface RecordIngredientWastagePayload {
    ingredient_id: number;
    quantity: number;
    reason: string;
    note?: string;
}

// ── Recipe wastage ────────────────────────────────────────────────────────────

export interface RecipeOption {
    id: number;
    name: string;
    code?: string;
    type?: { id: number; name: string };
    image?: string;
}

export interface RecipeWastageRecord {
    id: number;
    menu_id: number;
    // flat
    menu_name?: string;
    // nested
    menu?: { id: number; name: string };
    quantity: number;
    reason: string;
    note?: string;
    created_at: string;
}

export interface RecipeWastageListResponse {
    data: RecipeWastageRecord[];
}

export interface RecordRecipeWastagePayload {
    menu_id: number;
    quantity: number;
    reason: string;
    note?: string;
}
