<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, BelongsToAccount, SoftDeletes;

    protected $fillable = [
        'account_id',
        'name',
        'phone',
        'email',
        'address',
        'customer_type',
        'tax_number',
        'notes',
        'is_active',
    ];

    protected $appends = [
        'formatted_phone',
        'customer_type_text',
        'active_customerItems_count',
        'total_service_records',
        'last_service_date',
    ];

    protected $attributes = [
        'customer_type' => 'individual',
        'is_active' => true,
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'customer_type' => 'string',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function customerItems(): HasMany
    {
        return $this->hasMany(CustomerItem::class);
    }

    public function tailorServices(): HasMany
    {
        return $this->hasMany(TailorService::class);
    }

    public function credits(): HasMany
    {
        return $this->hasMany(CustomerCredit::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        // Sanitize search input to prevent SQL injection
        $cleanSearch = trim($search);
        if (strlen($cleanSearch) > 255) {
            $cleanSearch = substr($cleanSearch, 0, 255);
        }
        
        return $query->where(function ($q) use ($cleanSearch) {
            $q->where('name', 'like', '%' . $cleanSearch . '%')
              ->orWhere('email', 'like', '%' . $cleanSearch . '%')
              ->orWhere('phone', 'like', '%' . $cleanSearch . '%')
              ->orWhere('tax_number', 'like', '%' . $cleanSearch . '%');
        });
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('customer_type', $type);
    }

    public function getFormattedPhoneAttribute(): ?string
    {
        if (!$this->phone) {
            return null;
        }
        
        // Format Azerbaijani phone numbers
        $phone = preg_replace('/[^0-9]/', '', $this->phone);
        
        if (strlen($phone) === 12 && str_starts_with($phone, '994')) {
            return '+' . substr($phone, 0, 3) . ' ' . substr($phone, 3, 2) . ' ' . substr($phone, 5, 3) . ' ' . substr($phone, 8, 2) . ' ' . substr($phone, 10, 2);
        }
        
        return $this->phone;
    }

    public function getCustomerTypeTextAttribute(): string
    {
        return match($this->customer_type) {
            'individual' => 'Fiziki şəxs',
            'corporate' => 'Hüquqi şəxs',
            null => 'Fiziki şəxs', // Default fallback for null values
            default => $this->customer_type ?? 'Fiziki şəxs',
        };
    }

    public function getActiveCustomerItemsCountAttribute(): int
    {
        return $this->customerItems()->where('is_active', true)->count();
    }

    public function getTotalTailorServicesAttribute(): int
    {
        return $this->service_records_count ?? $this->tailorServices()->count();
    }

    public function getLastServiceDateAttribute(): ?string
    {
        $lastService = $this->tailorServices()
            ->orderBy('service_date', 'desc')
            ->first();
            
        return $lastService?->service_date;
    }

    public function getTotalCreditAmountAttribute(): float
    {
        return $this->credits()
            ->where('type', 'credit')
            ->whereIn('status', ['pending', 'partial'])
            ->sum('remaining_amount') ?? 0;
    }

    public function hasPendingCredits(): bool
    {
        return $this->credits()
            ->where('type', 'credit')
            ->whereIn('status', ['pending', 'partial'])
            ->exists();
    }
}
