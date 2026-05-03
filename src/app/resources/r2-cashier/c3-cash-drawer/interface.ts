export interface Denominations {
    usd_1?: number;
    usd_5?: number;
    usd_20?: number;
    usd_50?: number;
    usd_100?: number;
    khr_100?: number;
    khr_200?: number;
    khr_500?: number;
    khr_1000?: number;
    khr_2000?: number;
    khr_5000?: number;
    khr_10000?: number;
    khr_15000?: number;
    khr_20000?: number;
    khr_30000?: number;
    khr_50000?: number;
    khr_100000?: number;
    khr_200000?: number;
}

// API returns denomination counts as flat fields directly on data
export interface CashDrawer extends Denominations {
    id: number;
    created_at: string;
    updated_at: string;
}

export interface CashDrawerResponse {
    status_code?: number;
    message?: string;
    data: CashDrawer;
}

export interface MakeChangeBody {
    order_id: number;
    exchange_rate: number;
    received?: Denominations;
    received_amount_khr?: number;
    received_amount_usd?: number;
    note?: string;
}

export interface PreviewChangeBody {
    order_total_khr: number;
    exchange_rate: number;
    received?: Denominations;
    received_amount_khr?: number;
    received_amount_usd?: number;
}

export interface ChangeBreakdown {
    [key: string]: number;
}

export interface MakeChangeResponse {
    status_code?: number;
    message: string;
    data: {
        change_khr: number;
        change_usd?: number;
        change_breakdown: ChangeBreakdown;
        order_total?: number;
        order_total_khr?: number;
        received_khr?: number;
        received_total_khr?: number;
        /** api-v1: KHR / USD parts of change returned to customer */
        change_summary?: { khr: number; usd: number };
        exchange_rate?: number;
    };
}
