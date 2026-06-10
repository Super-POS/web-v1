export interface RankTierReward {
    id                     : number;
    rank_tier_id           : number;
    type                   : 'coupon' | 'item';
    label                  : string;
    description            : string | null;
    coupon_discount_percent: number | null;
    coupon_expires_days    : number | null;
    menu_id                : number | null;
    quantity               : number | null;
    is_active              : boolean;
    created_at             : string;
    updated_at             : string;
}

export interface CreateRewardPayload {
    type                    : 'coupon' | 'item';
    label                   : string;
    description?            : string;
    coupon_discount_percent?: number;
    coupon_expires_days?    : number;
    menu_id?                : number;
    quantity?               : number;
    is_active?              : boolean;
}

export interface UpdateRewardPayload {
    label?                  : string;
    description?            : string;
    coupon_discount_percent?: number;
    coupon_expires_days?    : number;
    menu_id?                : number;
    quantity?               : number;
    is_active?              : boolean;
}
