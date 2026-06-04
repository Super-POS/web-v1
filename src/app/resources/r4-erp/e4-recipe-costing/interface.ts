export type ErpRecipeStatus = 'complete' | 'missing_recipe' | 'missing_cost' | 'inactive';

export interface ErpRecipeCostItem {
    menu_id      : number;
    menu_name    : string;
    menu_code?   : string;
    type?        : { id: number; name: string };
    is_available : boolean;
    has_sizes    : boolean;
    status       : ErpRecipeStatus;
    price?       : number;
    cost?        : number;
    profit?      : number;
    food_cost_pct?: number;
    margin_pct?  : number;
    can_produce? : number;
    sizes?       : ErpSizeCost[];
    ingredients? : ErpIngredientCost[];
}

export interface ErpSizeCost {
    size         : string;
    price        : number;
    status       : ErpRecipeStatus;
    cost         : number;
    profit       : number;
    food_cost_pct: number;
    margin_pct   : number;
    can_produce  : number;
    ingredients? : ErpIngredientCost[];
}

export interface ErpIngredientCost {
    ingredient_id        : number;
    name                 : string;
    unit                 : string;
    quantity_used        : number;
    unit_cost            : number;
    line_cost            : number;
    stock_on_hand        : number;
    can_produce_from_this: number;
}

export interface ErpRecipeSummary {
    total_products          : number;
    recipes_complete        : number;
    missing_recipes         : number;
    missing_ingredient_costs: number;
    inactive                : number;
    avg_food_cost_pct       : number;
    avg_margin_pct          : number;
    highest_margin?         : { menu_name: string; margin_pct: number } | null;
    lowest_margin?          : { menu_name: string; margin_pct: number } | null;
}

export interface ErpCostHistoryEntry {
    size?      : string | null;
    cost       : number;
    recorded_at: string;
}

export interface ErpCostHistory {
    menu_id  : number;
    menu_name: string;
    history  : ErpCostHistoryEntry[];
}

export interface ErpCloneResult {
    message  : string;
    source_id: number;
    target_id: number;
}

export interface ErpSnapshotResult {
    message: string;
}
