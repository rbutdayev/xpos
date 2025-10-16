<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    use BelongsToAccount, HasFactory;

    protected $fillable = [
        'account_id',
        'name',
        'address',
        'phone',
        'email',
        'is_main',
        'working_hours',
        'latitude',
        'longitude',
        'description',
        'is_active',
    ];

    protected $casts = [
        'working_hours' => 'array',
        'is_main' => 'boolean',
        'is_active' => 'boolean',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    public function warehouses(): BelongsToMany
    {
        return $this->belongsToMany(Warehouse::class, 'warehouse_branch_access')
            ->withPivot(['can_transfer', 'can_view_stock', 'can_modify_stock', 'can_receive_stock', 'can_issue_stock'])
            ->withTimestamps();
    }

    public function warehouseAccess(): HasMany
    {
        return $this->hasMany(WarehouseBranchAccess::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function isActive(): bool
    {
        return $this->is_active;
    }

    public function isMainBranch(): bool
    {
        return $this->is_main;
    }

    public function getWorkingHoursForDay(string $day): ?array
    {
        return $this->working_hours[$day] ?? null;
    }

    public function hasWarehouseAccess(int $warehouseId, string $permission = 'can_view_stock'): bool
    {
        $access = $this->warehouseAccess()->where('warehouse_id', $warehouseId)->first();
        return $access ? $access->{$permission} : false;
    }
}
