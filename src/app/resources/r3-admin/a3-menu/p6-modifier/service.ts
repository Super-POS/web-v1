import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';
import { MenuModifierAssignmentRow, ModifierGroupRow, ModifierOptionRow } from './interface';

const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
const base = `${env.API_BASE_URL}/admin/menu/modifiers`;

@Injectable({ providedIn: 'root' })
export class ModifierAdminService {
    constructor(private _http: HttpClient) {}

    listGroups(): Observable<{ data: ModifierGroupRow[] }> {
        return this._http.get<{ data: ModifierGroupRow[] }>(`${base}/groups`, { headers });
    }

    createGroup(body: {
        name: string;
        code?: string;
        sort_order?: number;
        is_active?: boolean;
    }): Observable<{ data: ModifierGroupRow; message: string }> {
        return this._http.post<{ data: ModifierGroupRow; message: string }>(`${base}/groups`, body, { headers });
    }

    updateGroup(
        id: number,
        body: Partial<{ name: string; code: string; sort_order: number; is_active: boolean }>,
    ): Observable<{ data: ModifierGroupRow; message: string }> {
        return this._http.put<{ data: ModifierGroupRow; message: string }>(`${base}/groups/${id}`, body, { headers });
    }

    deleteGroup(id: number): Observable<{ message: string }> {
        return this._http.delete<{ message: string }>(`${base}/groups/${id}`, { headers });
    }

    createOption(
        groupId: number,
        body: Partial<{
            label: string;
            code?: string;
            price_delta?: number;
            sort_order?: number;
            is_active?: boolean;
            is_default?: boolean;
        }>,
    ): Observable<{ data: ModifierOptionRow; message: string }> {
        return this._http.post<{ data: ModifierOptionRow; message: string }>(
            `${base}/groups/${groupId}/options`,
            body,
            { headers },
        );
    }

    updateOption(
        id: number,
        body: Partial<{
            label: string;
            code?: string;
            price_delta?: number;
            sort_order?: number;
            is_active?: boolean;
            is_default?: boolean;
        }>,
    ): Observable<{ data: ModifierOptionRow; message: string }> {
        return this._http.put<{ data: ModifierOptionRow; message: string }>(`${base}/options/${id}`, body, { headers });
    }

    deleteOption(id: number): Observable<{ message: string }> {
        return this._http.delete<{ message: string }>(`${base}/options/${id}`, { headers });
    }

    getMenuAssignments(menuId: number): Observable<{ data: MenuModifierAssignmentRow[] }> {
        return this._http.get<{ data: MenuModifierAssignmentRow[] }>(`${base}/menus/${menuId}/assignments`, { headers });
    }

    setMenuAssignments(
        menuId: number,
        items: { modifier_group_id: number; sort_order: number; is_required?: boolean }[],
    ): Observable<{ data: MenuModifierAssignmentRow[] }> {
        return this._http.put<{ data: MenuModifierAssignmentRow[] }>(
            `${base}/menus/${menuId}/assignments`,
            { items },
            { headers },
        );
    }
}
