<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class AsyncJob extends Model
{
    protected $fillable = [
        'job_id',
        'account_id',
        'user_id',
        'type',
        'status',
        'message',
        'input_data',
        'result_data',
        'idempotency_key',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'input_data' => 'array',
        'result_data' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->job_id)) {
                $model->job_id = Str::uuid()->toString();
            }
        });
    }

    /**
     * Get the account that owns this job
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the user who initiated this job
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to filter by account
     */
    public function scopeByAccount($query, int $accountId)
    {
        return $query->where('account_id', $accountId);
    }

    /**
     * Scope to filter by type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Check if job is pending
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if job is in progress
     */
    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }

    /**
     * Check if job is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if job has failed
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Check if job is finished (completed or failed)
     */
    public function isFinished(): bool
    {
        return in_array($this->status, ['completed', 'failed']);
    }

    /**
     * Mark job as started/processing
     */
    public function markAsStarted(?string $message = null): void
    {
        $this->update([
            'status' => 'processing',
            'message' => $message ?? 'Emal edilir...',
            'started_at' => now(),
        ]);
    }

    /**
     * Update job message
     */
    public function updateMessage(string $message): void
    {
        $this->update(['message' => $message]);
    }

    /**
     * Mark job as completed
     */
    public function markAsCompleted(?string $message = null, array $resultData = []): void
    {
        $this->update([
            'status' => 'completed',
            'message' => $message ?? 'Uğurla tamamlandı',
            'result_data' => $resultData,
            'completed_at' => now(),
        ]);
    }

    /**
     * Mark job as failed
     */
    public function markAsFailed(string $errorMessage): void
    {
        $this->update([
            'status' => 'failed',
            'message' => $errorMessage,
            'completed_at' => now(),
        ]);
    }

    /**
     * Find job by idempotency key
     */
    public static function findByIdempotencyKey(int $accountId, string $key): ?self
    {
        return static::where('account_id', $accountId)
            ->where('idempotency_key', $key)
            ->where('created_at', '>=', now()->subMinutes(5)) // 5 minute window
            ->first();
    }

    /**
     * Generate idempotency key from request data
     */
    public static function generateIdempotencyKey(int $accountId, int $userId, array $data): string
    {
        $keyData = [
            'account_id' => $accountId,
            'user_id' => $userId,
            'warehouse_id' => $data['warehouse_id'] ?? null,
            'supplier_id' => $data['supplier_id'] ?? null,
            'products' => array_map(function ($p) {
                return [
                    'product_id' => $p['product_id'] ?? null,
                    'quantity' => $p['quantity'] ?? null,
                ];
            }, $data['products'] ?? []),
        ];

        return 'gr:' . md5(json_encode($keyData));
    }
}
