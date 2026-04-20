export interface List {
    data: User[];
    pagination: {
        currentPage: number;
        perPage: number;
        totalItems: number;
        totalPages: number;
    };
}

export interface Role {
    id: number;
    name: string;
}

export interface UserRole {
    id: number;
    role_id: number; // Added role_id as in your JSON data
    role: Role;
}

export interface User {
    id: number;
    avatar?: string;
    name: string;
    email?: string | null;
    phone: string;
    is_active: boolean;
    created_at: Date;
    last_login: Date;
    totalOrders: number,
    totalSales: number,
    updated_at?: Date;
    role: UserRole[]; // Use role instead of roles to match your JSON
}

export interface RequestCreateUser {
    name: string;
    phone: string;
    email: string;
    role_ids: number[];
    password: string;
    avatar: string;
}

export interface ResponseUser {
    data: User;
    message: string;
}

export interface RequestUserUpdate {
    name: string;
    phone: string;
    email: string;
    role_ids: number[];
    avatar?: string;
}

export interface PasswordReq {
    password: string;
    confirm_password: string;
}

export interface ResPutPassword {
    statusCode: number;
    message: string;
}
