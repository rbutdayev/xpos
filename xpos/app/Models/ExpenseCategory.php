<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class ExpenseCategory extends Model
{
    use HasFactory, BelongsToAccount;

    protected $primaryKey = 'category_id';

    public function getRouteKeyName()
    {
        return 'category_id';
    }

    protected $fillable = [
        'account_id',
        'name',
        'type',
        'parent_id',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'parent_id', 'category_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(ExpenseCategory::class, 'parent_id', 'category_id');
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class, 'category_id', 'category_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeMainCategories(Builder $query): Builder
    {
        return $query->whereNull('parent_id');
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function hasChildren(): bool
    {
        return $this->children()->count() > 0;
    }

    public function getFullNameAttribute(): string
    {
        if ($this->parent) {
            return $this->parent->full_name . ' > ' . $this->name;
        }
        
        return $this->name;
    }

    public static function getTypes(): array
    {
        return [
            'maaş' => 'Maaş',
            'xərclər' => 'Xərclər',
            'ödənişlər' => 'Ödənişlər',
            'kommunal' => 'Kommunal',
            'nəqliyyat' => 'Nəqliyyat',
            'digər' => 'Digər'
        ];
    }
}