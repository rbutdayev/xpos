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

    protected $fillable = [
        'account_id',
        'service_type',
        'branch_id',
        'customer_id',
        'customer_item_id',
        'employee_id',
        'service_number',
        'description',
        'item_condition',
        'labor_cost',
        'materials_cost',
        'total_cost',
        'received_date',
        'promised_date',
        'completed_date',
        'delivered_date',
        'status',
        'payment_status',
        'paid_amount',
        'credit_amount',
        'credit_due_date',
        'customer_credit_id',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'labor_cost' => 'decimal:2',
        'materials_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'credit_amount' => 'decimal:2',
        'received_date' => 'date',
        'promised_date' => 'date',
        'completed_date' => 'date',
        'delivered_date' => 'date',
        'credit_due_date' => 'date',
    ];

    protected $appends = [
        'status_text',
        'status_color',
        'payment_status_text',
        'payment_status_color',
        'is_overdue',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($service) {
            if (!$service->service_number) {
                $service->service_number = static::generateServiceNumber($service->account_id, $service->service_type ?? 'tailor');
            }
            if (!$service->created_by) {
                $service->created_by = auth()->id();
            }
            if (!$service->received_date) {
                $service->received_date = now();
            }
            if (!$service->service_type) {
                $service->service_type = 'tailor';
            }
        });

        static::saving(function ($service) {
            // Auto-calculate total cost
            $service->total_cost = $service->labor_cost + $service->materials_cost;
        });
    }

    // Relationships
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function customerItem(): BelongsTo
    {
        return $this->belongsTo(CustomerItem::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(TailorServiceItem::class);
    }

    public function customerCredit(): BelongsTo
    {
        return $this->belongsTo(CustomerCredit::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeForAccount(Builder $query, int $accountId): Builder
    {
        return $query->where('account_id', $accountId);
    }

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->where('promised_date', '<', now())
            ->whereNotIn('status', ['completed', 'delivered', 'cancelled']);
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(function ($q) use ($search) {
            $q->where('service_number', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%")
              ->orWhereHas('customer', function ($customerQuery) use ($search) {
                  $customerQuery->where('name', 'like', "%{$search}%");
              });
        });
    }

    public function scopeOfType(Builder $query, string $serviceType): Builder
    {
        return $query->where('service_type', $serviceType);
    }

    // Accessors
    public function getStatusTextAttribute(): string
    {
        return match($this->status) {
            'received' => 'Qəbul edildi',
            'in_progress' => 'İşləniir',
            'completed' => 'Tamamlandı',
            'delivered' => 'Təhvil verildi',
            'cancelled' => 'Ləğv edildi',
            default => $this->status,
        };
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'received' => 'yellow',
            'in_progress' => 'blue',
            'completed' => 'green',
            'delivered' => 'purple',
            'cancelled' => 'red',
            default => 'gray',
        };
    }

    public function getPaymentStatusTextAttribute(): string
    {
        return match($this->payment_status) {
            'unpaid' => 'Ödənilməyib',
            'partial' => 'Qismən ödənilib',
            'paid' => 'Ödənilib',
            'credit' => 'Borc',
            default => $this->payment_status,
        };
    }

    public function getPaymentStatusColorAttribute(): string
    {
        return match($this->payment_status) {
            'unpaid' => 'red',
            'partial' => 'yellow',
            'paid' => 'green',
            'credit' => 'orange',
            default => 'gray',
        };
    }

    public function getIsOverdueAttribute(): bool
    {
        if (!$this->promised_date) {
            return false;
        }
        return $this->promised_date < now() && !in_array($this->status, ['completed', 'delivered']);
    }

    // Helper methods
    public static function generateServiceNumber(int $accountId, string $serviceType = 'tailor'): string
    {
        $year = date('Y');

        // Generate prefix based on service type
        $typePrefixes = [
            'tailor' => 'TS',
            'phone_repair' => 'PR',
            'electronics' => 'EL',
            'general' => 'GS',
        ];

        $typePrefix = $typePrefixes[$serviceType] ?? 'TS';
        $prefix = "{$typePrefix}-{$year}-";

        $lastService = static::where('account_id', $accountId)
            ->where('service_type', $serviceType)
            ->where('service_number', 'like', "{$prefix}%")
            ->orderBy('service_number', 'desc')
            ->first();

        if ($lastService) {
            $lastNumber = (int) substr($lastService->service_number, -4);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    public function recalculateCosts(): void
    {
        $this->materials_cost = $this->items()->sum('total_price');
        $this->total_cost = $this->labor_cost + $this->materials_cost;
        $this->save();
    }
}
