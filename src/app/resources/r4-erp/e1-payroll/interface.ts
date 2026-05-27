export interface ErpEmployee {
    id: number;
    user_id: number;
    user?: { id: number; name: string; phone: string; email: string };
    position: string;
    department: string;
    base_salary: number;
    hourly_rate: number;
    hire_date: string;
    contract_type: 'full_time' | 'part_time' | 'contract' | 'internship';
    bank_account?: string;
    bank_name?: string;
    notes?: string;
    status: 'active' | 'inactive';
    created_at?: string;
}

export interface ErpAttendance {
    id: number;
    employee_id: number;
    employee?: { id: number; user?: { name: string } };
    date: string;
    clock_in?: string;
    clock_out?: string;
    hours_worked?: number;
    overtime_hours?: number;
    status: 'present' | 'absent' | 'late' | 'half_day' | 'holiday' | 'on_leave';
    notes?: string;
}

export interface ErpLeave {
    id: number;
    employee_id: number;
    employee?: { id: number; user?: { name: string } };
    type: 'annual' | 'sick' | 'unpaid' | 'maternity' | 'paternity' | 'other';
    start_date: string;
    end_date: string;
    days: number;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    rejection_reason?: string;
    created_at?: string;
}

export interface ErpPayrollPeriod {
    id: number;
    period_start: string;
    period_end: string;
    status: 'draft' | 'finalized' | 'paid';
    notes?: string;
    total_net_salary?: number;
    items?: ErpPayrollItem[];
    created_at?: string;
}

export interface ErpPayrollItem {
    id: number;
    payroll_id: number;
    employee_id: number;
    employee?: { id: number; user?: { name: string }; position?: string };
    base_salary: number;
    overtime_pay: number;
    leave_deduction: number;
    net_salary: number;
}
