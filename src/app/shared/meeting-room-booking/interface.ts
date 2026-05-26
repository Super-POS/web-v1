export type MeetingRoomBookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type MeetingRoomBookingRow = {
    id: number;
    room_id: number;
    customer_id?: number | null;
    guest_name: string;
    guest_phone: string;
    guest_email: string;
    guest_origin?: string | null;
    check_in_date: string;
    check_out_date: string;
    meeting_start_time: string;
    meeting_end_time: string;
    num_guests: number;
    num_rooms?: number;
    purpose?: string | null;
    notes?: string | null;
    total_amount?: number | string | null;
    payment_method?: string;
    payment_status?: string;
    status: MeetingRoomBookingStatus | string;
    created_at?: string;
    room?: {
        id: number;
        name: string;
        capacity?: number;
        type?: string;
    };
    customer?: {
        id: number;
        name?: string;
        phone?: string;
        email?: string;
    };
};

export type MeetingRoomBookingListResponse = {
    data: MeetingRoomBookingRow[];
};

export type MeetingRoomBookingMutationResponse = {
    data: MeetingRoomBookingRow;
    message: string;
};
