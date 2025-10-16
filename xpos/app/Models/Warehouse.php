<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Warehouse extends Model
{
    use BelongsToAccount, HasFactory;

    protected $fillable = [
        'account_id',
        'name',
        'type',
        'location',
        'is_active',
        'description',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    public function branches(): BelongsToMany
    {
        return $this->belongsToMany(Branch::class, 'warehouse_branch_access')
            ->withPivot(['can_transfer', 'can_view_stock', 'can_modify_stock', 'can_receive_stock', 'can_issue_stock'])
            ->withTimestamps();
    }

    public function branchAccess(): HasMany
    {
        return $this->hasMany(WarehouseBranchAccess::class);
    }

    public function isActive(): bool
    {
        return $this->is_active;
    }


    public function isMainWarehouse(): bool
    {
        return $this->type === 'main';
    }

    public function grantBranchAccess(int $branchId, array $permissions): void
    {
        $this->branchAccess()->updateOrCreate(
            ['branch_id' => $branchId],
            $permissions
        );
    }
}
