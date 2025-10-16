<?php

namespace App\Policies;

use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class StockMovementPolicy extends BasePolicy
{
    /**
     * Determine whether the user can select different employees for stock movements.
     */
    public function selectEmployee(User $user): bool
    {
        return $user->isAdmin(); // Only admin and account_owner can select different employees
    }
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasWarehouseRole();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasWarehouseRole();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Model $model): bool
    {
        return $this->belongsToUserAccount($user, $model) && 
               $user->hasWarehouseRole();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Model $model): bool
    {
        return $this->belongsToUserAccount($user, $model) && 
               $user->hasManagerRole();
    }
}
