<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Account extends Model
{
    use HasFactory;
    protected $fillable = [
        'company_name',
        'subscription_plan',
        'language',
        'address',
        'tax_number',
        'phone',
        'email',
        'settings',
        'is_active',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->latest();
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function companies(): HasMany
    {
        return $this->hasMany(Company::class);
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function warehouses(): HasMany
    {
        return $this->hasMany(Warehouse::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function suppliers(): HasMany
    {
        return $this->hasMany(Supplier::class);
    }

    public function tailorServices(): HasMany
    {
        return $this->hasMany(TailorService::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function isActive(): bool
    {
        if (!$this->is_active) {
            return false;
        }
        
        $subscription = $this->getCurrentSubscription();
        return $subscription ? $subscription->isActive() : true; // Allow accounts without subscription for now
    }

    public function getCurrentSubscription(): ?Subscription
    {
        return $this->subscription;
    }
}
