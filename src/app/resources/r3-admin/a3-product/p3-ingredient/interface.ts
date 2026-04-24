export interface IngredientRow {
  id: number;
  name: string;
  unit: string;
  stock: number;
  low_stock_threshold: number;
  created_at?: string;
  updated_at?: string;
}

export interface IngredientListResponse {
  data: IngredientRow[];
}
