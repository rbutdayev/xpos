<?php

namespace App\Traits;

use App\Models\Account;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

trait BelongsToAccount
{
    /**
     * Boot the trait and add global scope for multi-tenancy
     */
    protected static function bootBelongsToAccount(): void
    {
        // Automatically set account_id when creating models
        static::creating(function (Model $model) {
            if (!isset($model->account_id) && Auth::check()) {
                $model->account_id = Auth::user()->account_id;
            }
        });

        // Add global scope to filter by account
        static::addGlobalScope('account', function (Builder $builder) {
            if (Auth::check() && Auth::user()->account_id) {
                $builder->where('account_id', Auth::user()->account_id);
            }
        });
    }

    /**
     * Define the relationship to the account
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Scope to filter by specific account
     */
    public function scopeForAccount(Builder $query, int $accountId): Builder
    {
        return $query->where('account_id', $accountId);
    }

    /**
     * Remove the global account scope temporarily
     */
    public function scopeWithoutAccountScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('account');
    }

    /**
     * Scope to filter by specific account (alias for forAccount)
     */
    public function scopeByAccount(Builder $query, int $accountId): Builder
    {
        return $query->forAccount($accountId);
    }
}