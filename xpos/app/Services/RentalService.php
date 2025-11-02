<?php

namespace App\Services;

use App\Models\Rental;
use App\Models\RentalItem;
use App\Models\RentalInventory;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RentalService
{
    /**
     * Create a new rental
     */
    public function createRental(array $data): Rental
    {
        return DB::transaction(function () use ($data) {
            // Validate customer exists
            $customer = Customer::where('account_id', $data['account_id'])
                ->findOrFail($data['customer_id']);

            // Create rental
            $rental = Rental::create([
                'account_id' => $data['account_id'],
                'customer_id' => $data['customer_id'],
                'branch_id' => $data['branch_id'],
                'user_id' => $data['user_id'] ?? auth()->id(),
                'rental_start_date' => $data['rental_start_date'],
                'rental_end_date' => $data['rental_end_date'],
                'collateral_type' => $data['collateral_type'],
                'collateral_amount' => $data['collateral_amount'] ?? null,
                'collateral_document_type' => $data['collateral_document_type'] ?? null,
                'collateral_document_number' => $data['collateral_document_number'] ?? null,
                'collateral_photo_path' => $data['collateral_photo_path'] ?? null,
                'collateral_notes' => $data['collateral_notes'] ?? null,
                'status' => $data['status'] ?? 'reserved',
                'payment_status' => $data['payment_status'] ?? 'paid',
                'notes' => $data['notes'] ?? null,
                'internal_notes' => $data['internal_notes'] ?? null,
            ]);

            // Add rental items
            $totalPrice = 0;
            $totalDeposit = 0;

            foreach ($data['items'] as $itemData) {
                $product = Product::where('account_id', $data['account_id'])
                    ->findOrFail($itemData['product_id']);

                // Use prices from frontend (already calculated)
                $unitPrice = floatval($itemData['unit_price'] ?? 0);
                $itemTotal = floatval($itemData['total_price'] ?? 0);
                $rateType = $itemData['rate_type'] ?? 'daily';
                $duration = intval($itemData['duration'] ?? 1);

                // Create rental item
                $rentalItem = RentalItem::create([
                    'account_id' => $data['account_id'],
                    'rental_id' => $rental->id,
                    'product_id' => $product->id,
                    'rental_inventory_id' => $itemData['rental_inventory_id'] ?? null,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => 1, // Always 1 for rental items (duration is separate)
                    'rate_type' => $rateType,
                    'duration' => $duration,
                    'unit_price' => $unitPrice,
                    'total_price' => $itemTotal,
                    'deposit_per_item' => 0, // Deposit is handled separately in collateral
                    'condition_checklist' => $itemData['condition_checklist'] ?? null,
                    'notes' => $itemData['notes'] ?? null,
                ]);

                $totalPrice += $itemTotal;
                // No per-item deposit for now (all deposit is in collateral)

                // If specific inventory item, mark as rented
                if ($itemData['rental_inventory_id'] ?? null) {
                    $inventory = RentalInventory::where('account_id', $data['account_id'])
                        ->findOrFail($itemData['rental_inventory_id']);

                    // Check if available for date range
                    if (!$inventory->isAvailableForDateRange(
                        Carbon::parse($data['rental_start_date']),
                        Carbon::parse($data['rental_end_date'])
                    )) {
                        throw new \Exception("Inventory item {$inventory->inventory_number} is not available for the selected dates.");
                    }

                    $inventory->markAsRented($rental->id);
                }
            }

            // Update rental totals
            $rental->rental_price = $totalPrice;
            $rental->deposit_amount = $totalDeposit;
            $rental->total_cost = $totalPrice;
            $rental->paid_amount = $data['paid_amount'] ?? $totalPrice;
            $rental->credit_amount = max(0, $rental->total_cost - $rental->paid_amount);
            $rental->save();

            return $rental->fresh(['items', 'customer', 'branch', 'user']);
        });
    }

    /**
     * Update an existing rental
     */
    public function updateRental(Rental $rental, array $data): Rental
    {
        return DB::transaction(function () use ($rental, $data) {
            // Update basic rental info
            $rental->update([
                'customer_id' => $data['customer_id'] ?? $rental->customer_id,
                'branch_id' => $data['branch_id'] ?? $rental->branch_id,
                'rental_start_date' => $data['rental_start_date'] ?? $rental->rental_start_date,
                'rental_end_date' => $data['rental_end_date'] ?? $rental->rental_end_date,
                'collateral_type' => $data['collateral_type'] ?? $rental->collateral_type,
                'collateral_amount' => $data['collateral_amount'] ?? $rental->collateral_amount,
                'collateral_document_type' => $data['collateral_document_type'] ?? $rental->collateral_document_type,
                'collateral_document_number' => $data['collateral_document_number'] ?? $rental->collateral_document_number,
                'collateral_notes' => $data['collateral_notes'] ?? $rental->collateral_notes,
                'status' => $data['status'] ?? $rental->status,
                'payment_status' => $data['payment_status'] ?? $rental->payment_status,
                'notes' => $data['notes'] ?? $rental->notes,
                'internal_notes' => $data['internal_notes'] ?? $rental->internal_notes,
            ]);

            // Update rental items if provided
            if (isset($data['items']) && is_array($data['items'])) {
                // Delete existing items
                $rental->items()->delete();

                // Add new items
                $totalPrice = 0;

                foreach ($data['items'] as $itemData) {
                    $product = Product::where('account_id', $data['account_id'])
                        ->findOrFail($itemData['product_id']);

                    $unitPrice = floatval($itemData['unit_price'] ?? 0);
                    $itemTotal = floatval($itemData['total_price'] ?? 0);
                    $rateType = $itemData['rate_type'] ?? 'daily';
                    $duration = intval($itemData['duration'] ?? 1);

                    RentalItem::create([
                        'account_id' => $data['account_id'],
                        'rental_id' => $rental->id,
                        'product_id' => $product->id,
                        'rental_inventory_id' => $itemData['rental_inventory_id'] ?? null,
                        'product_name' => $product->name,
                        'sku' => $product->sku,
                        'quantity' => 1,
                        'rate_type' => $rateType,
                        'duration' => $duration,
                        'unit_price' => $unitPrice,
                        'total_price' => $itemTotal,
                        'deposit_per_item' => 0,
                        'notes' => $itemData['notes'] ?? null,
                    ]);

                    $totalPrice += $itemTotal;
                }

                // Update rental totals
                $rental->rental_price = $totalPrice;
                $rental->total_cost = $totalPrice + $rental->deposit_amount + $rental->late_fee + $rental->damage_fee;
                $rental->credit_amount = max(0, $rental->total_cost - $rental->paid_amount);
            }

            // Update paid amount if provided
            if (isset($data['paid_amount'])) {
                $rental->paid_amount = $data['paid_amount'];
                $rental->credit_amount = max(0, $rental->total_cost - $rental->paid_amount);
            }

            $rental->save();

            return $rental->fresh(['items', 'customer', 'branch']);
        });
    }

    /**
     * Calculate rental price based on product and duration
     */
    protected function calculateRentalPrice(Product $product, int $days, ?int $inventoryId = null): float
    {
        // If specific inventory item with custom pricing
        if ($inventoryId) {
            $inventory = RentalInventory::find($inventoryId);
            if ($inventory) {
                return $inventory->calculatePriceForDays($days);
            }
        }

        // Use product pricing
        if ($days >= 30 && $product->rental_monthly_rate) {
            $months = floor($days / 30);
            $remainingDays = $days % 30;
            return ($months * $product->rental_monthly_rate) +
                   ($remainingDays * ($product->rental_daily_rate ?? 0));
        }

        if ($days >= 7 && $product->rental_weekly_rate) {
            $weeks = floor($days / 7);
            $remainingDays = $days % 7;
            return ($weeks * $product->rental_weekly_rate) +
                   ($remainingDays * ($product->rental_daily_rate ?? 0));
        }

        return $days * ($product->rental_daily_rate ?? 0);
    }

    /**
     * Process rental return
     */
    public function processReturn(Rental $rental, array $data): Rental
    {
        return DB::transaction(function () use ($rental, $data) {
            // Convert return_date string to Carbon instance
            $returnDate = isset($data['return_date'])
                ? Carbon::parse($data['return_date'])
                : now();

            // Calculate late fee if overdue
            if ($returnDate->gt($rental->rental_end_date)) {
                $rental->late_fee = $this->calculateLateFee($rental, $returnDate);
            }

            // Process damage fees from items
            $totalDamageFee = 0;
            if (isset($data['items'])) {
                foreach ($data['items'] as $itemData) {
                    $item = RentalItem::where('rental_id', $rental->id)
                        ->findOrFail($itemData['item_id']);

                    $item->condition_on_return = $itemData['condition_on_return'] ?? null;
                    $item->damage_notes = $itemData['damage_notes'] ?? null;
                    $item->damage_fee = $itemData['damage_fee'] ?? 0;

                    $item->save();

                    $totalDamageFee += $item->damage_fee;

                    // Mark inventory as available
                    if ($item->rental_inventory_id) {
                        $inventory = RentalInventory::find($item->rental_inventory_id);
                        if ($inventory) {
                            if ($item->damage_fee > 0) {
                                $inventory->markAsDamaged($item->damage_notes);
                            } else {
                                $inventory->markAsAvailable();
                            }
                        }
                    }
                }
            }

            // Update rental agreement with return condition checklist (category-specific)
            if ($rental->agreement && isset($data['condition_on_return'])) {
                $agreementService = app(RentalAgreementService::class);

                // Update the agreement's return checklist
                $agreementService->processReturn($rental->agreement, [
                    'condition_checklist_return' => $data['condition_on_return'],
                    'damage_fees' => $data['damage_fees'] ?? [],
                ]);
            }

            // Update rental
            $rental->damage_fee = $totalDamageFee;
            $rental->condition_on_return = $data['condition_on_return'] ?? null;
            $rental->damage_notes = $data['damage_notes'] ?? null;
            $rental->actual_return_date = $returnDate;

            // Handle optional cleaning fee
            $cleaningFee = 0;
            if (($data['needs_cleaning'] ?? false) && isset($data['cleaning_fee'])) {
                $cleaningFee = floatval($data['cleaning_fee']);
            }

            // Recalculate total cost (including optional cleaning fee)
            $rental->total_cost = $rental->rental_price + $rental->late_fee + $rental->damage_fee + $cleaningFee;
            $rental->credit_amount = max(0, $rental->total_cost - $rental->paid_amount);

            // Handle payment based on payment_type
            $paymentType = $data['payment_type'] ?? 'full';
            $paymentMethod = $data['payment_method'] ?? 'cash';

            // Map payment method to Azeri
            $paymentMethodAz = match($paymentMethod) {
                'cash' => 'nağd',
                'card' => 'kart',
                'transfer' => 'köçürmə',
                default => 'nağd'
            };

            if ($rental->credit_amount > 0) {
                if ($paymentType === 'full') {
                    // Create payment for full remaining balance
                    Payment::create([
                        'rental_id' => $rental->id,
                        'method' => $paymentMethodAz,
                        'amount' => $rental->credit_amount,
                        'notes' => 'Qaytarma zamanı tam ödəniş',
                    ]);

                    $rental->paid_amount += $rental->credit_amount;
                    $rental->credit_amount = 0;
                    $rental->payment_status = 'paid';

                } elseif ($paymentType === 'partial') {
                    // Create payment for specified amount
                    $paymentAmount = floatval($data['payment_amount'] ?? 0);

                    if ($paymentAmount > 0) {
                        Payment::create([
                            'rental_id' => $rental->id,
                            'method' => $paymentMethodAz,
                            'amount' => $paymentAmount,
                            'notes' => 'Qaytarma zamanı qismən ödəniş',
                        ]);

                        $rental->paid_amount += $paymentAmount;
                        $rental->credit_amount = max(0, $rental->total_cost - $rental->paid_amount);
                        $rental->payment_status = $rental->credit_amount > 0 ? 'partial' : 'paid';
                    }

                } elseif ($paymentType === 'credit') {
                    // Allow return with credit (no payment created)
                    $rental->payment_status = 'credit';
                }
            } else {
                // No credit, mark as paid
                $rental->payment_status = 'paid';
            }

            $rental->markAsReturned($returnDate);

            // Handle collateral return
            if ($data['return_collateral'] ?? false) {
                $rental->collateral_returned = true;
                $rental->collateral_returned_at = now();
                $rental->save();
            }

            return $rental->fresh(['items', 'customer', 'agreement']);
        });
    }

    /**
     * Calculate late fee
     */
    protected function calculateLateFee(Rental $rental, Carbon $returnDate): float
    {
        $daysLate = $rental->rental_end_date->diffInDays($returnDate);

        if ($daysLate <= 0) {
            return 0;
        }

        // Calculate daily rate from original rental
        $rentalDays = $rental->rental_start_date->diffInDays($rental->rental_end_date);

        $dailyRate = $rentalDays > 0 ? $rental->rental_price / $rentalDays : 0;

        // Late fee is 150% of normal daily rate
        $lateFeeRate = $dailyRate * 1.5;

        return round($daysLate * $lateFeeRate, 2);
    }

    /**
     * Extend rental period
     */
    public function extendRental(Rental $rental, array $data): Rental
    {
        return DB::transaction(function () use ($rental, $data) {
            $newEndDate = Carbon::parse($data['new_end_date']);
            $oldEndDate = Carbon::parse($rental->rental_end_date);

            if ($newEndDate->lte($oldEndDate)) {
                throw new \Exception("New end date must be after current end date.");
            }

            // Calculate total days from start to new end date
            $startDate = Carbon::parse($rental->rental_start_date);
            $totalDaysNew = $startDate->diffInDays($newEndDate);
            $totalDaysOld = $startDate->diffInDays($oldEndDate);

            // Recalculate price based on each item's rate_type
            $newTotalPrice = 0;

            foreach ($rental->items as $item) {
                // Get the unit price and rate type for this item
                $unitPrice = $item->unit_price;
                $rateType = $item->rate_type ?? 'daily'; // default to daily if not set

                // Calculate new duration based on rate type
                $newDuration = 0;
                switch ($rateType) {
                    case 'weekly':
                        $newDuration = ceil($totalDaysNew / 7); // Round up to full weeks
                        break;
                    case 'monthly':
                        $newDuration = ceil($totalDaysNew / 30); // Round up to full months
                        break;
                    case 'daily':
                    default:
                        $newDuration = $totalDaysNew;
                        break;
                }

                // Calculate new total for this item
                $newItemTotal = $unitPrice * $newDuration * $item->quantity;
                $newTotalPrice += $newItemTotal;

                // Update the item's duration and total
                $item->duration = $newDuration;
                $item->total_price = $newItemTotal;
                $item->save();
            }

            // Calculate additional cost (difference between new and old price)
            $additionalCost = $newTotalPrice - $rental->rental_price;
            $additionalDays = $oldEndDate->diffInDays($newEndDate);

            // Update rental
            $rental->rental_end_date = $newEndDate;
            $rental->rental_price = $newTotalPrice;
            $rental->total_cost = $rental->rental_price + $rental->deposit_amount + $rental->late_fee + $rental->damage_fee;
            $rental->credit_amount = max(0, $rental->total_cost - $rental->paid_amount);

            // Add note about extension
            $rental->internal_notes = ($rental->internal_notes ?? '') .
                "\n[" . now() . "] Extended until {$newEndDate->format('Y-m-d')} (+{$additionalDays} days, +" . number_format($additionalCost, 2) . " AZN)";

            $rental->save();

            // Update inventory availability
            foreach ($rental->items as $item) {
                if ($item->rental_inventory_id) {
                    $inventory = RentalInventory::find($item->rental_inventory_id);
                    if ($inventory) {
                        // Check if still available for extended period
                        if (!$inventory->isAvailableForDateRange($oldEndDate->addDay(), $newEndDate)) {
                            throw new \Exception("Inventory item {$inventory->inventory_number} is not available for the extended period.");
                        }
                    }
                }
            }

            return $rental->fresh(['items', 'customer']);
        });
    }

    /**
     * Cancel rental
     */
    public function cancelRental(Rental $rental, string $reason = null): Rental
    {
        return DB::transaction(function () use ($rental, $reason) {
            if ($rental->isReturned()) {
                throw new \Exception("Cannot cancel a rental that has already been returned.");
            }

            // Release inventory items
            foreach ($rental->items as $item) {
                if ($item->rental_inventory_id) {
                    $inventory = RentalInventory::find($item->rental_inventory_id);
                    if ($inventory && $inventory->current_rental_id === $rental->id) {
                        $inventory->markAsAvailable();
                    }
                }
            }

            // Reset all financial amounts to 0 when cancelled
            $rental->rental_price = 0;
            $rental->deposit_amount = 0;
            $rental->late_fee = 0;
            $rental->damage_fee = 0;
            $rental->total_cost = 0;
            $rental->credit_amount = 0;
            // Note: paid_amount is kept as is to track what needs to be refunded

            // Update rental status
            $rental->status = 'cancelled';
            $rental->payment_status = 'paid'; // Set to paid since there's nothing to pay
            $rental->internal_notes = ($rental->internal_notes ?? '') .
                "\n[" . now() . "] Cancelled" . ($reason ? ": {$reason}" : '') . " - All charges cleared.";
            $rental->save();

            return $rental->fresh(['items']);
        });
    }

    /**
     * Check for overdue rentals and update status
     */
    public function checkOverdueRentals(int $accountId): int
    {
        $overdueCount = 0;

        $rentals = Rental::where('account_id', $accountId)
            ->whereIn('status', ['reserved', 'active'])
            ->where('rental_end_date', '<', today())
            ->get();

        foreach ($rentals as $rental) {
            $rental->markAsOverdue();
            $overdueCount++;
        }

        return $overdueCount;
    }

    /**
     * Get available inventory for date range
     */
    public function getAvailableInventory(
        int $accountId,
        int $productId,
        string $startDate,
        string $endDate,
        ?int $branchId = null
    ) {
        $query = RentalInventory::where('account_id', $accountId)
            ->where('product_id', $productId)
            ->where('is_active', true);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $inventory = $query->get();

        return $inventory->filter(function ($item) use ($startDate, $endDate) {
            return $item->isAvailableForDateRange(
                Carbon::parse($startDate),
                Carbon::parse($endDate)
            );
        });
    }
}
