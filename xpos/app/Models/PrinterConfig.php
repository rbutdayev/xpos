<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrinterConfig extends Model
{
    use BelongsToAccount;

    protected $primaryKey = 'config_id';

    public function getRouteKeyName()
    {
        return 'config_id';
    }

    protected $fillable = [
        'account_id',
        'branch_id',
        'name',
        'printer_type',
        'paper_size',
        'connection_type',
        'ip_address',
        'port',
        'settings',
        'is_default',
        'is_active',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'port' => 'integer',
    ];

    protected $appends = ['id'];

    public function getIdAttribute()
    {
        return $this->config_id;
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }
}
