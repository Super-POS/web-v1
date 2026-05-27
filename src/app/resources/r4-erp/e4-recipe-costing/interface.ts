export interface ErpRecipeCostItem {
    menu_id: number;
    menu_name: string;
    menu_code?: string;
    has_sizes: boolean;
    price?: number;
    product_cost: number;
    margin_pct: number;
    sizes?: ErpSizeCost[];
    ingredients?: ErpIngredientCost[];
}

export interface ErpSizeCost {
    size: string;
    price: number;
    product_cost: number;
    margin_pct: number;
}

export interface ErpIngredientCost {
    ingredient_id: number;
    name: string;
    unit: string;
    quantity_used: number;
    unit_cost: number;
    line_cost: number;
}

export interface ErpRecipeSummary {
    total_items: number;
    avg_cost: number;
    avg_margin_pct: number;
    highest_margin?: { menu_name: string; margin_pct: number };
    lowest_margin?: { menu_name: string; margin_pct: number };
}
