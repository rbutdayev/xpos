/**
 * useModuleAccess Hook
 *
 * Centralized module access control hook.
 * Determines which modules a user can access based on:
 * 1. Account-level module flags
 * 2. User role
 * 3. Module dependencies
 */

import { usePage } from '@inertiajs/react';
import { MODULES, ModuleConfig, getModule } from '@/config/modules';
import { PageProps } from '@/types';

/**
 * Module flags interface matching backend props
 */
interface ModuleFlags {
    shopEnabled?: boolean;
    loyaltyEnabled?: boolean;
    servicesEnabled?: boolean;
    rentEnabled?: boolean;
    discountsEnabled?: boolean;
    smsConfigured?: boolean;
    woltEnabled?: boolean;
    yangoEnabled?: boolean;
    boltEnabled?: boolean;
}

/**
 * Module access hook return type
 */
interface UseModuleAccessReturn {
    /**
     * Check if a module is enabled at account level
     */
    isModuleEnabled: (moduleId: string) => boolean;

    /**
     * Check if current user can access a module
     * (considers both module enabled status and user role)
     */
    canAccessModule: (moduleId: string) => boolean;

    /**
     * Get all modules that the current user can access
     */
    getEnabledModules: () => ModuleConfig[];

    /**
     * Get modules by category that user can access
     */
    getModulesByCategory: (category: ModuleConfig['category']) => ModuleConfig[];

    /**
     * Get all modules (regardless of access)
     */
    getAllModules: () => Record<string, ModuleConfig>;

    /**
     * Check if any online ordering is enabled (shop OR delivery platforms)
     */
    hasAnyOnlineOrdering: () => boolean;

    /**
     * Module flags from backend
     */
    flags: ModuleFlags;
}

/**
 * Hook for managing module access control
 */
export function useModuleAccess(): UseModuleAccessReturn {
    const page = usePage<PageProps>();
    const user = page.props.auth.user;

    // Get module flags from Inertia props
    const flags: ModuleFlags = {
        shopEnabled: page.props.shopEnabled as boolean | undefined,
        loyaltyEnabled: page.props.loyaltyEnabled as boolean | undefined,
        servicesEnabled: page.props.servicesEnabled as boolean | undefined,
        rentEnabled: page.props.rentEnabled as boolean | undefined,
        discountsEnabled: page.props.discountsEnabled as boolean | undefined,
        smsConfigured: page.props.smsConfigured as boolean | undefined,
        woltEnabled: page.props.woltEnabled as boolean | undefined,
        yangoEnabled: page.props.yangoEnabled as boolean | undefined,
        boltEnabled: page.props.boltEnabled as boolean | undefined,
    };

    /**
     * Check if module is enabled at account level
     */
    const isModuleEnabled = (moduleId: string): boolean => {
        const module = getModule(moduleId);
        if (!module) {
            console.warn(`Module "${moduleId}" not found in registry`);
            return false;
        }

        // Special case for SMS module - check if SMS credentials exist
        if (moduleId === 'sms') {
            return flags.smsConfigured === true;
        }

        // Modules without flagKey cannot be checked
        if (!module.flagKey) {
            return false;
        }

        // Map flag keys to boolean values
        const flagMap: Record<string, boolean | undefined> = {
            services_module_enabled: flags.servicesEnabled,
            rent_module_enabled: flags.rentEnabled,
            shop_enabled: flags.shopEnabled,
            loyalty_module_enabled: flags.loyaltyEnabled,
            discounts_module_enabled: flags.discountsEnabled,
        };

        return flagMap[module.flagKey] === true;
    };

    /**
     * Check if user can access a module
     * (combines module enabled status, user role, and dependencies)
     */
    const canAccessModule = (moduleId: string): boolean => {
        const module = getModule(moduleId);
        if (!module) {
            console.warn(`Module "${moduleId}" not found in registry`);
            return false;
        }

        // 1. Check if module is enabled at account level
        if (!isModuleEnabled(moduleId)) {
            return false;
        }

        // 2. Check if user's role is allowed to access this module
        if (!module.requiredRoles.includes(user.role)) {
            return false;
        }

        // 3. Check if all dependency modules are also accessible
        if (module.dependencies) {
            const allDepsAccessible = module.dependencies.every(depId =>
                canAccessModule(depId)
            );
            if (!allDepsAccessible) {
                return false;
            }
        }

        return true;
    };

    /**
     * Get all modules that user can access
     */
    const getEnabledModules = (): ModuleConfig[] => {
        return Object.values(MODULES).filter(module =>
            canAccessModule(module.id)
        );
    };

    /**
     * Get modules by category that user can access
     */
    const getModulesByCategory = (category: ModuleConfig['category']): ModuleConfig[] => {
        return getEnabledModules().filter(module => module.category === category);
    };

    /**
     * Get all modules (for admin/settings purposes)
     */
    const getAllModules = (): Record<string, ModuleConfig> => {
        return MODULES;
    };

    /**
     * Check if any online ordering is enabled (shop OR delivery platforms)
     * This is used for showing the "Online Orders" menu in the sidebar
     */
    const hasAnyOnlineOrdering = (): boolean => {
        // Check if e-commerce shop is enabled with SMS
        const shopAccessible = canAccessModule('shop');

        // Check if any delivery platform is enabled
        const anyPlatformEnabled = !!(flags.woltEnabled || flags.yangoEnabled || flags.boltEnabled);

        // User must have proper role to see online orders
        const hasProperRole = ['admin', 'account_owner', 'sales_staff', 'branch_manager', 'accountant'].includes(user.role);

        return (shopAccessible || anyPlatformEnabled) && hasProperRole;
    };

    return {
        isModuleEnabled,
        canAccessModule,
        getEnabledModules,
        getModulesByCategory,
        getAllModules,
        hasAnyOnlineOrdering,
        flags,
    };
}

/**
 * Helper hook to check a single module
 */
export function useModule(moduleId: string) {
    const { canAccessModule, isModuleEnabled } = useModuleAccess();
    const module = getModule(moduleId);

    return {
        module,
        canAccess: canAccessModule(moduleId),
        isEnabled: isModuleEnabled(moduleId),
    };
}
