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
     * Get formatted request data for client-side printing
     * This is used when client_side_printing is enabled
     */
    public function getFormattedRequestData(FiscalPrinterConfig $config, Sale $sale): array
    {
        $url = $this->getApiEndpoint($config, 'print');
        $saleData = $this->formatSaleData($config, $sale);

        // Caspos requires UTF-8 encoding in Content-Type header
        $contentType = $config->provider === 'caspos'
            ? 'application/json; charset=utf-8'
            : 'application/json';

        $headers = array_merge(
            [
                'Content-Type' => $contentType,
                'Accept' => 'application/json',
            ],
            $config->getAuthHeaders()
        );

        return [
            'url' => $url,
            'headers' => $headers,
            'body' => $saleData,
            'provider' => $config->provider,
        ];
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

            // Caspos requires UTF-8 encoding in Content-Type header
            $contentType = $config->provider === 'caspos'
                ? 'application/json; charset=utf-8'
                : 'application/json';

            $headers = array_merge(
                [
                    'Content-Type' => $contentType,
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

                // Caspos uses different response format: {"code": 0, "message": "...", "data": {...}}
                if ($config->provider === 'caspos') {
                    $code = $responseData['code'] ?? 999;
                    if ($code === 0 || $code === '0') {
                        return [
                            'success' => true,
                            'fiscal_number' => $responseData['data']['document_number'] ?? $responseData['data']['document_id'] ?? null,
                            'response' => $response->body(),
                        ];
                    } else {
                        return [
                            'success' => false,
                            'error' => $responseData['message'] ?? 'Error code: ' . $code,
                        ];
                    }
                }

                // Handle other providers
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
        // Caspos uses base URL without endpoints (operation-based)
        if ($config->provider === 'caspos') {
            return $config->getFullUrl();
        }

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
        // Caspos has a completely different API structure
        if ($config->provider === 'caspos') {
            return $this->formatCasposRequest($config, $sale);
        }

        $sale->load(['items.product', 'payments', 'customer', 'branch']);

        $items = $sale->items->map(function ($item) use ($config) {
            return [
                'name' => $item->product->name ?? 'Unknown Product',
                'quantity' => (float) $item->quantity,
                'price' => (float) $item->unit_price,
                'total' => (float) $item->total,
                'tax_name' => $config->default_tax_name,
                'tax_rate' => $config->default_tax_rate,
                'tax_amount' => (float) ($item->total * $config->default_tax_rate / 100),
                'discount' => (float) ($item->discount_amount ?? 0),
            ];
        })->toArray();

        $payments = $sale->payments->map(function ($payment) {
            return [
                'method' => $payment->method,
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
     * Format Caspos request according to API documentation
     * API Doc: caspos.pdf
     */
    protected function formatCasposRequest(FiscalPrinterConfig $config, Sale $sale): array
    {
        $sale->load(['items.product', 'payments', 'customer']);

        // Map VAT type (1=18%, 2=Trade18%, 3=VAT-free, 5=0%, 6=Simplified2%, 7=Simplified8%)
        $vatType = 1; // Default to 18% VAT
        if ($config->default_tax_rate == 18) {
            $vatType = 1;
        } elseif ($config->default_tax_rate == 0) {
            $vatType = 5;
        } elseif ($config->default_tax_rate == 2) {
            $vatType = 6;
        } elseif ($config->default_tax_rate == 8) {
            $vatType = 7;
        }

        // Format items according to Caspos API spec
        $items = $sale->items->map(function ($item) use ($vatType) {
            // Map product unit to Caspos quantityType
            $quantityType = $this->mapUnitToQuantityType($item->product->unit ?? 'ədəd');

            return [
                'name' => $item->product->name ?? 'Unknown Product',
                'code' => $item->product->barcode ?? $item->product_id,
                'quantity' => number_format((float) $item->quantity, 3, '.', ''),
                'salePrice' => number_format((float) $item->unit_price, 2, '.', ''),
                'purchasePrice' => number_format((float) ($item->product->cost_price ?? 0), 2, '.', ''),
                'codeType' => 1, // 0=Plain text, 1=EAN8, 2=EAN13, 3=Service
                'quantityType' => $quantityType,
                'vatType' => $vatType,
                'discountAmount' => number_format((float) ($item->discount_amount ?? 0), 2, '.', ''),
                'itemUuid' => \Illuminate\Support\Str::uuid()->toString(),
            ];
        })->toArray();

        // Calculate payment methods
        $cashPayment = 0.0;
        $cardPayment = 0.0;
        $creditPayment = 0.0;
        $bonusPayment = 0.0;

        // For credit sales (debt), Azerbaijan fiscal rules require recording as cash sale
        // because fiscally a sale occurred. Debt tracking is internal accounting.
        if ($sale->payment_status === 'credit' && $sale->payments->isEmpty()) {
            // Record full credit sale as cash for fiscal purposes
            $cashPayment = (float) $sale->total;
            Log::info('Credit sale recorded as cash for fiscal printer', [
                'sale_id' => $sale->sale_id,
                'amount' => $cashPayment
            ]);
        } else {
            // Process actual payment records
            $primaryPaymentMethod = null; // Track the payment method for partial sales

            foreach ($sale->payments as $payment) {
                $amount = (float) $payment->amount;
                $method = trim(strtolower($payment->method ?? ''));

                // Remember the first payment method for partial sales
                if ($primaryPaymentMethod === null && !empty($method)) {
                    $primaryPaymentMethod = $method;
                }

                // Map payment method to Caspos payment types
                switch ($method) {
                    case 'cash':
                    case 'nağd':
                    case 'nagd':
                        $cashPayment += $amount;
                        break;
                    case 'card':
                    case 'terminal':
                    case 'kart':
                    case 'köçürmə':
                    case 'kocurme':
                    case 'bank':
                        $cardPayment += $amount;
                        break;
                    case 'credit':
                    case 'kredit':
                        $creditPayment += $amount;
                        break;
                    case 'bonus':
                        $bonusPayment += $amount;
                        break;
                    default:
                        // If payment method is empty or unknown, default to cash
                        Log::warning('Unknown payment method for Caspos', [
                            'sale_id' => $sale->sale_id,
                            'payment_method' => $payment->method,
                            'amount' => $amount
                        ]);
                        $cashPayment += $amount;
                }
            }

            // For partial payment sales with remaining balance as debt
            // Use the SAME payment method as the paid portion for fiscal purposes
            if ($sale->payment_status === 'partial') {
                $totalPaid = $cashPayment + $cardPayment + $creditPayment + $bonusPayment;
                $unpaidAmount = (float) $sale->total - $totalPaid;

                if ($unpaidAmount > 0) {
                    // Add unpaid amount using the same payment method
                    switch ($primaryPaymentMethod) {
                        case 'kart':
                        case 'köçürmə':
                        case 'terminal':
                            $cardPayment += $unpaidAmount;
                            Log::info('Partial sale unpaid amount recorded as card for fiscal printer', [
                                'sale_id' => $sale->sale_id,
                                'unpaid_amount' => $unpaidAmount,
                                'method' => $primaryPaymentMethod
                            ]);
                            break;
                        default:
                            // Default to cash if method is unknown or cash
                            $cashPayment += $unpaidAmount;
                            Log::info('Partial sale unpaid amount recorded as cash for fiscal printer', [
                                'sale_id' => $sale->sale_id,
                                'unpaid_amount' => $unpaidAmount
                            ]);
                    }
                }
            }
        }

        // Format according to Caspos API: {"operation": "sale", "data": {...}, "username": "...", "password": "..."}
        return [
            'operation' => 'sale',
            'username' => $config->username,
            'password' => $config->password,
            'data' => [
                'documentUUID' => \Illuminate\Support\Str::uuid()->toString(),
                'cashPayment' => number_format($cashPayment, 2, '.', ''),
                'creditPayment' => number_format($creditPayment, 2, '.', ''),
                'depositPayment' => number_format(0.0, 2, '.', ''),
                'cardPayment' => number_format($cardPayment, 2, '.', ''),
                'bonusPayment' => number_format($bonusPayment, 2, '.', ''),
                'items' => $items,
                'clientName' => $sale->customer?->name ?? null,
                'clientTotalBonus' => $sale->customer?->loyalty_points ?? 0.0,
                'clientEarnedBonus' => 0.0,
                'clientBonusCardNumber' => $sale->customer?->loyalty_card_number ?? null,
                'cashierName' => $this->getCashierDisplayName($sale->user),
                'note' => $sale->notes ?? '',
                'currency' => 'AZN',
            ],
        ];
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
            // Caspos uses POST with operation "getInfo"
            if ($config->provider === 'caspos') {
                $url = $this->getApiEndpoint($config, 'status');
                $requestData = [
                    'operation' => 'getInfo',
                    'username' => $config->username,
                    'password' => $config->password,
                ];

                $response = Http::timeout(10)
                    ->withHeaders([
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json; charset=utf-8',
                    ])
                    ->post($url, $requestData);

                if ($response->successful()) {
                    $responseData = $response->json();
                    $code = $responseData['code'] ?? 999;

                    if ($code === 0 || $code === '0') {
                        return [
                            'success' => true,
                            'message' => 'Connection successful to ' . $config->getProviderName(),
                            'provider' => $config->provider,
                            'data' => $responseData['data'] ?? null,
                        ];
                    } else {
                        return [
                            'success' => false,
                            'error' => $responseData['message'] ?? 'Error code: ' . $code,
                        ];
                    }
                } else {
                    return [
                        'success' => false,
                        'error' => 'HTTP ' . $response->status() . ': ' . $response->body(),
                    ];
                }
            }

            // For other providers
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

    /**
     * Map product unit to Caspos quantityType
     * 0=Ədəd, 1=KQ, 2=Litr, 3=Metr, 4=Kv.metr, 5=Kub.metr
     */
    protected function mapUnitToQuantityType(?string $unit): int
    {
        if (!$unit) {
            return 0; // Default to Ədəd (pieces)
        }

        return match(strtolower($unit)) {
            'ədəd', 'edəd', 'eded', 'piece', 'pieces', 'pcs', 'adet' => 0,
            'kq', 'kg', 'kiloqram', 'kilogram' => 1,
            'litr', 'liter', 'l' => 2,
            'metr', 'meter', 'm' => 3,
            'kv.metr', 'kv metr', 'kvadrat metr', 'square meter', 'm2', 'm²' => 4,
            'kub.metr', 'kub metr', 'kubik metr', 'cubic meter', 'm3', 'm³' => 5,
            default => 0, // Default to Ədəd if unknown
        };
    }

    /**
     * Get cashier display name for fiscal receipt
     * If name looks like email, use position or role instead
     */
    protected function getCashierDisplayName($user): string
    {
        if (!$user) {
            return 'Kassir';
        }

        $name = $user->name;

        // If name looks like an email (contains @), try to use position or role instead
        if (str_contains($name, '@')) {
            if (!empty($user->position)) {
                return $user->position;
            }

            // Translate role to Azerbaijani
            return match($user->role) {
                'account_owner' => 'Sahibkar',
                'admin' => 'Administrator',
                'branch_manager' => 'Filial müdiri',
                'warehouse_manager' => 'Anbar müdiri',
                'sales_staff' => 'Satış işçisi',
                'cashier' => 'Kassir',
                'accountant' => 'Mühasib',
                'tailor' => 'Dərzi',
                default => 'Kassir',
            };
        }

        return $name;
    }
}
