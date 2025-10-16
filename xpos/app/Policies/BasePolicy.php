<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

abstract class BasePolicy
{
    /**
     * Admin roles that can perform most actions
     */
    protected const ADMIN_ROLES = ['admin', 'account_owner'];
    
    /**
     * Manager roles that can perform management actions
     */
    protected const MANAGER_ROLES = ['admin', 'account_owner'];
    
    /**
     * Staff roles that can perform basic operations
     */
    protected const STAFF_ROLES = ['admin', 'account_owner', 'branch_manager', 'warehouse_manager', 'sales_staff', 'cashier', 'accountant', 'tailor'];

    /**
     * View-only roles
     */
    protected const VIEWER_ROLES = ['admin', 'account_owner', 'branch_manager', 'warehouse_manager', 'sales_staff', 'cashier', 'accountant', 'tailor'];

    /**
     * Check if user can view any records (index page)
     */
    protected function canViewAny(User $user): bool
    {
        return $user->hasRole(static::VIEWER_ROLES);
    }

    /**
     * Check if user can view specific record
     */
    protected function canView(User $user, Model $model): bool
    {
        return $this->belongsToUserAccount($user, $model) && 
               $user->hasRole(static::VIEWER_ROLES);
    }

    /**
     * Check if user can create records
     */
    protected function canCreate(User $user): bool
    {
        return $user->hasRole(static::STAFF_ROLES);
    }

    /**
     * Check if user can update records
     */
    protected function canUpdate(User $user, Model $model): bool
    {
        return $this->belongsToUserAccount($user, $model) && 
               $user->hasRole(static::STAFF_ROLES);
    }

    /**
     * Check if user can delete records
     */
    protected function canDelete(User $user, Model $model): bool
    {
        return $this->belongsToUserAccount($user, $model) && 
               $user->hasRole(static::MANAGER_ROLES);
    }

    /**
     * Check if model belongs to user's account (multi-tenant check)
     */
    protected function belongsToUserAccount(User $user, Model $model): bool
    {
        if (!$model->hasAttribute('account_id')) {
            return true; // If no account_id, allow access
        }
        
        return $user->account_id === $model->account_id;
    }

    /**
     * Check if user has admin privileges
     */
    protected function isAdmin(User $user): bool
    {
        return $user->hasRole(static::ADMIN_ROLES);
    }

    /**
     * Check if user has manager privileges
     */
    protected function isManager(User $user): bool
    {
        return $user->hasRole(static::MANAGER_ROLES);
    }

    /**
     * Override these methods in child policies for custom permissions
     */
    
    public function viewAny(User $user): bool
    {
        return $this->canViewAny($user);
    }

    public function view(User $user, Model $model): bool
    {
        return $this->canView($user, $model);
    }

    public function create(User $user): bool
    {
        return $this->canCreate($user);
    }

    public function update(User $user, Model $model): bool
    {
        return $this->canUpdate($user, $model);
    }

    public function delete(User $user, Model $model): bool
    {
        return $this->canDelete($user, $model);
    }

    public function restore(User $user, Model $model): bool
    {
        return false; // Default: no restore capability
    }

    public function forceDelete(User $user, Model $model): bool
    {
        return false; // Default: no force delete capability
    }
}