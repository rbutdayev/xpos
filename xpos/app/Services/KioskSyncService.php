<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Customer;
use App\Models\FiscalPrinterConfig;
use Illuminate\Support\Carbon;

class KioskSyncService
{
    /**
     * Get products delta (changes since last sync)
     */
    public function getProductsDelta(int $accountId, ?string $since = null): array
    {
        $sinceDate = $since ? Carbon::parse($since) : Carbon::now()->subYears(10);

        // Get updated/created products with optimized eager loading
        $products = Product::withoutGlobalScope('account')
            ->where('account_id', $accountId)
            ->where('is_active', true)
            ->where('updated_at', '>', $sinceDate)
            ->with(['category', 'variants'])
            ->get()
            ->map(function ($product) {
                $data = [
                    'id' => $product->id,
                    'account_id' => $product->account_id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'sale_price' => (float) $product->sale_price,
                    'purchase_price' => (float) ($product->purchase_price ?? 0),
                    'stock_quantity' => (float) ($product->total_stock ?? 0),
                    'variant_id' => null,
                    'variant_name' => null,
                    'category_name' => $product->category?->name,
                    'type' => $product->type ?? 'product',
                    'is_active' => (bool) $product->is_active,
                    'updated_at' => $product->updated_at->toIso8601String(),
                ];

                return $data;
            });

        // Get deleted product IDs (soft deletes)
        $deletedIds = Product::withoutGlobalScope('account')
            ->where('account_id', $accountId)
            ->onlyTrashed()
            ->where('deleted_at', '>', $sinceDate)
            ->pluck('id')
            ->toArray();

        return [
            'products' => $products->values()->toArray(),
            'deleted_ids' => $deletedIds,
            'sync_timestamp' => now()->toIso8601String(),
            'total_records' => $products->count(),
        ];
    }

    /**
     * Get customers delta (changes since last sync)
     */
    public function getCustomersDelta(int $accountId, ?string $since = null): array
    {
        $sinceDate = $since ? Carbon::parse($since) : Carbon::now()->subYears(10);

        // Get updated/created customers
        $customers = Customer::withoutGlobalScope('account')
            ->where('account_id', $accountId)
            ->where('updated_at', '>', $sinceDate)
            ->with('loyaltyCard')
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'account_id' => $customer->account_id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'email' => $customer->email,
                    'loyalty_card_number' => $customer->loyaltyCard?->card_number,
                    'current_points' => (int) ($customer->current_points ?? 0),
                    'customer_type' => $customer->customer_type ?? 'regular',
                    'updated_at' => $customer->updated_at->toIso8601String(),
                ];
            });

        // Get deleted customer IDs (soft deletes)
        $deletedIds = Customer::withoutGlobalScope('account')
            ->where('account_id', $accountId)
            ->onlyTrashed()
            ->where('deleted_at', '>', $sinceDate)
            ->pluck('id')
            ->toArray();

        return [
            'customers' => $customers->values()->toArray(),
            'deleted_ids' => $deletedIds,
            'sync_timestamp' => now()->toIso8601String(),
            'total_records' => $customers->count(),
        ];
    }

    /**
     * Get fiscal printer config for kiosk
     */
    public function getFiscalConfig(int $accountId): ?array
    {
        $config = FiscalPrinterConfig::where('account_id', $accountId)
            ->where('is_active', true)
            ->first();

        if (!$config) {
            return null;
        }

        return [
            'account_id' => $config->account_id,
            'provider' => $config->provider,
            'ip_address' => $config->ip_address,
            'port' => $config->port,
            'operator_code' => $config->username,
            'operator_password' => $config->password,
            'is_active' => (bool) $config->is_active,
        ];
    }

    /**
     * Get sync configuration
     */
    public function getSyncConfig(): array
    {
        return [
            'sync_interval_seconds' => 300,
            'heartbeat_interval_seconds' => 30,
            'max_retry_attempts' => 3,
            'batch_size' => 100,
        ];
    }
}
