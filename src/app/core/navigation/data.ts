import { HelperNavigationItem } from 'helper/components/navigation';

const adminNavigation: HelperNavigationItem[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'basic',
        icon: 'mdi:view-dashboard-outline',
        link: '/admin/dashboard',
    },
    {
        id: 'pos',
        title: 'Sales',
        type: 'basic',
        icon: 'mdi:cart-outline',
        link: '/admin/pos',
    },
    {
        id: 'finance',
        title: 'Finance',
        type: 'basic',
        icon: 'mdi:finance',
        link: '/admin/finance',
    },
    {
        id: 'menu',
        title: 'Menu',
        type: 'collapsable',
        icon: 'mdi:package-variant-closed',
        children: [
            {
                id: 'menu.all',
                title: 'All',
                type: 'basic',
                link: '/admin/menu/all',
            },
            {
                id: 'menu.create',
                title: 'Create new',
                type: 'basic',
                link: '/admin/menu/create',
            },
            {
                id: 'menu.category',
                title: 'Category',
                type: 'basic',
                link: '/admin/menu/category',
            },
            {
                id: 'menu.ingredient',
                title: 'Ingredients',
                type: 'basic',
                link: '/admin/menu/ingredient',
            },
            {
                id: 'menu.wastage',
                title: 'Wastage',
                type: 'basic',
                link: '/admin/menu/wastage',
            },
            {
                id: 'menu.modifier',
                title: 'Options (Modifiers)',
                type: 'basic',
                link: '/admin/menu/modifier',
            },
        ],
    },
    {
        id: 'users',
        title: 'Users',
        type: 'basic',
        icon: 'mdi:account-group-outline',
        link: '/admin/users',
    },
    {
        id: 'coupons',
        title: 'Coupons',
        type: 'basic',
        icon: 'mdi:ticket-percent-outline',
        link: '/admin/coupons',
    },
    {
        id      : 'rank-tiers',
        title   : 'Rank Tiers',
        type    : 'collapsable',
        icon    : 'mdi:trophy-outline',
        children: [
            {
                id   : 'rank-tiers.tiers',
                title: 'Tiers',
                type : 'basic',
                link : '/admin/rank-tiers',
            },
            {
                id   : 'rank-tiers.rewards',
                title: 'Rewards',
                type : 'basic',
                link : '/admin/rank-tier-rewards',
            },
        ],
    },
    {
        id      : 'missions',
        title   : 'Missions',
        type    : 'collapsable',
        icon    : 'mdi:map-marker-path',
        children: [
            {
                id   : 'missions.list',
                title: 'Missions',
                type : 'basic',
                link : '/admin/missions',
            },
            {
                id   : 'missions.stamps',
                title: 'Stamps',
                type : 'basic',
                link : '/admin/missions/stamps',
            },
        ],
    },
    {
        id: 'meeting-rooms',
        title: 'Meeting rooms',
        type: 'collapsable',
        icon: 'mdi:door-open',
        children: [
            {
                id: 'meeting-rooms.list',
                title: 'Rooms',
                type: 'basic',
                link: '/admin/meeting-rooms',
            },
            {
                id: 'meeting-rooms.bookings',
                title: 'Bookings',
                type: 'basic',
                link: '/admin/room-bookings',
            },
        ],
    },
    {
        id: 'cash-drawer',
        title: 'Cash Drawer',
        type: 'basic',
        icon: 'mdi:cash-register',
        link: '/admin/cash-drawer',
    },
    {
        id: 'account',
        title: 'Account',
        type: 'basic',
        icon: 'mdi:account-circle-outline',
        link: '/profile',
    },
];

const userNavigation: HelperNavigationItem[] = [
    {
        id: 'order',
        title: 'Orders',
        type: 'basic',
        icon: 'mdi:monitor',
        link: '/cashier/order',
    },
    {
        id: 'incoming-web',
        title: 'Web orders',
        type: 'basic',
        icon: 'mdi:web',
        link: '/cashier/incoming-web',
    },
    {
        id: 'room-bookings',
        title: 'Room bookings',
        type: 'basic',
        icon: 'mdi:door-open',
        link: '/cashier/room-bookings',
    },
    {
        id: 'pos',
        title: 'Sales',
        type: 'basic',
        icon: 'mdi:cart-outline',
        link: '/cashier/pos',
    },
    {
        id: 'ingredient-stock',
        title: 'Ingredients',
        type: 'basic',
        icon: 'mdi:flask-empty-outline',
        link: '/cashier/ingredient-stock',
    },
    {
        id: 'cash-drawer',
        title: 'Cash Drawer',
        type: 'basic',
        icon: 'mdi:cash-register',
        link: '/cashier/cash-drawer',
    },
    {
        id: 'account',
        title: 'Account',
        type: 'basic',
        icon: 'mdi:account-circle-outline',
        link: '/profile',
    },
];

const superUserNavigation: HelperNavigationItem[] = [
    {
        id: 'erp.analytics',
        title: 'Dashboard',
        type: 'basic',
        icon: 'mdi:view-dashboard-outline',
        link: '/erp/analytics',
    },
    {
        id: 'erp.payroll',
        title: 'Payroll',
        type: 'collapsable',
        icon: 'mdi:account-cash-outline',
        children: [
            {
                id: 'erp.payroll.employees',
                title: 'Employees',
                type: 'basic',
                link: '/erp/payroll/employees',
            },
            {
                id: 'erp.payroll.attendance',
                title: 'Attendance',
                type: 'basic',
                link: '/erp/payroll/attendance',
            },
            {
                id: 'erp.payroll.leaves',
                title: 'Leaves',
                type: 'basic',
                link: '/erp/payroll/leaves',
            },
            {
                id: 'erp.payroll.payrolls',
                title: 'Payroll Periods',
                type: 'basic',
                link: '/erp/payroll/payrolls',
            },
        ],
    },
    {
        id: 'erp.purchasing',
        title: 'Purchasing',
        type: 'collapsable',
        icon: 'mdi:truck-delivery-outline',
        children: [
            {
                id: 'erp.purchasing.suppliers',
                title: 'Suppliers',
                type: 'basic',
                link: '/erp/purchasing/suppliers',
            },
            {
                id: 'erp.purchasing.orders',
                title: 'Purchase Orders',
                type: 'basic',
                link: '/erp/purchasing/purchase-orders',
            },
        ],
    },
    {
        id: 'erp.pl',
        title: 'Profit & Loss',
        type: 'collapsable',
        icon: 'mdi:chart-line',
        children: [
            {
                id: 'erp.pl.report',
                title: 'P&L Report',
                type: 'basic',
                link: '/erp/pl/report',
            },
            {
                id: 'erp.pl.expenses',
                title: 'Expenses',
                type: 'basic',
                link: '/erp/pl/expenses',
            },
            {
                id: 'erp.pl.categories',
                title: 'Expense Categories',
                type: 'basic',
                link: '/erp/pl/categories',
            },
        ],
    },
    {
        id: 'erp.recipe-costing',
        title: 'Recipe Costing',
        type: 'basic',
        icon: 'mdi:flask-outline',
        link: '/erp/recipe-costing',
    },
    {
        id: 'account',
        title: 'Account',
        type: 'basic',
        icon: 'mdi:account-circle-outline',
        link: '/profile',
    },
];

export const navigationData = {
    admin: adminNavigation,
    user: userNavigation,
    superuser: superUserNavigation,
};
