export type StampCategory = 'drink' | 'event' | 'referral' | 'visit' | 'custom';

export interface AdminStamp {
    id               : number;
    name             : string;
    category         : StampCategory;
    trigger_condition: string;
    bonus_points     : number;
    is_active        : boolean;
    created_at       : string;
    updated_at       : string;
}

export interface CreateStampPayload {
    name             : string;
    category         : StampCategory;
    trigger_condition: string;
    bonus_points?    : number;
    is_active?       : boolean;
}

export interface UpdateStampPayload {
    name?             : string;
    category?         : StampCategory;
    trigger_condition?: string;
    bonus_points?     : number;
    is_active?        : boolean;
}
