<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use BelongsToAccount, HasFactory;

    protected $fillable = [
        'account_id',
        'name',
        'address',
        'tax_number',
        'default_language',
        'phone',
        'email',
        'website',
        'description',
        'logo_path',
        'business_hours',
        'is_active',
    ];

    protected $casts = [
        'business_hours' => 'array',
        'is_active' => 'boolean',
    ];

    // Note: Branches and warehouses belong to account level, not company level
    // This is for company profile information only


    public function isActive(): bool
    {
        return $this->is_active;
    }

    public function getBusinessHoursForDay(string $day): ?array
    {
        return $this->business_hours[$day] ?? null;
    }
}
