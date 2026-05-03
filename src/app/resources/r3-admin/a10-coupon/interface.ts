export interface AdminCouponRow {
    id: number;
    code: string;
    discount_percent: number;
    note?: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}
