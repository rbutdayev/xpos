<?php

namespace App\Policies;

use App\Models\User;
use App\Models\LoyaltyCard;

class LoyaltyCardPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function view(User $user, LoyaltyCard $card): bool
    {
        return $user->isSuperAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function update(User $user, LoyaltyCard $card): bool
    {
        return $user->isSuperAdmin();
    }

    public function delete(User $user, LoyaltyCard $card): bool
    {
        return $user->isSuperAdmin();
    }

    public function assign(User $user): bool
    {
        return true;
    }

    public function unassign(User $user, LoyaltyCard $card): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $card->account_id === $user->account_id;
    }
}
