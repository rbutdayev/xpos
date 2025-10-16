<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Product;
use Illuminate\Database\Eloquent\Model;

class ProductPolicy extends BasePolicy
{
    /**
     * Roles that can manage products
     */
    protected const PRODUCT_MANAGER_ROLES = ['admin', 'account_owner', 'sales_staff'];
    
    /**
     * Roles that can view products
     */
    protected const PRODUCT_VIEWER_ROLES = ['admin', 'account_owner', 'branch_manager', 'warehouse_manager', 'sales_staff', 'cashier', 'accountant', 'tailor'];

    public function viewAny(User $user): bool
    {
        return $user->isActive() && $user->hasRole(static::PRODUCT_VIEWER_ROLES);
    }

    public function view(User $user, Model $model): bool
    {
        return $user->isActive() && 
               $this->belongsToUserAccount($user, $model) && 
               $user->hasRole(static::PRODUCT_VIEWER_ROLES);
    }

    public function create(User $user): bool
    {
        return $user->isActive() && $user->hasRole(static::PRODUCT_MANAGER_ROLES);
    }

    public function update(User $user, Model $model): bool
    {
        return $user->isActive() && 
               $this->belongsToUserAccount($user, $model) && 
               $user->hasRole(static::PRODUCT_MANAGER_ROLES);
    }

    public function delete(User $user, Model $model): bool
    {
        return $user->isActive() && 
               $this->belongsToUserAccount($user, $model) && 
               $user->hasRole(static::ADMIN_ROLES);
    }
}