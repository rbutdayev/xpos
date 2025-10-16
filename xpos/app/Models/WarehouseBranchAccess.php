<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WarehouseBranchAccess extends Model
{
    protected $table = 'warehouse_branch_access';

    protected $fillable = [
        'warehouse_id',
        'branch_id',
        'can_transfer',
        'can_view_stock',
        'can_modify_stock',
        'can_receive_stock',
        'can_issue_stock',
    ];

    protected $casts = [
        'can_transfer' => 'boolean',
        'can_view_stock' => 'boolean',
        'can_modify_stock' => 'boolean',
        'can_receive_stock' => 'boolean',
        'can_issue_stock' => 'boolean',
    ];

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function hasPermission(string $permission): bool
    {
        return $this->{$permission} ?? false;
    }

    public function grantPermission(string $permission): void
    {
        $this->update([$permission => true]);
    }

    public function revokePermission(string $permission): void
    {
        $this->update([$permission => false]);
    }
}
