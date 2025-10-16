<?php

namespace App\Traits;

trait HasStandardRoles
{
    /**
     * Standard role definitions for the application
     * Change these values in ONE place to update across entire app
     */
    
    public static function getAdminRoles(): array
    {
        return ['admin', 'account_owner'];
    }
    
    public static function getSuperAdminRoles(): array
    {
        return ['super_admin'];
    }
    
    public static function getManagerRoles(): array
    {
        return ['admin', 'account_owner'];
    }
    
    public static function getStaffRoles(): array
    {
        return ['admin', 'account_owner', 'branch_manager', 'warehouse_manager', 'sales_staff', 'cashier', 'accountant', 'tailor'];
    }

    public static function getViewerRoles(): array
    {
        return ['admin', 'account_owner', 'branch_manager', 'warehouse_manager', 'sales_staff', 'cashier', 'accountant', 'tailor'];
    }

    public static function getWarehouseRoles(): array
    {
        return ['admin', 'account_owner', 'warehouse_manager', 'sales_staff'];
    }

    public static function getFinancialRoles(): array
    {
        return ['admin', 'account_owner', 'accountant'];
    }

    public static function getSalesRoles(): array
    {
        return ['admin', 'account_owner', 'sales_staff', 'cashier'];
    }

    public static function getTailorRoles(): array
    {
        return ['admin', 'account_owner', 'tailor'];
    }

    /**
     * Check if user has any of the specified role types
     */
    public function hasAdminRole(): bool
    {
        return $this->hasRole(self::getAdminRoles());
    }
    
    public function hasManagerRole(): bool
    {
        return $this->hasRole(self::getManagerRoles());
    }
    
    public function hasStaffRole(): bool
    {
        return $this->hasRole(self::getStaffRoles());
    }
    
    public function hasViewerRole(): bool
    {
        return $this->hasRole(self::getViewerRoles());
    }
    
    public function hasWarehouseRole(): bool
    {
        return $this->hasRole(self::getWarehouseRoles());
    }
    
    public function hasFinancialRole(): bool
    {
        return $this->hasRole(self::getFinancialRoles());
    }
    
    public function hasSalesRole(): bool
    {
        return $this->hasRole(self::getSalesRoles());
    }

    public function hasTailorRole(): bool
    {
        return $this->hasRole(self::getTailorRoles());
    }

    public function hasSuperAdminRole(): bool
    {
        return $this->hasRole(self::getSuperAdminRoles());
    }
}