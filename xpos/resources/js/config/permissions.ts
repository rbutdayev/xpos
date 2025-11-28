/**
 * xPOS Permission System
 *
 * Permission-based access control configuration.
 * Maps roles to permissions for flexible authorization.
 */

/**
 * Permission definition interface
 */
export interface PermissionConfig {
    id: string;
    name: string;
    description: string;
    category: 'data' | 'system' | 'financial' | 'operations';
}

/**
 * All available permissions in the system
 */
export const PERMISSIONS: Record<string, PermissionConfig> = {
    // Dashboard & Data Access
    'access-dashboard': {
        id: 'access-dashboard',
        name: 'Access Dashboard',
        description: 'View main dashboard and statistics',
        category: 'data',
    },
    'access-account-data': {
        id: 'access-account-data',
        name: 'Access Account Data',
        description: 'Access and view account-specific data',
        category: 'data',
    },

    // Financial Permissions
    'view-financial-reports': {
        id: 'view-financial-reports',
        name: 'View Financial Reports',
        description: 'Access financial data, reports, and analytics',
        category: 'financial',
    },
    'manage-expenses': {
        id: 'manage-expenses',
        name: 'Manage Expenses',
        description: 'Create, edit, and view expenses',
        category: 'financial',
    },
    'manage-expense-categories': {
        id: 'manage-expense-categories',
        name: 'Manage Expense Categories',
        description: 'Create and edit expense categories',
        category: 'financial',
    },
    'view-reports': {
        id: 'view-reports',
        name: 'View Reports',
        description: 'Access business reports and analytics',
        category: 'data',
    },

    // Operations Permissions
    'manage-sales': {
        id: 'manage-sales',
        name: 'Manage Sales',
        description: 'Create, edit, and process sales transactions',
        category: 'operations',
    },
    'manage-customers': {
        id: 'manage-customers',
        name: 'Manage Customers',
        description: 'Create, edit, and view customer information',
        category: 'operations',
    },
    'manage-products': {
        id: 'manage-products',
        name: 'Manage Products',
        description: 'Create, edit, and view product catalog',
        category: 'operations',
    },
    'manage-inventory': {
        id: 'manage-inventory',
        name: 'Manage Inventory',
        description: 'Stock operations, transfers, and inventory management',
        category: 'operations',
    },
    'manage-suppliers': {
        id: 'manage-suppliers',
        name: 'Manage Suppliers',
        description: 'Create, edit, and view supplier information',
        category: 'operations',
    },
    'manage-services': {
        id: 'manage-services',
        name: 'Manage Services',
        description: 'Create and manage service records (tailor, repair, etc.)',
        category: 'operations',
    },
    'manage-vehicles': {
        id: 'manage-vehicles',
        name: 'Manage Customer Items',
        description: 'Manage customer items for service tracking',
        category: 'operations',
    },
    'manage-rentals': {
        id: 'manage-rentals',
        name: 'Manage Rentals',
        description: 'Create and manage rental transactions',
        category: 'operations',
    },

    // Data Management Permissions
    'create-account-data': {
        id: 'create-account-data',
        name: 'Create Account Data',
        description: 'Create new records in the system',
        category: 'data',
    },
    'edit-account-data': {
        id: 'edit-account-data',
        name: 'Edit Account Data',
        description: 'Edit existing records in the system',
        category: 'data',
    },
    'delete-account-data': {
        id: 'delete-account-data',
        name: 'Delete Account Data',
        description: 'Delete records from the system (admin only)',
        category: 'data',
    },

    // System Permissions
    'manage-system-settings': {
        id: 'manage-system-settings',
        name: 'Manage System Settings',
        description: 'Access and modify system configuration',
        category: 'system',
    },
    'manage-users': {
        id: 'manage-users',
        name: 'Manage Users',
        description: 'Create, edit, and manage user accounts',
        category: 'system',
    },
    'manage-branch-operations': {
        id: 'manage-branch-operations',
        name: 'Manage Branch Operations',
        description: 'Manage branch-level operations and settings',
        category: 'system',
    },
    'manage-account': {
        id: 'manage-account',
        name: 'Manage Account',
        description: 'Manage account-level settings (owner only)',
        category: 'system',
    },
    'manage-subscription': {
        id: 'manage-subscription',
        name: 'Manage Subscription',
        description: 'Manage subscription and billing (owner only)',
        category: 'system',
    },
    'manage-shop': {
        id: 'manage-shop',
        name: 'Manage Online Shop',
        description: 'Manage online shop settings and orders',
        category: 'operations',
    },
    'manage-loyalty': {
        id: 'manage-loyalty',
        name: 'Manage Loyalty Program',
        description: 'Configure and manage loyalty program',
        category: 'operations',
    },
};

/**
 * Role-to-Permission mapping
 * Defines which permissions each role has access to
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
    /**
     * Account Owner - Full system access
     */
    account_owner: ['*'], // Wildcard = all permissions

    /**
     * Admin - Full system access (same as owner)
     */
    admin: ['*'],

    /**
     * Warehouse Manager - Inventory and product management
     */
    warehouse_manager: [
        'access-dashboard',
        'access-account-data',
        'manage-products',
        'manage-inventory',
        'manage-suppliers',
        'create-account-data',
        'edit-account-data',
    ],

    /**
     * Sales Staff - Sales, customers, and services
     */
    sales_staff: [
        'access-dashboard',
        'access-account-data',
        'manage-sales',
        'manage-customers',
        'manage-services',
        'manage-vehicles',
        'manage-rentals',
    ],

    /**
     * Accountant - Financial data and reports
     */
    accountant: [
        'access-dashboard',
        'access-account-data',
        'view-financial-reports',
        'manage-expenses',
        'manage-expense-categories',
        'view-reports',
    ],

    /**
     * Cashier - POS and basic sales only
     */
    cashier: [
        'access-dashboard',
        'manage-sales',
    ],

    /**
     * Tailor - Service management only
     */
    tailor: [
        'access-dashboard',
        'access-account-data',
        'manage-services',
        'manage-vehicles',
    ],

    /**
     * Branch Manager - Reports and user management
     */
    branch_manager: [
        'access-dashboard',
        'access-account-data',
        'view-reports',
        'manage-users',
        'manage-branch-operations',
    ],
};

/**
 * Get all permissions for a specific role
 */
export function getRolePermissions(role: string): string[] {
    return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: string, permission: string): boolean {
    const rolePermissions = getRolePermissions(role);

    // Check for wildcard permission
    if (rolePermissions.includes('*')) {
        return true;
    }

    return rolePermissions.includes(permission);
}

/**
 * Get all permissions in a category
 */
export function getPermissionsByCategory(category: PermissionConfig['category']): PermissionConfig[] {
    return Object.values(PERMISSIONS).filter(permission => permission.category === category);
}

/**
 * Get permission by ID
 */
export function getPermission(permissionId: string): PermissionConfig | undefined {
    return PERMISSIONS[permissionId];
}
