/**
 * usePermissions Hook
 *
 * Permission-based access control hook.
 * Replaces hard-coded role checks with flexible permission-based checks.
 */

import React from 'react';
import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { ROLE_PERMISSIONS } from '@/config/permissions';

/**
 * Permission hook return type
 */
interface UsePermissionsReturn {
    /**
     * Check if current user has a specific permission
     */
    can: (permission: string) => boolean;

    /**
     * Check if current user has ANY of the given permissions
     */
    canAny: (permissions: string[]) => boolean;

    /**
     * Check if current user has ALL of the given permissions
     */
    canAll: (permissions: string[]) => boolean;

    /**
     * Check if current user does NOT have a permission
     */
    cannot: (permission: string) => boolean;

    /**
     * Get all permissions for current user
     */
    getPermissions: () => string[];

    /**
     * Current user's role
     */
    role: string;
}

/**
 * Permission check hook
 *
 * Usage:
 * ```tsx
 * const { can } = usePermissions();
 *
 * {can('view-financial-reports') && (
 *   <FinancialSection />
 * )}
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    /**
     * Get all permissions for the current user's role
     */
    const getPermissions = (): string[] => {
        return ROLE_PERMISSIONS[user.role] || [];
    };

    /**
     * Check if user has a specific permission
     */
    const can = (permission: string): boolean => {
        const userPermissions = getPermissions();

        // Check for wildcard permission (admin/owner)
        if (userPermissions.includes('*')) {
            return true;
        }

        // Check for specific permission
        return userPermissions.includes(permission);
    };

    /**
     * Check if user has ANY of the given permissions
     */
    const canAny = (permissions: string[]): boolean => {
        return permissions.some(permission => can(permission));
    };

    /**
     * Check if user has ALL of the given permissions
     */
    const canAll = (permissions: string[]): boolean => {
        return permissions.every(permission => can(permission));
    };

    /**
     * Check if user does NOT have a permission
     */
    const cannot = (permission: string): boolean => {
        return !can(permission);
    };

    return {
        can,
        canAny,
        canAll,
        cannot,
        getPermissions,
        role: user.role,
    };
}

/**
 * Helper hook for checking a single permission
 *
 * Usage:
 * ```tsx
 * const hasFinancialAccess = usePermission('view-financial-reports');
 *
 * {hasFinancialAccess && <FinancialSection />}
 * ```
 */
export function usePermission(permission: string): boolean {
    const { can } = usePermissions();
    return can(permission);
}
