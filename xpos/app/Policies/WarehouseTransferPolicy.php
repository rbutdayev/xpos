<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WarehouseTransfer;
use Illuminate\Database\Eloquent\Model;

class WarehouseTransferPolicy extends BasePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasWarehouseRole();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Model $model): bool
    {
        return $this->belongsToUserAccount($user, $model) && 
               $user->hasWarehouseRole();
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
