<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Category extends Model
{
    use HasFactory, BelongsToAccount;

    protected $fillable = [
        'account_id',
        'name',
        'parent_id',
        'sort_order',
        'is_service',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_service' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id')->orderBy('sort_order');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function scopeProducts(Builder $query): Builder
    {
        return $query->where('is_service', false);
    }

    public function scopeServices(Builder $query): Builder
    {
        return $query->where('is_service', true);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeMainCategories(Builder $query): Builder
    {
        return $query->whereNull('parent_id');
    }

    public function isService(): bool
    {
        return $this->is_service;
    }

    public function isProduct(): bool
    {
        return !$this->is_service;
    }

    public function hasChildren(): bool
    {
        return $this->children()->count() > 0;
    }

    public function getFullNameAttribute(): string
    {
        if ($this->parent) {
            return $this->parent->full_name . ' > ' . ($this->name ?? 'Adsız');
        }
        
        return $this->name ?? 'Adsız';
    }
}
