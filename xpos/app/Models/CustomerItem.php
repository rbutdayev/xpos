<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class CustomerItem extends Model
{
    use HasFactory, BelongsToAccount;

    protected $table = 'customer_items';

    protected $fillable = [
        'account_id',
        'customer_id',
        'item_type',            // e.g., "Jacket", "Dress", "Suit"
        'description',          // Detailed description
        'fabric_type',          // e.g., "Cotton", "Wool", "Polyester"
        'size',                 // e.g., "M", "L", "42"
        'color',
        'measurements',         // JSON field for customer measurements
        'reference_number',     // Reference number for the item
        'received_date',        // When item was received
        'is_active',
        'notes',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'measurements' => 'array',
            'received_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    protected $appends = [
        'full_description',
        'display_name',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the customer that owns this item
     * ⚠️ Multi-tenant: CustomerItem is scoped through customer's account
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get all tailor services for this item
     * (Replaces serviceRecords from old Vehicle model)
     */
    public function tailorServices(): HasMany
    {
        return $this->hasMany(TailorService::class, 'customer_item_id')
            ->whereHas('customer', function($q) {
                // Ensure we only get services from the same account
                if (auth()->check()) {
                    $q->where('account_id', auth()->user()->account_id);
                }
            });
    }

    /**
     * Scope to filter by customer's account
     * ⚠️ CRITICAL: Always use when querying across customers
     */
    public function scopeForAccount(Builder $query, int $accountId): Builder
    {
        return $query->whereHas('customer', function($q) use ($accountId) {
            $q->where('account_id', $accountId);
        });
    }

    /**
     * Scope to filter by item type
     */
    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('item_type', $type);
    }

    /**
     * Scope to search items
     */
    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(function($q) use ($search) {
            $q->where('item_type', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%")
              ->orWhere('fabric_type', 'like', "%{$search}%");
        });
    }

    /**
     * Get full item description
     * Example: "Blue Cotton Jacket (Size M)"
     */
    public function getFullDescriptionAttribute(): string
    {
        $parts = [];

        if ($this->color) {
            $parts[] = $this->color;
        }

        if ($this->fabric_type) {
            $parts[] = $this->fabric_type;
        }

        if ($this->item_type) {
            $parts[] = $this->item_type;
        }

        if ($this->size) {
            $parts[] = "(Size {$this->size})";
        }

        return implode(' ', $parts);
    }

    /**
     * Get short display name
     * Example: "Jacket #123"
     */
    public function getDisplayNameAttribute(): string
    {
        return ($this->item_type ?? 'Item') . ' #' . $this->id;
    }
}
