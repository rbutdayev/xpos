<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class TailorService extends Model
{
    use HasFactory, BelongsToAccount, SoftDeletes;

    protected $table = 'tailor_services';

    protected $fillable = [
        'account_id',                  // ⚠️ CRITICAL - Multi-tenant
        'customer_id',
        'customer_item_id',           // Foreign key to customer_items
        'branch_id',
        'employee_id',
        'service_number',             // e.g., "TS-2025-0001"
        'service_type',               // "alteration", "repair", "custom"
        'customer_item_condition',    // Text description of item condition
        'description',
        'materials_total',            // Total cost of materials used
        'labor_total',                // Total labor cost
        'total_cost',                 // Total cost
        'delivery_date',              // Expected delivery date
        'status',                     // pending, in_progress, completed, cancelled
        'service_date',
        'started_at',
        'completed_at',
        'notes',
        'payment_status',
        'paid_amount',
        'credit_amount',
        'credit_due_date',
        'customer_credit_id',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected function casts(): array
    {
        return [
            'materials_total' => 'decimal:2',
            'labor_total' => 'decimal:2',
            'total_cost' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'credit_amount' => 'decimal:2',
            'delivery_date' => 'datetime',
            'service_date' => 'date',
            'credit_due_date' => 'date',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    protected $appends = [
        'status_text',
        'status_color',
        'service_type_label',
        'is_overdue',
        'formatted_total_cost',
        'formatted_labor_cost',
        'duration',
        'payment_status_text',
        'payment_status_color'
    ];

    protected static function boot()
    {
        parent::boot();

        // Auto-generate service number on creation
        static::creating(function ($service) {
            if (!$service->service_number) {
                $service->service_number = static::generateServiceNumber($service->account_id);
            }

            // Auto-set account_id if not set
            if (!$service->account_id && auth()->check()) {
                $service->account_id = auth()->user()->account_id;
            }
        });

        static::saving(function ($tailorService) {
            // Automatically calculate total
            $tailorService->total_cost = ($tailorService->labor_total ?? 0) + ($tailorService->materials_total ?? 0);
        });
    }

    /**
     * Get the account that owns this service
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the customer
     * ⚠️ Must filter by account_id
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class)
            ->where('account_id', $this->account_id);
    }

    /**
     * Get the customer item being serviced
     * (Renamed from vehicle)
     */
    public function customerItem(): BelongsTo
    {
        return $this->belongsTo(CustomerItem::class, 'customer_item_id')
            ->whereHas('customer', function($q) {
                $q->where('account_id', $this->account_id);
            });
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    /**
     * Get service items (materials/products used)
     * (Renamed from serviceItems)
     */
    public function tailorServiceItems(): HasMany
    {
        return $this->hasMany(TailorServiceItem::class, 'tailor_service_id')
            ->where('account_id', $this->account_id);
    }

    // Alias for backward compatibility
    public function serviceItems(): HasMany
    {
        return $this->tailorServiceItems();
    }

    public function customerCredit(): BelongsTo
    {
        return $this->belongsTo(CustomerCredit::class);
    }

    /**
     * Scope to filter by account
     * ⚠️ CRITICAL: Always use this!
     */
    public function scopeForAccount(Builder $query, int $accountId): Builder
    {
        return $query->where('account_id', $accountId);
    }

    /**
     * Scope to filter by service type
     */
    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('service_type', $type);
    }

    /**
     * Scope to filter by status
     */
    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get overdue services
     */
    public function scopeOverdue(Builder $query): Builder
    {
        return $query->where('delivery_date', '<', now())
            ->whereNotIn('status', ['completed', 'cancelled']);
    }

    /**
     * Scope to get upcoming deliveries
     */
    public function scopeUpcoming(Builder $query, int $days = 7): Builder
    {
        return $query->whereBetween('delivery_date', [now(), now()->addDays($days)])
            ->whereNotIn('status', ['completed', 'cancelled']);
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        // Sanitize search input to prevent SQL injection
        $cleanSearch = trim($search);
        if (strlen($cleanSearch) > 255) {
            $cleanSearch = substr($cleanSearch, 0, 255);
        }

        return $query->where(function ($q) use ($cleanSearch) {
            $q->where('order_number', 'like', '%' . $cleanSearch . '%')
              ->orWhere('description', 'like', '%' . $cleanSearch . '%')
              ->orWhereHas('customer', function ($customerQuery) use ($cleanSearch) {
                  $customerQuery->where('name', 'like', '%' . $cleanSearch . '%');
              })
              ->orWhereHas('customerItem', function ($itemQuery) use ($cleanSearch) {
                  $itemQuery->where('item_description', 'like', '%' . $cleanSearch . '%');
              });
        });
    }

    public function scopeByDateRange(Builder $query, $from, $to): Builder
    {
        return $query->whereBetween('service_date', [$from, $to]);
    }

    /**
     * Get service type label
     */
    public function getServiceTypeLabelAttribute(): string
    {
        return match($this->service_type) {
            'alteration' => 'Dəyişiklik',
            'repair' => 'Təmir',
            'custom' => 'Fərdi Tikiş',
            default => $this->service_type ?? '',
        };
    }

    /**
     * Get status label
     */
    public function getStatusTextAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Gözləyir',
            'in_progress' => 'İşləniir',
            'completed' => 'Tamamlandı',
            'cancelled' => 'Ləğv edildi',
            default => $this->status ?? 'pending',
        };
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'pending' => 'yellow',
            'in_progress' => 'blue',
            'completed' => 'green',
            'cancelled' => 'red',
            default => 'gray',
        };
    }

    /**
     * Check if service is overdue
     */
    public function getIsOverdueAttribute(): bool
    {
        if (!$this->delivery_date) {
            return false;
        }

        return $this->delivery_date < now() && $this->status !== 'completed';
    }

    public function getDurationAttribute(): ?string
    {
        if (!$this->started_at || !$this->completed_at) {
            return null;
        }

        $diff = $this->started_at->diff($this->completed_at);

        if ($diff->days > 0) {
            return "{$diff->days} gün, {$diff->h} saat";
        }

        return "{$diff->h} saat, {$diff->i} dəqiqə";
    }

    public function getFormattedTotalCostAttribute(): string
    {
        return number_format($this->total_cost ?? 0, 2) . ' AZN';
    }

    public function getFormattedLaborCostAttribute(): string
    {
        return number_format($this->labor_total ?? 0, 2) . ' AZN';
    }

    public function getPaymentStatusTextAttribute(): string
    {
        return match($this->payment_status) {
            'paid' => 'Ödənilib',
            'credit' => 'Borclu',
            'partial' => 'Qismən ödənilib',
            default => $this->payment_status ?? 'Ödənilib',
        };
    }

    public function getPaymentStatusColorAttribute(): string
    {
        return match($this->payment_status) {
            'paid' => 'green',
            'credit' => 'red',
            'partial' => 'yellow',
            default => 'green',
        };
    }

    /**
     * Generate unique service number
     * Format: TS-YYYY-NNNN (TS = Tailor Service)
     * ⚠️ CRITICAL: Must be scoped by account_id!
     */
    public static function generateServiceNumber(int $accountId): string
    {
        $year = date('Y');
        $prefix = "TS-{$year}-";

        // Get last service number for this account and year
        $lastService = static::where('account_id', $accountId)
            ->where('service_number', 'like', "{$prefix}%")
            ->orderBy('service_number', 'desc')
            ->first();

        if ($lastService) {
            // Extract number from last service: TS-2025-0001 → 0001
            $lastNumber = (int) substr($lastService->service_number, -4);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    // Legacy method for backward compatibility
    public static function generateOrderNumber(int $accountId): string
    {
        return static::generateServiceNumber($accountId);
    }

    public function updatePartsTotal(): void
    {
        $this->materials_total = $this->serviceItems()->sum('total_price');
        $this->total = ($this->labor_total ?? 0) + $this->materials_total - ($this->discount ?? 0) + ($this->tax ?? 0);
        $this->save();
    }

    /**
     * Calculate the total cost including service items
     */
    public function calculateTotalWithItems(): void
    {
        $serviceItemsTotal = $this->serviceItems()->sum('total_price');
        $this->materials_total = $serviceItemsTotal;
        $this->total = ($this->labor_total ?? 0) + $this->materials_total - ($this->discount ?? 0) + ($this->tax ?? 0);
        $this->save();
    }

    /**
     * Set service as credit sale and create customer credit record
     */
    public function setAsCredit(float $creditAmount, ?string $dueDate = null, ?string $description = null): CustomerCredit
    {
        $this->payment_status = 'credit';
        $this->paid_amount = $this->total - $creditAmount;
        $this->credit_amount = $creditAmount;
        $this->credit_due_date = $dueDate;

        // Create customer credit record
        $customerCredit = CustomerCredit::create([
            'account_id' => $this->account_id,
            'customer_id' => $this->customer_id,
            'branch_id' => $this->branch_id,
            'type' => 'credit',
            'amount' => $creditAmount,
            'remaining_amount' => $creditAmount,
            'description' => $description ?: "Dərzi xidməti borcu: {$this->order_number}",
            'credit_date' => now()->toDateString(),
            'due_date' => $dueDate,
            'status' => 'pending',
            'user_id' => auth()->id(),
        ]);

        $this->customer_credit_id = $customerCredit->id;
        $this->save();

        return $customerCredit;
    }

    /**
     * Set service as partial payment
     */
    public function setAsPartialPayment(float $paidAmount, float $creditAmount, ?string $dueDate = null, ?string $description = null): CustomerCredit
    {
        $this->payment_status = 'partial';
        $this->paid_amount = $paidAmount;
        $this->credit_amount = $creditAmount;
        $this->credit_due_date = $dueDate;

        // Create customer credit record for the unpaid amount
        $customerCredit = CustomerCredit::create([
            'account_id' => $this->account_id,
            'customer_id' => $this->customer_id,
            'branch_id' => $this->branch_id,
            'type' => 'credit',
            'amount' => $creditAmount,
            'remaining_amount' => $creditAmount,
            'description' => $description ?: "Dərzi xidməti borcu: {$this->order_number}",
            'credit_date' => now()->toDateString(),
            'due_date' => $dueDate,
            'status' => 'pending',
            'user_id' => auth()->id(),
        ]);

        $this->customer_credit_id = $customerCredit->id;
        $this->save();

        return $customerCredit;
    }

    /**
     * Mark service as fully paid
     */
    public function markAsPaid(): void
    {
        $this->payment_status = 'paid';
        $this->paid_amount = $this->total;
        $this->credit_amount = 0;
        $this->credit_due_date = null;
        $this->save();
    }

    /**
     * Check if service has unpaid credit
     */
    public function hasUnpaidCredit(): bool
    {
        return in_array($this->payment_status, ['credit', 'partial']) && $this->credit_amount > 0;
    }
}
