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
        id: 'product',
        title: 'ម៉ឺនុយ',
        type: 'collapsable',
        icon: 'mdi:coffee-outline',
        children: [
            {
                id: 'product.all',
                title: 'ទាំងអស់',
                type: 'basic',
                link: '/admin/product/all',
            },
            {
                id: 'product.create',
                title: 'បង្កើតម៉ឺនុយ',
                type: 'basic',
                link: '/admin/product/create',
            },
            {
                id: 'product.type',
                title: 'ប្រភេទ',
                type: 'basic',
                link: '/admin/product/type',
            },
            {
                id: 'product.ingredients',
                title: 'ស្តុកគ្រឿងផ្សំ',
                type: 'basic',
                link: '/admin/product/ingredients',
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
        title: 'ការបញ្ជាទិញកាហ្វេ',
        type: 'basic',
        icon: 'mdi:coffee',
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
