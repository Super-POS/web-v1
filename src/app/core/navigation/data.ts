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

export const navigationData = {
    admin: adminNavigation,
    user: userNavigation
}
