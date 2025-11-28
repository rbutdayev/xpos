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
        shopEnabled: page.props.shopEnabled,
        loyaltyEnabled: page.props.loyaltyEnabled,
        servicesEnabled: page.props.servicesEnabled,
        rentEnabled: page.props.rentEnabled,
        discountsEnabled: page.props.discountsEnabled,
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

    return {
        isModuleEnabled,
        canAccessModule,
        getEnabledModules,
        getModulesByCategory,
        getAllModules,
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
