<?php

namespace App\Services;

use App\Models\FiscalPrinterConfig;
use App\Models\FiscalPrinterLog;
use App\Models\Sale;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FiscalPrinterService
{
    /**
     * Print receipt to fiscal printer
     */
    public function printReceipt(int $accountId, Sale $sale): array
    {
        $config = $this->getConfig($accountId);

        if (!$config) {
            return [
                'success' => false,
                'error' => 'Fiscal printer not configured for this account',
            ];
        }

        if (!$config->isConfigured()) {
            return [
                'success' => false,
                'error' => 'Fiscal printer is not active or IP address not set',
            ];
        }

        $log = FiscalPrinterLog::create([
            'account_id' => $accountId,
            'sale_id' => $sale->sale_id,
            'status' => 'pending',
            'request_data' => null,
        ]);

        try {
            $response = $this->sendToTerminal($config, $sale, $log);

            if ($response['success']) {
                $log->markAsSuccess($response);
                return [
                    'success' => true,
                    'message' => 'Fiscal receipt printed successfully',
                    'fiscal_number' => $response['fiscal_number'] ?? null,
                    'log_id' => $log->id,
                ];
            } else {
                $log->markAsFailed($response['error']);
                return [
                    'success' => false,
                    'error' => $response['error'],
                    'log_id' => $log->id,
                ];
            }
        } catch (\Exception $e) {
            $log->markAsFailed($e->getMessage());
            Log::error('Fiscal printer failed', [
                'account_id' => $accountId,
                'sale_id' => $sale->sale_id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Failed to print fiscal receipt: ' . $e->getMessage(),
                'log_id' => $log->id,
            ];
        }
    }

    /**
     * Get fiscal printer configuration for an account
     */
    protected function getConfig(int $accountId): ?FiscalPrinterConfig
    {
        return FiscalPrinterConfig::where('account_id', $accountId)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Send sale data to fiscal printer terminal
     */
    protected function sendToTerminal(FiscalPrinterConfig $config, Sale $sale, FiscalPrinterLog $log): array
    {
        try {
            $saleData = $this->formatSaleData($config, $sale);

            $log->update([
                'request_data' => json_encode($saleData),
            ]);

            $url = $this->getApiEndpoint($config, 'print');

            Log::info('Sending to fiscal printer', [
                'url' => $url,
                'sale_id' => $sale->sale_id,
            ]);

            $headers = array_merge(
                [
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ],
                $config->getAuthHeaders()
            );

            $response = Http::timeout(30)
                ->withHeaders($headers)
                ->post($url, $saleData);

            Log::info('Fiscal printer response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            if ($response->successful()) {
                $responseData = $response->json();

                if (isset($responseData['success']) && $responseData['success']) {
                    return [
                        'success' => true,
                        'fiscal_number' => $responseData['fiscal_number'] ?? $responseData['fiscalNumber'] ?? null,
                        'response' => $response->body(),
                    ];
                } else {
                    return [
                        'success' => false,
                        'error' => $responseData['error'] ?? $responseData['message'] ?? 'Unknown error from fiscal printer',
                    ];
                }
            } else {
                return [
                    'success' => false,
                    'error' => 'HTTP ' . $response->status() . ': ' . $response->body(),
                ];
            }
        } catch (\Exception $e) {
            Log::error('Fiscal printer exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return [
                'success' => false,
                'error' => 'Fiscal printer connection failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get API endpoint for provider
     */
    protected function getApiEndpoint(FiscalPrinterConfig $config, string $action): string
    {
        // Load provider configuration from database
        $provider = \App\Models\FiscalPrinterProvider::where('code', $config->provider)
            ->where('is_active', true)
            ->first();

        if ($provider) {
            // Use provider configuration from database
            return $provider->getEndpoint($config->ip_address, $config->port, $action);
        }

        // Fallback to old hardcoded method if provider not found in database
        return match($config->provider) {
            'nba' => $config->getFullUrl("api/{$action}"),
            'caspos' => $config->getFullUrl("api/{$action}"),
            'oneclick' => $config->getFullUrl("api/{$action}"),
            'omnitech' => $config->getFullUrl("api/v2/{$action}"),
            'azsmart' => $config->getFullUrl("api/{$action}"),
            default => $config->getFullUrl("api/{$action}"),
        };
    }

    /**
     * Format sale data for fiscal printer API
     */
    protected function formatSaleData(FiscalPrinterConfig $config, Sale $sale): array
    {
        $sale->load(['items.product', 'payments', 'customer', 'branch']);

        $items = $sale->items->map(function ($item) use ($config) {
            return [
                'name' => $item->product_name,
                'quantity' => (float) $item->quantity,
                'price' => (float) $item->unit_price,
                'total' => (float) $item->total_price,
                'tax_name' => $config->default_tax_name,
                'tax_rate' => $config->default_tax_rate,
                'tax_amount' => (float) ($item->total_price * $config->default_tax_rate / 100),
                'discount' => (float) ($item->discount_amount ?? 0),
            ];
        })->toArray();

        $payments = $sale->payments->map(function ($payment) {
            return [
                'method' => $payment->payment_method,
                'amount' => (float) $payment->amount,
            ];
        })->toArray();

        $baseData = [
            'sale_id' => $sale->sale_id,
            'sale_number' => $sale->sale_number,
            'sale_date' => $sale->sale_date,
            'branch' => [
                'name' => $sale->branch->name ?? 'Main Branch',
                'address' => $sale->branch->address ?? null,
            ],
            'customer' => $sale->customer ? [
                'name' => $sale->customer->name,
                'phone' => $sale->customer->phone,
                'tax_number' => $sale->customer->tax_number ?? null,
            ] : null,
            'items' => $items,
            'subtotal' => (float) $sale->subtotal,
            'tax_name' => $config->default_tax_name,
            'tax_rate' => $config->default_tax_rate,
            'tax_amount' => (float) $sale->tax_amount,
            'discount_amount' => (float) $sale->discount_amount,
            'total' => (float) $sale->total,
            'payments' => $payments,
        ];

        return match($config->provider) {
            'caspos' => array_merge($baseData, [
                'device_serial' => $config->device_serial,
            ]),
            'azsmart' => array_merge($baseData, [
                'merchant_id' => $config->merchant_id,
            ]),
            'oneclick' => array_merge($baseData, [
                'security_key' => $config->security_key,
            ]),
            default => $baseData,
        };
    }

    /**
     * Test connection to fiscal printer
     */
    public function testConnection(int $accountId): array
    {
        $config = $this->getConfig($accountId);

        if (!$config) {
            return [
                'success' => false,
                'error' => 'Fiscal printer not configured',
            ];
        }

        if (!$config->isConfigured()) {
            return [
                'success' => false,
                'error' => 'Fiscal printer configuration incomplete',
            ];
        }

        try {
            $url = $this->getApiEndpoint($config, 'status');

            $response = Http::timeout(10)
                ->withHeaders(array_merge(
                    ['Accept' => 'application/json'],
                    $config->getAuthHeaders()
                ))
                ->get($url);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'Connection successful to ' . $config->getProviderName(),
                    'provider' => $config->provider,
                    'data' => $response->json(),
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'HTTP ' . $response->status() . ': ' . $response->body(),
                ];
            }
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Connection failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get fiscal printer logs for an account
     */
    public function getLogs(int $accountId, int $limit = 50): \Illuminate\Database\Eloquent\Collection
    {
        return FiscalPrinterLog::where('account_id', $accountId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get fiscal printer statistics for an account
     */
    public function getStatistics(int $accountId): array
    {
        $total = FiscalPrinterLog::where('account_id', $accountId)->count();
        $success = FiscalPrinterLog::where('account_id', $accountId)->where('status', 'success')->count();
        $failed = FiscalPrinterLog::where('account_id', $accountId)->where('status', 'failed')->count();
        $pending = FiscalPrinterLog::where('account_id', $accountId)->where('status', 'pending')->count();

        return [
            'total' => $total,
            'success' => $success,
            'failed' => $failed,
            'pending' => $pending,
        ];
    }
}
