<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, BelongsToAccount, SoftDeletes;

    protected $fillable = [
        'account_id',
        'name',
        'contact_person',
        'phone',
        'email',
        'address',
        'tax_number',
        'bank_account',
        'bank_name',
        'payment_terms_days',
        'payment_terms_text',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'payment_terms_days' => 'integer',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'supplier_products')
            ->withPivot([
                'supplier_price',
                'supplier_sku',
                'lead_time_days',
                'minimum_order_quantity',
                'discount_percentage',
                'notes',
                'is_preferred',
                'is_active'
            ])
            ->withTimestamps();
    }

    public function supplierProducts(): HasMany
    {
        return $this->hasMany(SupplierProduct::class);
    }

    public function credits(): HasMany
    {
        return $this->hasMany(SupplierCredit::class);
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
              ->orWhere('contact_person', 'like', '%' . $cleanSearch . '%')
              ->orWhere('email', 'like', '%' . $cleanSearch . '%')
              ->orWhere('phone', 'like', '%' . $cleanSearch . '%');
        });
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

    public function getPaymentTermsTextAttribute(): string
    {
        // Use custom payment terms text if available
        if (!empty($this->attributes['payment_terms_text'])) {
            return $this->attributes['payment_terms_text'];
        }
        
        // Fall back to generating from payment_terms_days
        if ($this->payment_terms_days === 0) {
            return 'Nağd ödəniş';
        }
        
        return "{$this->payment_terms_days} gün kredit";
    }

    public function getActiveProductsCountAttribute(): int
    {
        return $this->products()->wherePivot('is_active', true)->count();
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
