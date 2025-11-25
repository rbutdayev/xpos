<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FiscalPrinterLog extends Model
{
    protected $fillable = [
        'account_id',
        'sale_id',
        'status',
        'request_data',
        'response_data',
        'fiscal_number',
        'error_message',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id', 'sale_id');
    }

    public function markAsSuccess(array $response): void
    {
        $this->update([
            'status' => 'success',
            'response_data' => json_encode($response),
            'fiscal_number' => $response['fiscal_number'] ?? null,
            'error_message' => null,
        ]);
    }

    public function markAsFailed(string $error): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $error,
        ]);
    }
}
