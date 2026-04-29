export interface IngredientRecipeLine {
    ingredient_id: number;
    quantity: number;
}

export interface ModifierOptionRow {
    id: number;
    group_id: number;
    label: string;
    code?: string | null;
    price_delta: number;
    is_active: boolean;
    is_default: boolean;
    /** Extra stock per 1 line unit (same as menu recipe lines) */
    ingredient_recipe?: IngredientRecipeLine[];
}

export interface ModifierGroupRow {
    id: number;
    name: string;
    code: string;
    sort_order: number;
    is_active: boolean;
    options?: ModifierOptionRow[];
}

export interface MenuModifierAssignmentRow {
    modifier_group_id: number;
    sort_order: number;
    is_required: boolean;
    group?: ModifierGroupRow;
}
