export interface RankTier {
    id        : number;
    tier      : number;
    label     : string;
    min_points: number;
    created_at: string;
    updated_at: string;
}

export interface UpdateRankTierPayload {
    label?     : string;
    min_points?: number;
}
