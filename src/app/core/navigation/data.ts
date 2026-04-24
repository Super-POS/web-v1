import { HelperNavigationItem } from 'helper/components/navigation';

const adminNavigation: HelperNavigationItem[] = [
    {
        id: 'dashboard',
        title: 'ផ្ទាំងព័ត៌មាន',
        type: 'basic',
        icon: 'mdi:view-dashboard-outline',
        link: '/admin/dashboard',
    },
    {
        id: 'pos',
        title: 'ការលក់',
        type: 'basic',
        icon: 'mdi:cart-outline',
        link: '/admin/pos',
    },
    {
        id: 'menu',
        title: 'ម៉ឺនុយ',
        type: 'collapsable',
        icon: 'mdi:package-variant-closed',
        children: [
            {
                id: 'menu.all',
                title: 'ទាំងអស់',
                type: 'basic',
                link: '/admin/menu/all',
            },
            {
                id: 'menu.create',
                title: 'បង្កើតថ្មី',
                type: 'basic',
                link: '/admin/menu/create',
            },
            {
                id: 'menu.category',
                title: 'ប្រភេទ',
                type: 'basic',
                link: '/admin/menu/category',
            },
            {
                id: 'menu.ingredient',
                title: 'គ្រឿងផ្សំ',
                type: 'basic',
                link: '/admin/menu/ingredient',
            },
        ],
    },
    {
        id: 'users',
        title: 'អ្នកប្រើប្រាស់',
        type: 'basic',
        icon: 'mdi:account-group-outline',
        link: '/admin/users',
    },
    {
        id: 'account',
        title: 'គណនី',
        type: 'basic',
        icon: 'mdi:account-circle-outline',
        link: '/profile',
    },
];

const userNavigation: HelperNavigationItem[] = [
    {
        id: 'order',
        title: 'ការបញ្ជាទិញ',
        type: 'basic',
        icon: 'mdi:monitor',
        link: '/cashier/order',
    },
    {
        id: 'pos',
        title: 'ការលក់',
        type: 'basic',
        icon: 'mdi:cart-outline',
        link: '/cashier/pos',
    },
    {
        id: 'account',
        title: 'គណនី',
        type: 'basic',
        icon: 'mdi:account-circle-outline',
        link: '/profile',
    },
];

export const navigationData = {
    admin: adminNavigation,
    user: userNavigation
}
