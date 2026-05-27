export interface ErpExpenseCategory {
    id: number;
    name: string;
    type: 'fixed' | 'variable';
    description?: string;
}

export interface ErpExpense {
    id: number;
    category_id: number;
    category?: { id: number; name: string; type: string };
    amount: number;
    currency: string;
    description?: string;
    date: string;
    reference?: string;
    created_at?: string;
}

export interface ErpPlReport {
    start_date: string;
    end_date: string;
    revenue: number;
    cogs: number;
    gross_profit: number;
    gross_margin_pct: number;
    operating_expenses: number;
    payroll_cost: number;
    net_profit: number;
    net_margin_pct: number;
}
