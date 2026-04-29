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

// GET /api/admin/cash-drawer → flat denomination counts on data
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

export interface DepositBody {
    denominations: Denominations;
    note?: string;
}

// GET /api/admin/cash-drawer/logs → flat denomination counts + cashier object
export interface TransactionLog extends Denominations {
    id: number;
    cashier_id: number;
    order_id: number | null;
    type: string;
    exchange_rate: number | null;
    note: string;
    created_at: string;
    cashier: {
        id: number;
        name: string;
        avatar: string;
    } | null;
}

export interface TransactionLogsResponse {
    status_code?: number;
    data: TransactionLog[];
    pagination: {
        page: number;
        limit: number;
        totalPage: number;
        total: number;
    };
}
