<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;

class RentalInventory extends Model
{
    use HasFactory, BelongsToAccount, SoftDeletes;

    protected $table = 'rental_inventory';

    protected $fillable = [
        'account_id',
        'product_id',
        'branch_id',
        'inventory_number',
        'barcode',
        'serial_number',
        'rental_category',
        'status',
        'is_active',
        'stock_deducted',
        'stock_warehouse_id',
        'current_rental_id',
        'available_from',
        'condition_notes',
        'last_maintenance_date',
        'next_maintenance_date',
        'total_rentals',
        'purchase_price',
        'daily_rate',
        'weekly_rate',
        'monthly_rate',
        'replacement_cost',
        'photos',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'stock_deducted' => 'boolean',
            'available_from' => 'date',
            'last_maintenance_date' => 'date',
            'next_maintenance_date' => 'date',
            'total_rentals' => 'integer',
            'purchase_price' => 'decimal:2',
            'daily_rate' => 'decimal:2',
            'weekly_rate' => 'decimal:2',
            'monthly_rate' => 'decimal:2',
            'replacement_cost' => 'decimal:2',
            'photos' => 'json',
        ];
    }

    // Relationships
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function currentRental(): BelongsTo
    {
        return $this->belongsTo(Rental::class, 'current_rental_id');
    }

    public function rentalItems(): HasMany
    {
        return $this->hasMany(RentalItem::class);
    }

    public function stockWarehouse(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Warehouse::class, 'stock_warehouse_id');
    }

    // Scopes
    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('status', 'available')
            ->where('is_active', true);
    }

    public function scopeRented(Builder $query): Builder
    {
        return $query->where('status', 'rented');
    }

    public function scopeMaintenance(Builder $query): Builder
    {
        return $query->where('status', 'maintenance');
    }

    public function scopeDamaged(Builder $query): Builder
    {
        return $query->where('status', 'damaged');
    }

    public function scopeRetired(Builder $query): Builder
    {
        return $query->where('status', 'retired');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory(Builder $query, string $category): Builder
    {
        return $query->where('rental_category', $category);
    }

    public function scopeNeedsMaintenance(Builder $query): Builder
    {
        return $query->whereNotNull('next_maintenance_date')
            ->where('next_maintenance_date', '<=', today())
            ->where('is_active', true);
    }

    public function scopeAvailableForDateRange(Builder $query, $startDate, $endDate): Builder
    {
        return $query->where('status', 'available')
            ->where('is_active', true)
            ->where(function($q) use ($startDate) {
                $q->whereNull('available_from')
                  ->orWhere('available_from', '<=', $startDate);
            });
    }

    // Status Check Methods
    public function isAvailable(): bool
    {
        return $this->status === 'available' && $this->is_active;
    }

    public function isRented(): bool
    {
        return $this->status === 'rented';
    }

    public function isInMaintenance(): bool
    {
        return $this->status === 'maintenance';
    }

    public function isDamaged(): bool
    {
        return $this->status === 'damaged';
    }

    public function isRetired(): bool
    {
        return $this->status === 'retired';
    }

    public function needsMaintenance(): bool
    {
        return $this->next_maintenance_date &&
               $this->next_maintenance_date->lte(today());
    }

    // Availability Methods
    public function isAvailableForDate(\DateTime $date): bool
    {
        if (!$this->isAvailable()) {
            return false;
        }

        if ($this->available_from && $this->available_from->gt($date)) {
            return false;
        }

        return true;
    }

    public function isAvailableForDateRange(\DateTime $startDate, \DateTime $endDate): bool
    {
        if (!$this->isAvailable()) {
            return false;
        }

        if ($this->available_from && $this->available_from->gt($startDate)) {
            return false;
        }

        // Check if already rented during this period
        return !$this->hasOverlappingRental($startDate, $endDate);
    }

    public function hasOverlappingRental(\DateTime $startDate, \DateTime $endDate): bool
    {
        return Rental::where('account_id', $this->account_id)
            ->whereHas('items', function($query) {
                $query->where('rental_inventory_id', $this->id);
            })
            ->whereIn('status', ['reserved', 'active', 'overdue'])
            ->where('rental_start_date', '<=', $endDate)
            ->where('rental_end_date', '>=', $startDate)
            ->exists();
    }

    // Pricing Methods
    public function calculatePriceForDays(int $days): float
    {
        // Use weekly/monthly rates if available and cost-effective
        if ($days >= 30 && $this->monthly_rate) {
            $months = floor($days / 30);
            $remainingDays = $days % 30;
            return ($months * $this->monthly_rate) + ($remainingDays * ($this->daily_rate ?? 0));
        }

        if ($days >= 7 && $this->weekly_rate) {
            $weeks = floor($days / 7);
            $remainingDays = $days % 7;
            return ($weeks * $this->weekly_rate) + ($remainingDays * ($this->daily_rate ?? 0));
        }

        return $days * ($this->daily_rate ?? 0);
    }

    // Status Update Methods
    public function markAsRented(int $rentalId): void
    {
        $this->status = 'rented';
        $this->current_rental_id = $rentalId;
        $this->total_rentals++;
        $this->save();
    }

    public function markAsAvailable(?\DateTime $availableFrom = null): void
    {
        $this->status = 'available';
        $this->current_rental_id = null;
        $this->available_from = $availableFrom;
        $this->save();
    }

    public function markAsMaintenanceNeeded(): void
    {
        $this->status = 'maintenance';
        $this->save();
    }

    public function markAsDamaged(?string $notes = null): void
    {
        $this->status = 'damaged';
        if ($notes) {
            $this->condition_notes = $notes;
        }
        $this->save();
    }

    public function markAsRetired(): void
    {
        $this->status = 'retired';
        $this->is_active = false;
        $this->save();
    }

    // Maintenance Methods
    public function scheduleMaintenance(\DateTime $date): void
    {
        $this->next_maintenance_date = $date;
        $this->save();
    }

    public function completeMaintenance(): void
    {
        $this->last_maintenance_date = now();
        $this->next_maintenance_date = null;
        $this->status = 'available';
        $this->save();
    }

    // Boot method
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($inventory) {
            if (empty($inventory->inventory_number)) {
                $inventory->inventory_number = static::generateInventoryNumber($inventory->account_id);
            }
        });
    }

    public static function generateInventoryNumber(int $accountId): string
    {
        $prefix = 'INV';
        $date = now()->format('Ym');

        $result = \DB::select(
            "SELECT COALESCE(MAX(CAST(SUBSTRING(inventory_number, 9) AS UNSIGNED)), 0) as max_sequence
             FROM rental_inventory
             WHERE account_id = ?
             AND inventory_number LIKE ?
             FOR UPDATE",
            [$accountId, $prefix . $date . '%']
        );

        $sequence = ($result[0]->max_sequence ?? 0) + 1;

        return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
