<?php

namespace App\Http\Controllers\Kiosk;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\GiftCard;
use App\Models\LoyaltyCard;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class KioskQuickActionsController extends Controller
{
    /**
     * Search products by barcode, SKU, or name
     * GET /api/kiosk/products/search?q=
     */
    public function searchProducts(Request $request)
    {
        $request->validate([
            'q' => 'required|string|max:255',
        ]);

        $accountId = $request->input('kiosk_account_id');
        $query = $request->input('q');

        // Cache results for 5 minutes to reduce database load
        $cacheKey = "kiosk:products:search:{$accountId}:" . md5($query);

        $products = Cache::remember($cacheKey, 300, function () use ($accountId, $query) {
            return Product::where('account_id', $accountId)
                ->where('type', 'product')
                ->where('is_active', true)
                ->where(function ($q) use ($query) {
                    $q->where('barcode', 'like', '%' . $query . '%')
                      ->orWhere('sku', 'like', '%' . $query . '%')
                      ->orWhere('name', 'like', '%' . $query . '%');
                })
                ->with(['stock:product_id,warehouse_id,quantity'])
                ->select('id', 'name', 'sku', 'barcode', 'sale_price', 'unit', 'allow_negative_stock')
                ->limit(20)
                ->get()
                ->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'barcode' => $product->barcode,
                        'price' => (float) $product->sale_price,
                        'stock' => $product->stock->sum('quantity'),
                        'unit' => $product->unit,
                        'allow_negative_stock' => $product->allow_negative_stock,
                    ];
                });
        });

        return response()->json([
            'success' => true,
            'products' => $products,
        ]);
    }

    /**
     * Search customers by phone or name
     * GET /api/kiosk/customers/search?q=
     */
    public function searchCustomers(Request $request)
    {
        $request->validate([
            'q' => 'required|string|max:255',
        ]);

        $accountId = $request->input('kiosk_account_id');
        $query = $request->input('q');

        // Cache results for 5 minutes
        $cacheKey = "kiosk:customers:search:{$accountId}:" . md5($query);

        $customers = Cache::remember($cacheKey, 300, function () use ($accountId, $query) {
            return Customer::where('account_id', $accountId)
                ->where('is_active', true)
                ->where(function ($q) use ($query) {
                    $q->where('phone', 'like', '%' . $query . '%')
                      ->orWhere('name', 'like', '%' . $query . '%')
                      ->orWhereHas('loyaltyCard', function ($cardQuery) use ($query) {
                          $cardQuery->where('card_number', 'like', '%' . strtoupper($query) . '%');
                      });
                })
                ->with('loyaltyCard:id,customer_id,card_number')
                ->select('id', 'name', 'phone', 'current_points', 'loyalty_card_id')
                ->limit(20)
                ->get()
                ->map(function ($customer) {
                    return [
                        'id' => $customer->id,
                        'name' => $customer->name,
                        'phone' => $customer->phone,
                        'loyalty_card_number' => $customer->loyaltyCard?->card_number,
                        'current_points' => $customer->current_points ?? 0,
                    ];
                });
        });

        return response()->json([
            'success' => true,
            'customers' => $customers,
        ]);
    }

    /**
     * Quick create customer with minimal fields
     * POST /api/kiosk/customers/quick-store
     */
    public function quickStoreCustomer(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
        ]);

        $accountId = $request->input('kiosk_account_id');

        try {
            $customer = DB::transaction(function () use ($validated, $accountId) {
                return Customer::create([
                    'account_id' => $accountId,
                    'name' => $validated['name'],
                    'phone' => $validated['phone'],
                    'email' => $validated['email'] ?? null,
                    'customer_type' => 'individual',
                    'is_active' => true,
                ]);
            });

            return response()->json([
                'success' => true,
                'customer' => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'loyalty_card_number' => null,
                    'current_points' => 0,
                ],
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Kiosk customer creation failed', [
                'account_id' => $accountId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to create customer',
            ], 500);
        }
    }

    /**
     * Validate loyalty card number
     * POST /api/kiosk/loyalty/validate
     */
    public function validateLoyaltyCard(Request $request)
    {
        $request->validate([
            'card_number' => 'required|string|size:14',
        ]);

        $accountId = $request->input('kiosk_account_id');
        $cardNumber = strtoupper(trim($request->input('card_number')));

        $card = LoyaltyCard::where('card_number', $cardNumber)
            ->where('account_id', $accountId)
            ->with('customer:id,name,phone,current_points')
            ->first();

        if (!$card) {
            return response()->json([
                'success' => false,
                'error' => 'Loyalty card not found',
            ], 404);
        }

        if ($card->isInactive()) {
            return response()->json([
                'success' => false,
                'error' => 'Loyalty card is inactive',
            ], 400);
        }

        if (!$card->isUsed()) {
            return response()->json([
                'success' => false,
                'error' => 'Loyalty card is not assigned to any customer',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'customer' => [
                'id' => $card->customer->id,
                'name' => $card->customer->name,
                'phone' => $card->customer->phone,
                'loyalty_card_number' => $card->card_number,
                'current_points' => $card->customer->current_points ?? 0,
            ],
        ]);
    }

    /**
     * Lookup gift card and validate
     * POST /api/kiosk/gift-card/lookup
     */
    public function lookupGiftCard(Request $request)
    {
        $request->validate([
            'card_number' => 'required|string|max:16',
        ]);

        $accountId = $request->input('kiosk_account_id');
        $cardNumber = strtoupper(trim($request->input('card_number')));

        $giftCard = GiftCard::where('card_number', $cardNumber)
            ->where('account_id', $accountId)
            ->first();

        if (!$giftCard) {
            return response()->json([
                'success' => false,
                'error' => 'Gift card not found',
            ], 404);
        }

        // Check if card is expired
        if ($giftCard->isExpired()) {
            return response()->json([
                'success' => false,
                'error' => 'Gift card has expired',
                'expiry_date' => $giftCard->expiry_date?->format('Y-m-d'),
            ], 400);
        }

        // Check if card is inactive
        if ($giftCard->isInactive()) {
            return response()->json([
                'success' => false,
                'error' => 'Gift card is inactive',
            ], 400);
        }

        // Check if card can be used
        if (!$giftCard->canBeUsed()) {
            return response()->json([
                'success' => false,
                'error' => 'Gift card cannot be used',
                'status' => $giftCard->status,
            ], 400);
        }

        return response()->json([
            'success' => true,
            'gift_card' => [
                'card_number' => $giftCard->card_number,
                'balance' => (float) $giftCard->current_balance,
                'initial_balance' => (float) $giftCard->initial_balance,
                'denomination' => (float) $giftCard->denomination,
                'status' => $giftCard->status,
                'expiry_date' => $giftCard->expiry_date?->format('Y-m-d'),
            ],
        ]);
    }
}
