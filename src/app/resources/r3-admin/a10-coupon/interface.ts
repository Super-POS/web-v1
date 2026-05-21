export interface AdminCouponRow {
    id: number;
    code: string;
    discount_percent: number;
    note?: string | null;
    is_active: boolean;
    usage_count: number;
    usage_limit?: number | null;
    expires_at?: string | null;
    assigned_users?: Array<{ id: number; name: string }>;
    created_at?: string;
    updated_at?: string;
}

export interface CouponUserOption {
    id: number;
    name: string;
    phone: string;
}
