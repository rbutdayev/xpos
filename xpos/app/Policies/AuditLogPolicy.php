<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AuditLogPolicy extends BasePolicy
{
    protected const VIEWER_ROLES = ['admin', 'account_owner'];
    protected const STAFF_ROLES = ['admin', 'account_owner'];
    protected const MANAGER_ROLES = ['admin', 'account_owner'];
    protected const ADMIN_ROLES = ['admin', 'account_owner'];

    public function viewAny(User $user): bool
    {
        return $user->hasRole(static::VIEWER_ROLES);
    }

    public function view(User $user, Model $model): bool
    {
        return $this->belongsToUserAccount($user, $model) && 
               $user->hasRole(static::VIEWER_ROLES);
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Model $model): bool
    {
        return false;
    }

    public function delete(User $user, Model $model): bool
    {
        return false;
    }
}