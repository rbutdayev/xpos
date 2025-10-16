<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ExpenseCategoryPolicy extends BasePolicy
{
    /**
     * Roles that can manage expense categories
     */
    protected const CATEGORY_MANAGERS = ['admin', 'account_owner', 'accountant'];
    
    /**
     * Roles that can view expense categories
     */
    protected const CATEGORY_VIEWERS = ['admin', 'account_owner', 'accountant', 'sales_staff'];

    public function viewAny(User $user): bool
    {
        return $user->hasRole(static::CATEGORY_VIEWERS);
    }

    public function view(User $user, Model $model): bool
    {
        return $this->belongsToUserAccount($user, $model) && 
               $user->hasRole(static::CATEGORY_VIEWERS);
    }

    public function create(User $user): bool
    {
        return $user->hasRole(static::CATEGORY_MANAGERS);
    }

    public function update(User $user, Model $model): bool
    {
        return $this->belongsToUserAccount($user, $model) && 
               $user->hasRole(static::CATEGORY_MANAGERS);
    }

    public function delete(User $user, Model $model): bool
    {
        return $this->belongsToUserAccount($user, $model) && 
               $user->hasRole(static::ADMIN_ROLES);
    }
}