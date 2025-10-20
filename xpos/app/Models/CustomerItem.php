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
        'service_type',         // Service sector: tailor, phone_repair, electronics, retail, general
        'item_type',            // e.g., "Jacket", "Dress", "Suit" (tailor) or "iPhone 13", "TV" (other services)
        'description',          // Detailed description
        'fabric_type',          // e.g., "Cotton", "Wool", "Polyester" (mainly for tailor)
        'size',                 // e.g., "M", "L", "42"
        'color',
        'measurements',         // JSON field for customer measurements (flexible for all services)
        'reference_number',     // Reference number for the item
        'received_date',        // When item was received
        'status',               // Lifecycle: received, in_service, completed, delivered
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
        'status_text',
        'status_color',
    ];

    protected static function boot()
    {
        parent::boot();

        // Set default status and generate reference number when creating
        static::creating(function ($customerItem) {
            if (!$customerItem->status) {
                $customerItem->status = 'received';
            }

            // Set default service_type if not provided
            if (!$customerItem->service_type) {
                $customerItem->service_type = 'tailor';
            }

            // Auto-generate reference number if not provided
            if (!$customerItem->reference_number) {
                $customerItem->reference_number = static::generateReferenceNumber($customerItem->account_id ?? auth()->user()->account_id);
            }

            // Auto-set account_id if not set
            if (!$customerItem->account_id && auth()->check()) {
                $customerItem->account_id = auth()->user()->account_id;
            }
        });
    }

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
     * Scope to filter by service type
     */
    public function scopeByServiceType(Builder $query, string $serviceType): Builder
    {
        return $query->where('service_type', $serviceType);
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
              ->orWhere('fabric_type', 'like', "%{$search}%")
              ->orWhere('reference_number', 'like', "%{$search}%")
              ->orWhere('color', 'like', "%{$search}%")
              ->orWhereHas('customer', function($customerQuery) use ($search) {
                  $customerQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('phone', 'like', "%{$search}%");
              });
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

    /**
     * Get status text in Azerbaijani
     */
    public function getStatusTextAttribute(): string
    {
        return match($this->status ?? 'received') {
            'received' => 'Qəbul edildi',
            'in_service' => 'İşdə',
            'completed' => 'Hazır',
            'delivered' => 'Təhvil verildi',
            default => 'Qəbul edildi',
        };
    }

    /**
     * Get status color for UI
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status ?? 'received') {
            'received' => 'blue',
            'in_service' => 'yellow',
            'completed' => 'green',
            'delivered' => 'gray',
            default => 'gray',
        };
    }

    /**
     * Scope to filter by status
     */
    public function scopeByStatus(Builder $query, string|array $status): Builder
    {
        if (is_array($status)) {
            return $query->whereIn('status', $status);
        }
        return $query->where('status', $status);
    }

    /**
     * Check if item is available for new service
     * Only items with 'received' status are available for new services
     * Completed/delivered items should not be available
     */
    public function scopeAvailableForService(Builder $query): Builder
    {
        return $query->where('status', 'received');
    }

    /**
     * Generate unique reference number for customer item
     * Format: CI-YYYY-NNNN (CI = Customer Item)
     * ⚠️ CRITICAL: Must be scoped by account_id for multi-tenant!
     */
    public static function generateReferenceNumber(int $accountId): string
    {
        $year = date('Y');
        $prefix = "CI-{$year}-";

        // Get last reference number for this account and year
        $lastItem = static::whereHas('customer', function($q) use ($accountId) {
                $q->where('account_id', $accountId);
            })
            ->where('reference_number', 'like', "{$prefix}%")
            ->orderBy('reference_number', 'desc')
            ->first();

        if ($lastItem) {
            // Extract number from last reference: CI-2025-0001 → 0001
            $lastNumber = (int) substr($lastItem->reference_number, -4);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }
}
