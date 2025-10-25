<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TelegramLog extends Model
{
    protected $fillable = [
        'account_id',
        'chat_id',
        'message',
        'status',
        'error_message',
        'telegram_message_id',
        'response_data',
    ];

    protected $casts = [
        'response_data' => 'array',
    ];

    /**
     * Get the account that owns this log (multi-tenant relationship)
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Mark the message as sent
     */
    public function markAsSent(int $telegramMessageId, ?array $responseData = null): void
    {
        $this->update([
            'status' => 'sent',
            'telegram_message_id' => $telegramMessageId,
            'response_data' => $responseData,
            'error_message' => null,
        ]);
    }

    /**
     * Mark the message as failed
     */
    public function markAsFailed(string $error): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $error,
        ]);
    }

    /**
     * Scope for multi-tenant isolation
     */
    public function scopeForAccount($query, int $accountId)
    {
        return $query->where('account_id', $accountId);
    }

    /**
     * Scope to get only sent messages
     */
    public function scopeSent($query)
    {
        return $query->where('status', 'sent');
    }

    /**
     * Scope to get only failed messages
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope to get only pending messages
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
