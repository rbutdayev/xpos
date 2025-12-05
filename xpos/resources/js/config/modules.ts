/**
 * xPOS Module Registry
 *
 * Centralized module configuration for feature management.
 * Controls which features are available based on account settings and user roles.
 */

import React from 'react';
import {
    WrenchScrewdriverIcon,
    ClockIcon,
    ShoppingBagIcon,
    GiftIcon,
    ReceiptPercentIcon,
} from '@heroicons/react/24/outline';

/**
 * Module configuration interface
 */
export interface ModuleConfig {
    id: string;
    name: string;
    nameAz: string; // Azerbaijani translation
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    flagKey: 'services_module_enabled' | 'rent_module_enabled' | 'shop_enabled' | 'loyalty_module_enabled' | 'discounts_module_enabled';
    routes: string[];
    permissions: string[];
    requiredRoles: string[];
    dependencies?: string[]; // Other module IDs required
    category: 'sales' | 'inventory' | 'finance' | 'customer';
}

/**
 * Module registry - single source of truth for all system modules
 */
export const MODULES: Record<string, ModuleConfig> = {
    services: {
        id: 'services',
        name: 'Service Management',
        nameAz: 'Xidmət İdarəetməsi',
        description: 'Təmir və servis xidmətlərinin idarə edilməsi',
        icon: WrenchScrewdriverIcon,
        flagKey: 'services_module_enabled',
        routes: [
            '/services',
            '/services/:serviceType',
            '/customer-items',
            '/tailor-services'
        ],
        permissions: ['manage-services', 'manage-vehicles'],
        requiredRoles: ['admin', 'account_owner', 'sales_staff', 'tailor'],
        category: 'sales',
    },

    rentals: {
        id: 'rentals',
        name: 'Rental Management',
        nameAz: 'İcarə İdarəetməsi',
        description: 'Avadanlıq və məhsulların icarəyə verilməsi',
        icon: ClockIcon,
        flagKey: 'rent_module_enabled',
        routes: [
            '/rentals',
            '/rentals/calendar',
            '/rental-inventory',
            '/rental-categories',
            '/rental-templates'
        ],
        permissions: ['manage-rentals'],
        requiredRoles: ['admin', 'account_owner', 'sales_staff'],
        category: 'sales',
    },

    shop: {
        id: 'shop',
        name: 'Online Shop',
        nameAz: 'Online Mağaza',
        description: 'E-commerce və online satış platforması',
        icon: ShoppingBagIcon,
        flagKey: 'shop_enabled',
        routes: [
            '/online-orders',
            '/shop/settings'
        ],
        permissions: ['manage-shop'],
        requiredRoles: ['admin', 'account_owner'],
        dependencies: ['sms'], // Requires SMS to be configured for notifications
        category: 'sales',
    },

    loyalty: {
        id: 'loyalty',
        name: 'Loyalty Program',
        nameAz: 'Loyallıq Proqramı',
        description: 'Müştəri loyallığı və mükafatlar sistemi',
        icon: GiftIcon,
        flagKey: 'loyalty_module_enabled',
        routes: [
            '/loyalty-program',
            '/products/loyalty'
        ],
        permissions: ['manage-loyalty'],
        requiredRoles: ['admin', 'account_owner'],
        category: 'customer',
    },

    discounts: {
        id: 'discounts',
        name: 'Discount System',
        nameAz: 'Endirim Sistemi',
        description: 'Məhsul endirimlər və promosyonları',
        icon: ReceiptPercentIcon,
        flagKey: 'discounts_module_enabled',
        routes: [
            '/products/discounts'
        ],
        permissions: ['manage-products'],
        requiredRoles: ['admin', 'account_owner'],
        category: 'sales',
    },
};

/**
 * Get all modules in a specific category
 */
export function getModulesByCategory(category: ModuleConfig['category']): ModuleConfig[] {
    return Object.values(MODULES).filter(module => module.category === category);
}

/**
 * Get module by ID
 */
export function getModule(moduleId: string): ModuleConfig | undefined {
    return MODULES[moduleId];
}

/**
 * Get all module IDs
 */
export function getAllModuleIds(): string[] {
    return Object.keys(MODULES);
}

/**
 * Check if a route belongs to a module
 */
export function getModuleForRoute(route: string): ModuleConfig | undefined {
    return Object.values(MODULES).find(module =>
        module.routes.some(moduleRoute => {
            // Handle route parameters like :serviceType
            const routePattern = moduleRoute.replace(/:\w+/g, '[^/]+');
            const regex = new RegExp(`^${routePattern}$`);
            return regex.test(route);
        })
    );
}
