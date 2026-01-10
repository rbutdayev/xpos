<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModulePricingSetting extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'module_pricing_settings';

    protected $fillable = [
        'module_name',
        'monthly_price',
        'is_active',
        'description',
        'last_updated_by',
    ];

    protected function casts(): array
    {
        return [
            'monthly_price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the user who last updated this pricing setting
     */
    public function lastUpdatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_updated_by');
    }

    /**
     * Get the price for a specific module
     *
     * @param string $moduleName
     * @return float
     */
    public static function getModulePrice(string $moduleName): float
    {
        $setting = static::where('module_name', $moduleName)
            ->where('is_active', true)
            ->first();

        return $setting ? (float) $setting->monthly_price : 0.00;
    }

    /**
     * Get all active module prices as an associative array
     *
     * @return array ['module_name' => price]
     */
    public static function getAllActivePrices(): array
    {
        return static::where('is_active', true)
            ->pluck('monthly_price', 'module_name')
            ->map(fn($price) => (float) $price)
            ->toArray();
    }
}
