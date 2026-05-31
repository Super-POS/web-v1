export type FinancePeriodPreset =
    | 'today'
    | 'yesterday'
    | 'thisWeek'
    | 'thisMonth'
    | 'thisYear'
    | 'threeMonthAgo'
    | 'sixMonthAgo'
    | 'custom';

export type FinanceGranularity = 'daily' | 'weekly' | 'monthly';

export interface FinancialReportQuery {
    today?: string;
    yesterday?: string;
    thisWeek?: string;
    thisMonth?: string;
    thisYear?: string;
    threeMonthAgo?: string;
    sixMonthAgo?: string;
    from?: string;
    to?: string;
    granularity?: FinanceGranularity;
}

export interface FinancialReportSummary {
    total_orders: number;
    revenue: number;
    cogs: number;
    gross_profit: number;
    net_profit: number;
    gross_margin_pct: number;
    net_margin_pct: number;
}

export interface RevenueSeriesRow {
    period: string;
    order_count: number;
    revenue: number;
}

export interface PaymentBreakdownRow {
    method: string;
    transaction_count: number;
    total_amount: number;
}

export interface ChannelBreakdownRow {
    channel: string;
    order_count: number;
    revenue: number;
}

export interface TopMenuRow {
    menu_id: number;
    revenue: number;
    total_qty: number;
    menu?: {
        id: number;
        name: string;
        code?: string;
        image?: string;
        type?: { id: number; name: string };
    };
}

export interface WalletSummary {
    total_deposits_approved: number;
    total_payments: number;
    total_refunds: number;
}

export interface FinancialReportData {
    period: { from: string; to: string };
    summary: FinancialReportSummary;
    revenue_series: { granularity: FinanceGranularity; rows: RevenueSeriesRow[] };
    payment_breakdown: PaymentBreakdownRow[];
    channel_breakdown: ChannelBreakdownRow[];
    top_menus: TopMenuRow[];
    wallet_summary: WalletSummary;
}

export interface FinancialReportResponse {
    data: FinancialReportData;
    message?: string;
}
