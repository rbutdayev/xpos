<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FiscalPrinterJob extends Model
{
    protected $fillable = [
        'account_id',
        'sale_id',
        'return_id',
        'status',
        'request_data',
        'response_data',
        'provider',
        'fiscal_number',
        'fiscal_document_id',
        'error_message',
        'picked_up_at',
        'completed_at',
        'retry_count',
        'next_retry_at',
        'is_retriable',
    ];

    protected $casts = [
        'request_data' => 'array',
        'response_data' => 'array',
        'picked_up_at' => 'datetime',
        'completed_at' => 'datetime',
        'next_retry_at' => 'datetime',
        'is_retriable' => 'boolean',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    /**
     * Mark job as picked up by bridge
     */
    public function markAsProcessing(): void
    {
        $this->update([
            'status' => self::STATUS_PROCESSING,
            'picked_up_at' => now(),
        ]);
    }

    /**
     * Mark job as completed
     *
     * @param string $fiscalNumber The display number (e.g., "60")
     * @param string|null $fiscalDocumentId The document ID hash for Caspos (e.g., "EMnVW3qyEbUSsJ4xTJbMytDStusgXMDauaCQxdJE1wuM")
     * @param array|null $response Full response from fiscal printer
     */
    public function markAsCompleted(string $fiscalNumber, ?string $fiscalDocumentId = null, ?array $response = null): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'fiscal_number' => $fiscalNumber,
            'fiscal_document_id' => $fiscalDocumentId,
            'completed_at' => now(),
        ]);

        // Update the sale with fiscal number and document ID ONLY if this is a sale (not a return)
        if ($this->sale_id && !$this->return_id && $this->sale) {
            $this->sale->update([
                'fiscal_number' => $fiscalNumber,
                'fiscal_document_id' => $fiscalDocumentId,
            ]);
        }

        // Update the return with fiscal number and document ID if this is a return
        if ($this->return_id && $this->return) {
            $this->return->update([
                'fiscal_number' => $fiscalNumber,
                'fiscal_document_id' => $fiscalDocumentId,
            ]);
        }
    }

    /**
     * Mark job as failed
     */
    public function markAsFailed(string $errorMessage, bool $isRetriable = true): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'error_message' => $errorMessage,
            'completed_at' => now(),
            'retry_count' => $this->retry_count + 1,
            'is_retriable' => $isRetriable,
        ]);
    }

    /**
     * Check if job can be retried
     */
    public function canRetry(): bool
    {
        return $this->is_retriable && $this->retry_count < 3;
    }

    /**
     * Retry the job with exponential backoff
     */
    public function retry(): void
    {
        // Exponential backoff: 30s, 60s, 120s
        $delaySeconds = 30 * pow(2, $this->retry_count);

        $this->update([
            'status' => self::STATUS_PENDING,
            'picked_up_at' => null,
            'completed_at' => null,
            'error_message' => null,
            'next_retry_at' => now()->addSeconds($delaySeconds),
        ]);
    }

    /**
     * Check if error message indicates non-retriable error
     */
    public static function isNonRetriableError(string $errorMessage): bool
    {
        $nonRetriablePatterns = [
            'Təkrar satış', // Duplicate sale (Azerbaijani)
            'duplicate sale', // Duplicate sale (English)
            'already printed', // Already processed
            'already exists', // Duplicate
        ];

        $errorLower = mb_strtolower($errorMessage);

        foreach ($nonRetriablePatterns as $pattern) {
            if (str_contains($errorLower, mb_strtolower($pattern))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Relationships
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id', 'sale_id');
    }

    public function return(): BelongsTo
    {
        return $this->belongsTo(SaleReturn::class, 'return_id', 'return_id');
    }
}
