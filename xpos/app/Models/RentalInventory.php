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
        // New product data fields
        'product_name',
        'product_sku',
        'product_description',
        'product_category',
        'product_brand',
        'product_model',
        'product_attributes',
        'original_product_id',
        'original_product_deleted_at',
        'can_return_to_stock',
        'return_warehouse_id',
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
            // New field casts
            'product_attributes' => 'json',
            'original_product_deleted_at' => 'datetime',
            'can_return_to_stock' => 'boolean',
        ];
    }

    // Relationships
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function originalProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'original_product_id');
    }

    public function returnWarehouse(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Warehouse::class, 'return_warehouse_id');
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
    
    /**
     * Check if inventory item can be rented for a date range
     * This is the CENTRALIZED availability check method - use this everywhere
     */
    public function canBeRentedForDateRange(\DateTime $startDate, \DateTime $endDate, ?int $excludeRentalId = null): bool
    {
        // Only block items that are permanently unavailable or inactive
        $blockingStatuses = ['damaged', 'maintenance', 'retired'];
        if (in_array($this->status, $blockingStatuses) || !$this->is_active) {
            return false;
        }

        // Check if item has a future availability date
        if ($this->available_from && $this->available_from->gt($startDate)) {
            return false;
        }

        // Check if already rented during this period
        return !$this->hasOverlappingRental($startDate, $endDate, $excludeRentalId);
    }
    
    /**
     * Get availability status with detailed message
     * Returns array with is_available, status, and message
     */
    public function getAvailabilityStatus(\DateTime $startDate, \DateTime $endDate, ?int $excludeRentalId = null): array
    {
        // Check if item is permanently blocked
        $blockingStatuses = ['damaged', 'maintenance', 'retired'];
        if (in_array($this->status, $blockingStatuses)) {
            return [
                'is_available' => false,
                'current_status' => $this->status,
                'message' => "İnventar elementi mövcud deyil. Status: {$this->status}"
            ];
        }
        
        if (!$this->is_active) {
            return [
                'is_available' => false,
                'current_status' => 'inactive',
                'message' => "İnventar elementi deaktivdir."
            ];
        }

        // Check if item has a future availability date
        if ($this->available_from && $this->available_from->gt($startDate)) {
            return [
                'is_available' => false,
                'current_status' => $this->status,
                'message' => "İnventar elementi {$this->available_from->format('Y-m-d')} tarixindən mövcud olacaq."
            ];
        }

        // Check for overlapping rentals
        if ($this->hasOverlappingRental($startDate, $endDate, $excludeRentalId)) {
            return [
                'is_available' => false,
                'current_status' => $this->status,
                'message' => "İnventar elementi seçilmiş tarixlər üçün artıq rezerv edilib."
            ];
        }

        return [
            'is_available' => true,
            'current_status' => $this->status,
            'message' => "İnventar elementi seçilmiş tarixlər üçün mövcuddur."
        ];
    }

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

    public function isAvailableForDateRange(\DateTime $startDate, \DateTime $endDate, ?int $excludeRentalId = null): bool
    {
        // Use the centralized availability check
        return $this->canBeRentedForDateRange($startDate, $endDate, $excludeRentalId);
    }

    public function hasOverlappingRental(\DateTime $startDate, \DateTime $endDate, ?int $excludeRentalId = null): bool
    {
        // Ensure we have a valid account_id
        if (!$this->account_id) {
            throw new \Exception("Inventory item has no account_id set");
        }
        
        $query = Rental::withoutGlobalScope('account')
            ->where('account_id', $this->account_id)
            ->whereHas('items', function($query) {
                $query->withoutGlobalScope('account')
                      ->where('rental_inventory_id', $this->id)
                      ->where('account_id', $this->account_id);
            })
            ->whereIn('status', ['reserved', 'active', 'overdue'])
            ->where('rental_start_date', '<', $endDate)  // Changed from <= to < (exclusive end date)
            ->where('rental_end_date', '>', $startDate); // Changed from >= to > (exclusive start date)
            
        // Exclude the current rental if specified (for transaction isolation)
        if ($excludeRentalId) {
            $query->where('id', '!=', $excludeRentalId);
        }
            
        return $query->exists();
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

        // Use a raw SQL query with FOR UPDATE to atomically get and lock the max sequence
        // Only look at new format numbers (INV + 4 digits, length = 7)
        $result = \DB::select(
            "SELECT COALESCE(MAX(CAST(SUBSTRING(inventory_number, 4) AS UNSIGNED)), 0) as max_sequence
             FROM rental_inventory
             WHERE account_id = ?
             AND inventory_number LIKE ?
             AND LENGTH(inventory_number) = 7
             FOR UPDATE",
            [$accountId, $prefix . '%']
        );

        $sequence = ($result[0]->max_sequence ?? 0) + 1;

        return $prefix . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    // New product independence methods
    
    /**
     * Get the display name for this rental inventory item
     * Uses copied product_name, falling back to original product if needed
     */
    public function getDisplayName(): string
    {
        return $this->product_name ?? $this->product?->name ?? 'Unnamed Item';
    }

    /**
     * Check if the original product still exists and is not deleted
     */
    public function hasValidOriginalProduct(): bool
    {
        return $this->original_product_id && 
               !$this->original_product_deleted_at &&
               $this->originalProduct()->exists();
    }

    /**
     * Create rental inventory from a product (copies product data)
     */
    public static function createFromProduct(Product $product, array $additionalData = []): self
    {
        return self::create(array_merge($additionalData, [
            'account_id' => $product->account_id,
            'product_id' => $product->id, // Keep for backwards compatibility during transition
            'original_product_id' => $product->id,
            // Copy product data for independence
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'product_description' => $product->description,
            'product_category' => $product->category?->name,
            'product_brand' => $product->brand,
            'product_model' => $product->model,
            'product_attributes' => $product->attributes,
            'can_return_to_stock' => true,
        ]));
    }

    /**
     * Handle when original product is deleted
     */
    public static function handleProductDeletion(int $productId): void
    {
        self::where('original_product_id', $productId)
            ->whereNull('original_product_deleted_at')
            ->update([
                'original_product_deleted_at' => now(),
                'can_return_to_stock' => false,
            ]);
    }

    /**
     * Return rental inventory back to stock
     * Handles cases where original product may not exist
     */
    public function returnToStock(): bool
    {
        // Option 1: Return to original product if it exists
        if ($this->hasValidOriginalProduct() && $this->can_return_to_stock) {
            return $this->returnToOriginalProduct();
        }
        
        // Option 2: Create new product if original was deleted but we can still return
        if ($this->can_return_to_stock && !$this->hasValidOriginalProduct()) {
            return $this->createNewProductAndReturn();
        }
        
        // Option 3: Mark as permanently converted to rental
        $this->markAsPermanentRental();
        return false;
    }

    private function returnToOriginalProduct(): bool
    {
        $product = $this->originalProduct;
        $warehouse = $this->returnWarehouse ?? $this->stockWarehouse;
        
        if (!$product || !$warehouse) {
            return false;
        }

        // Add stock back to warehouse
        // This would typically use a stock management service
        // For now, we'll update the stock directly
        $stock = $product->productStocks()->where('warehouse_id', $warehouse->id)->first();
        if ($stock) {
            $stock->increment('quantity', 1);
        } else {
            $product->productStocks()->create([
                'warehouse_id' => $warehouse->id,
                'quantity' => 1,
            ]);
        }

        // Mark this rental inventory as returned to stock
        $this->update([
            'status' => 'retired',
            'is_active' => false,
            'notes' => ($this->notes ?? '') . "\nReturned to stock: " . now()->format('Y-m-d H:i:s')
        ]);

        return true;
    }

    private function createNewProductAndReturn(): bool
    {
        // Create new product with rental inventory data
        $newProduct = Product::create([
            'account_id' => $this->account_id,
            'name' => $this->product_name,
            'sku' => $this->product_sku,
            'description' => $this->product_description,
            'brand' => $this->product_brand,
            'model' => $this->product_model,
            'attributes' => $this->product_attributes,
            'type' => 'product',
            'is_active' => true,
            'purchase_price' => $this->purchase_price,
            'sale_price' => $this->replacement_cost ?? $this->purchase_price,
        ]);
        
        // Update rental inventory to point to new product
        $this->update(['original_product_id' => $newProduct->id]);
        
        return $this->returnToOriginalProduct();
    }

    private function markAsPermanentRental(): void
    {
        $this->update([
            'can_return_to_stock' => false,
            'notes' => ($this->notes ?? '') . "\nMarked as permanent rental: " . now()->format('Y-m-d H:i:s')
        ]);
    }
}
