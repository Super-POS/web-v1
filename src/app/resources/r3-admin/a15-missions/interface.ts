export type MissionRequirementType = 'purchase_count' | 'visit_count' | 'referral' | 'event' | 'custom';
export type MissionStatus          = 'accepted' | 'in_progress' | 'completed' | 'rewarded';

export interface AdminMission {
    id              : number;
    title           : string;
    description     : string | null;
    requirement_type: MissionRequirementType;
    target_value    : number;
    reward_points   : number;
    start_date      : string | null;
    end_date        : string | null;
    is_active       : boolean;
    created_at      : string;
    updated_at      : string;
}

export interface MissionParticipant {
    id            : number;
    user_id       : number;
    customer_name : string;
    progress      : number;
    status        : MissionStatus;
    accepted_at   : string;
    completed_at  : string | null;
}

export interface CreateMissionPayload {
    title           : string;
    description?    : string;
    requirement_type: MissionRequirementType;
    target_value    : number;
    reward_points   : number;
    start_date?     : string;
    end_date?       : string;
    is_active?      : boolean;
}

export interface UpdateMissionPayload {
    title?           : string;
    description?     : string;
    requirement_type?: MissionRequirementType;
    target_value?    : number;
    reward_points?   : number;
    start_date?      : string;
    end_date?        : string;
    is_active?       : boolean;
}
