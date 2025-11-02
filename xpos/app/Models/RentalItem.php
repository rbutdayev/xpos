<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RentalItem extends Model
{
    use HasFactory, BelongsToAccount;

    protected $fillable = [
        'account_id',
        'rental_id',
        'product_id',
        'rental_inventory_id',
        'product_name',
        'sku',
        'quantity',
        'rate_type',
        'duration',
        'unit_price',
        'total_price',
        'deposit_per_item',
        'condition_checklist',
        'condition_on_return',
        'damage_notes',
        'damage_fee',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'duration' => 'integer',
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
            'deposit_per_item' => 'decimal:2',
            'damage_fee' => 'decimal:2',
            'condition_checklist' => 'json',
            'condition_on_return' => 'json',
        ];
    }

    // Relationships
    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function rentalInventory(): BelongsTo
    {
        return $this->belongsTo(RentalInventory::class);
    }

    // Condition Methods
    public function hasConditionChecklist(): bool
    {
        return !empty($this->condition_checklist);
    }

    public function hasReturnCondition(): bool
    {
        return !empty($this->condition_on_return);
    }

    public function hasDamage(): bool
    {
        return $this->damage_fee > 0 || !empty($this->damage_notes);
    }

    /**
     * Compare rental and return conditions to identify damages
     */
    public function compareConditions(): array
    {
        if (!$this->hasConditionChecklist() || !$this->hasReturnCondition()) {
            return [];
        }

        $differences = [];
        $rentalCondition = $this->condition_checklist;
        $returnCondition = $this->condition_on_return;

        foreach ($rentalCondition as $key => $rentalValue) {
            $returnValue = $returnCondition[$key] ?? null;

            if ($rentalValue !== $returnValue) {
                $differences[$key] = [
                    'rental' => $rentalValue,
                    'return' => $returnValue,
                    'changed' => true,
                ];
            }
        }

        return $differences;
    }

    /**
     * Get condition summary for display
     */
    public function getConditionSummary(): array
    {
        return [
            'has_checklist' => $this->hasConditionChecklist(),
            'has_return_condition' => $this->hasReturnCondition(),
            'has_damage' => $this->hasDamage(),
            'damage_fee' => $this->damage_fee,
            'differences' => $this->compareConditions(),
        ];
    }

    /**
     * Calculate subtotal for this item
     */
    public function calculateTotal(): void
    {
        $this->total_price = $this->quantity * $this->unit_price;
        $this->save();
    }
}
