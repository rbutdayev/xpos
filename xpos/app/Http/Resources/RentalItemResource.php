<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RentalItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rental_id' => $this->rental_id,

            // Product
            'product_id' => $this->product_id,
            'product_name' => $this->product_name,
            'sku' => $this->sku,
            'product' => $this->whenLoaded('product', function () {
                $attributes = is_string($this->product->attributes)
                    ? json_decode($this->product->attributes, true)
                    : $this->product->attributes;

                return [
                    'id' => $this->product->id,
                    'name' => $this->product->name,
                    'sku' => $this->product->sku,
                    'barcode' => $this->product->barcode,
                    'brand' => $this->product->brand,
                    'model' => $this->product->model,
                    'dimensions' => $this->product->dimensions,
                    'image_url' => $this->product->image_url,
                    'attributes' => $attributes,
                    // Extract common attributes for easy access
                    'size' => $attributes['size'] ?? $attributes['boyut'] ?? null,
                    'color' => $attributes['color'] ?? $attributes['rəng'] ?? null,
                ];
            }),

            // Inventory
            'rental_inventory_id' => $this->rental_inventory_id,
            'inventory' => $this->whenLoaded('rentalInventory', function () {
                return [
                    'id' => $this->rentalInventory->id,
                    'inventory_number' => $this->rentalInventory->inventory_number,
                    'serial_number' => $this->rentalInventory->serial_number,
                ];
            }),

            // Quantity & Pricing
            'quantity' => $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'rental_price' => (float) $this->unit_price, // Alias for frontend compatibility
            'total_price' => (float) $this->total_price,
            'deposit_per_item' => (float) $this->deposit_per_item,

            // Condition
            'condition_checklist' => $this->condition_checklist,
            'condition_on_return' => $this->condition_on_return,
            'has_damage' => $this->hasDamage(),
            'damage_notes' => $this->damage_notes,
            'damage_fee' => (float) $this->damage_fee,

            // Condition comparison
            'condition_differences' => $this->when(
                $this->hasReturnCondition(),
                $this->compareConditions()
            ),

            // Notes
            'notes' => $this->notes,

            // Timestamps
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
