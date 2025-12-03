<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class AccountPayment extends Model
{
    protected $fillable = [
        'account_id',
        'amount',
        'due_date',
        'paid_date',
        'status',
        'notes',
        'processed_by',
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function isOverdue(): bool
    {
        if ($this->status === 'paid') {
            return false;
        }

        return $this->due_date < Carbon::today();
    }

    public function markAsPaid(?string $notes = null): void
    {
        $this->update([
            'status' => 'paid',
            'paid_date' => Carbon::today(),
            'notes' => $notes,
            'processed_by' => auth()->id(),
        ]);
    }

    public function markAsUnpaid(?string $notes = null): void
    {
        $this->update([
            'status' => 'pending',
            'paid_date' => null,
            'notes' => $notes,
            'processed_by' => auth()->id(),
        ]);
    }
}
