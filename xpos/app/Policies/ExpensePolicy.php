<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ExpensePolicy extends BasePolicy
{
    /**
     * Roles that can manage expenses
     */
    protected const EXPENSE_MANAGERS = ['admin', 'account_owner', 'accountant'];
    
    /**
     * Roles that can view expenses
     */
    protected const EXPENSE_VIEWERS = ['admin', 'account_owner', 'accountant', 'sales_staff'];

    public function viewAny(User $user): bool
    {
        return $user->hasRole(static::EXPENSE_VIEWERS);
    }

    public function view(User $user, Model $model): bool
    {
        return $this->belongsToUserAccount($user, $model) && 
               $user->hasRole(static::EXPENSE_VIEWERS);
    }

    public function create(User $user): bool
    {
        return $user->hasRole(static::EXPENSE_MANAGERS);
    }

    public function update(User $user, Model $model): bool
    {
        return $this->belongsToUserAccount($user, $model) && 
               $user->hasRole(static::EXPENSE_MANAGERS);
    }

    public function delete(User $user, Model $model): bool
    {
        return $this->belongsToUserAccount($user, $model) && 
               $user->hasRole(static::ADMIN_ROLES);
    }

    /**
     * Determine if user can download expense receipts
     */
    public function downloadReceipt(User $user, Model $model): bool
    {
        return $this->view($user, $model);
    }
}