<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TelegramCredential extends Model
{
    protected $fillable = [
        'account_id',
        'bot_token',
        'bot_username',
        'default_chat_id',
        'is_active',
        'last_tested_at',
        'last_test_status',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_tested_at' => 'datetime',
    ];

    protected $hidden = [
        'bot_token', // Hide sensitive token from JSON responses
    ];

    /**
     * Get the account that owns this credential (multi-tenant relationship)
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Mark the connection test as successful
     */
    public function markTestSuccessful(): void
    {
        $this->update([
            'last_tested_at' => now(),
            'last_test_status' => 'success',
        ]);
    }

    /**
     * Mark the connection test as failed
     */
    public function markTestFailed(string $error): void
    {
        $this->update([
            'last_tested_at' => now(),
            'last_test_status' => 'failed: ' . $error,
        ]);
    }

    /**
     * Scope to get only active credentials
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for multi-tenant isolation
     */
    public function scopeForAccount($query, int $accountId)
    {
        return $query->where('account_id', $accountId);
    }
}
