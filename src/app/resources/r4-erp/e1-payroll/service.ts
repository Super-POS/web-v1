import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';
import { ErpAttendance, ErpEmployee, ErpLeave, ErpPayrollPeriod } from './interface';

@Injectable({ providedIn: 'root' })
export class ErpPayrollService {
    private base = `${env.API_BASE_URL}/erp/payroll`;

    constructor(private http: HttpClient) {}

    // ── Employees ──────────────────────────────────────────────────────────────

    listEmployees(): Observable<{ data: ErpEmployee[] }> {
        return this.http.get<{ data: ErpEmployee[] }>(`${this.base}/employees`);
    }

    getEmployee(id: number): Observable<{ data: ErpEmployee }> {
        return this.http.get<{ data: ErpEmployee }>(`${this.base}/employees/${id}`);
    }

    createEmployee(body: Partial<ErpEmployee>): Observable<{ data: ErpEmployee; message: string }> {
        return this.http.post<{ data: ErpEmployee; message: string }>(`${this.base}/employees`, body);
    }

    updateEmployee(id: number, body: Partial<ErpEmployee>): Observable<{ data: ErpEmployee; message: string }> {
        return this.http.patch<{ data: ErpEmployee; message: string }>(`${this.base}/employees/${id}`, body);
    }

    deleteEmployee(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.base}/employees/${id}`);
    }

    // ── Attendance ─────────────────────────────────────────────────────────────

    getAttendance(params: { employee_id?: number; start_date?: string; end_date?: string } = {}): Observable<{ data: ErpAttendance[] }> {
        let httpParams = new HttpParams();
        if (params.employee_id != null) { httpParams = httpParams.set('employee_id', String(params.employee_id)); }
        if (params.start_date)          { httpParams = httpParams.set('start_date', params.start_date); }
        if (params.end_date)            { httpParams = httpParams.set('end_date', params.end_date); }
        return this.http.get<{ data: ErpAttendance[] }>(`${this.base}/attendance`, { params: httpParams });
    }

    markAttendance(body: Partial<ErpAttendance>): Observable<{ data: ErpAttendance; message: string }> {
        return this.http.post<{ data: ErpAttendance; message: string }>(`${this.base}/attendance`, body);
    }

    // ── Leaves ─────────────────────────────────────────────────────────────────

    listLeaves(params: { status?: string; employee_id?: number } = {}): Observable<{ data: ErpLeave[] }> {
        let httpParams = new HttpParams();
        if (params.status)              { httpParams = httpParams.set('status', params.status); }
        if (params.employee_id != null) { httpParams = httpParams.set('employee_id', String(params.employee_id)); }
        return this.http.get<{ data: ErpLeave[] }>(`${this.base}/leaves`, { params: httpParams });
    }

    requestLeave(body: Partial<ErpLeave>): Observable<{ data: ErpLeave; message: string }> {
        return this.http.post<{ data: ErpLeave; message: string }>(`${this.base}/leaves`, body);
    }

    updateLeaveStatus(id: number, body: { status: string; rejection_reason?: string }): Observable<{ data: ErpLeave; message: string }> {
        return this.http.patch<{ data: ErpLeave; message: string }>(`${this.base}/leaves/${id}/status`, body);
    }

    // ── Payroll Periods ────────────────────────────────────────────────────────

    listPayrolls(): Observable<{ data: ErpPayrollPeriod[] }> {
        return this.http.get<{ data: ErpPayrollPeriod[] }>(`${this.base}/payrolls`);
    }

    getPayroll(id: number): Observable<{ data: ErpPayrollPeriod }> {
        return this.http.get<{ data: ErpPayrollPeriod }>(`${this.base}/payrolls/${id}`);
    }

    generatePayroll(body: { period_start: string; period_end: string; notes?: string }): Observable<{ data: ErpPayrollPeriod; message: string }> {
        return this.http.post<{ data: ErpPayrollPeriod; message: string }>(`${this.base}/payrolls/generate`, body);
    }

    finalizePayroll(id: number): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.base}/payrolls/${id}/finalize`, {});
    }

    markPayrollPaid(id: number): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.base}/payrolls/${id}/mark-paid`, {});
    }
}
