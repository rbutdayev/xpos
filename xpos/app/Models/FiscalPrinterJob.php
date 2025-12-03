<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;
use App\Models\FiscalPrinterConfig;

class FiscalPrinterJob extends Model
{
    protected $fillable = [
        'account_id',
        'sale_id',
        'return_id',
        'status',
        'operation_type',
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

    const OPERATION_SALE = 'sale';
    const OPERATION_RETURN = 'return';
    const OPERATION_SHIFT_OPEN = 'shift_open';
    const OPERATION_SHIFT_CLOSE = 'shift_close';
    const OPERATION_SHIFT_STATUS = 'shift_status';
    const OPERATION_SHIFT_X_REPORT = 'shift_x_report';
    const OPERATION_CREDIT_PAY = 'credit_pay';
    const OPERATION_ADVANCE_SALE = 'advance_sale';
    const OPERATION_ADVANCE_SALE_ITEMS = 'advance_sale_items';
    const OPERATION_ADVANCE_PAY = 'advance_pay';
    const OPERATION_DEPOSIT = 'deposit';
    const OPERATION_WITHDRAW = 'withdraw';
    const OPERATION_OPEN_CASHBOX = 'open_cashbox';
    const OPERATION_CORRECTION = 'correction';
    const OPERATION_ROLLBACK = 'rollback';
    const OPERATION_PRINT_LAST = 'print_last';
    const OPERATION_PRINTER_CONNECTION = 'printer_connection';
    const OPERATION_PERIODIC_REPORT = 'periodic_report';
    const OPERATION_CONTROL_TAPE = 'control_tape';
    const OPERATION_LOGOUT = 'logout';

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
     * Mark shift operation as completed and update fiscal config
     */
    public function markShiftOperationCompleted(?array $response = null): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'response_data' => $response,
            'completed_at' => now(),
        ]);

        // Update fiscal config based on operation type
        $config = FiscalPrinterConfig::where('account_id', $this->account_id)
            ->where('is_active', true)
            ->first();

        if ($config && $response) {
            switch ($this->operation_type) {
                case self::OPERATION_SHIFT_OPEN:
                    $config->update([
                        'shift_open' => true,
                        'shift_opened_at' => now(),
                    ]);
                    break;

                case self::OPERATION_SHIFT_CLOSE:
                    $config->update([
                        'shift_open' => false,
                        'shift_opened_at' => null,
                        'last_z_report_at' => now(),
                    ]);
                    break;

                case self::OPERATION_SHIFT_STATUS:
                    // Parse shift status from response
                    $shiftOpen = $response['shift_open'] ?? $response['shiftStatus'] ?? false;
                    $shiftOpenTime = $response['shift_open_time'] ?? null;

                    $updateData = ['shift_open' => $shiftOpen];

                    if ($shiftOpen && $shiftOpenTime) {
                        try {
                            // Try different date formats (printer returns time in Azerbaijan timezone)
                            if (str_contains($shiftOpenTime, '.')) {
                                // Format: "d.m.Y H:i:s"
                                $updateData['shift_opened_at'] = \Carbon\Carbon::createFromFormat(
                                    'd.m.Y H:i:s',
                                    $shiftOpenTime,
                                    'Asia/Baku' // Azerbaijan timezone (UTC+4)
                                );
                            } else {
                                // ISO format or other
                                $updateData['shift_opened_at'] = \Carbon\Carbon::parse($shiftOpenTime, 'Asia/Baku');
                            }
                        } catch (\Exception $e) {
                            \Log::warning('Failed to parse shift open time', ['time' => $shiftOpenTime, 'error' => $e->getMessage()]);
                        }
                    } elseif (!$shiftOpen) {
                        $updateData['shift_opened_at'] = null;
                    }

                    $config->update($updateData);
                    break;
            }
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
