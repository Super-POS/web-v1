import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export interface FinanceAreaLink {
    title: string;
    description: string;
    link: string;
    icon: string;
}

@Component({
    selector: 'app-admin-finance-hub',
    standalone: true,
    templateUrl: './template.html',
    imports: [NgFor, RouterModule, MatIconModule],
})
export class AdminFinanceHubComponent {
    readonly areas: FinanceAreaLink[] = [
        {
            title: 'Dashboard',
            description:
                'Revenue overview, daily sales summary, charts by date range, cashier performance, and product-type breakdown.',
            link: '/admin/dashboard',
            icon: 'mdi:view-dashboard-outline',
        },
        {
            title: 'Sales',
            description: 'Browse and filter completed sales, payment details, and historical transactions.',
            link: '/admin/pos',
            icon: 'mdi:cart-outline',
        },
        {
            title: 'Cash drawer',
            description: 'Track drawer sessions, cash in and out, and reconciliation for each register.',
            link: '/admin/cash-drawer',
            icon: 'mdi:cash-register',
        },
        {
            title: 'Coupons',
            description: 'Manage discount codes and promotional rules that affect order totals.',
            link: '/admin/coupons',
            icon: 'mdi:ticket-percent-outline',
        },
        {
            title: 'Menu and pricing',
            description: 'Review menu items, categories, and selling prices that drive revenue.',
            link: '/admin/menu/all',
            icon: 'mdi:package-variant-closed',
        },
    ];
}
