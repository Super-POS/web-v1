export type MeetingRoomType = 'standard' | 'vip' | 'conference' | 'executive';
export type MeetingRoomStatus = 'available' | 'maintenance' | 'inactive';

export type AdminMeetingRoomRow = {
    id: number;
    name: string;
    description?: string | null;
    capacity: number;
    price_per_hour?: number | string | null;
    type: MeetingRoomType | string;
    status: MeetingRoomStatus | string;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
};

export const MEETING_ROOM_TYPES: { value: MeetingRoomType; label: string }[] = [
    { value: 'standard', label: 'Standard' },
    { value: 'vip', label: 'VIP' },
    { value: 'conference', label: 'Conference' },
    { value: 'executive', label: 'Executive' },
];

export const MEETING_ROOM_STATUSES: { value: MeetingRoomStatus; label: string }[] = [
    { value: 'available', label: 'Available' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'inactive', label: 'Inactive' },
];
