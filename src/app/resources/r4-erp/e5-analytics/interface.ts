export interface ErpAnalyticsDashboard {
    financials: {
        revenue: number;
        cogs: number;
        gross_profit: number;
        gross_margin_pct: number;
        net_profit: number;
        net_margin_pct: number;
        operating_expenses: number;
        payroll_cost: number;
    };
    best_sellers: ErpBestSeller[];
    sales_trend: ErpSalesTrendPoint[];
    peak_hours: ErpPeakHour[];
    waste_analysis?: ErpWasteItem[];
}

export interface ErpBestSeller {
    menu_id: number;
    menu_name: string;
    total_qty: number;
    total_revenue: number;
}

export interface ErpSalesTrendPoint {
    period: string;
    total_revenue: number;
    order_count: number;
}

export interface ErpPeakHour {
    hour: number;
    order_count: number;
    total_revenue: number;
}

export interface ErpWasteItem {
    ingredient_id: number;
    ingredient_name: string;
    waste_qty: number;
    waste_pct: number;
    waste_cost: number;
}

export interface ErpProfitByProduct {
    menu_id: number;
    menu_name: string;
    revenue: number;
    cogs: number;
    gross_profit: number;
    margin_pct: number;
}
