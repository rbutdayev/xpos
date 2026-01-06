<?php

namespace App\Http\Controllers;

use App\Models\GiftCard;
use App\Models\GiftCardTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GiftCardController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('use-gift-cards');

        $query = GiftCard::byAccount()->with(['customer']);

        if ($request->filled('search')) {
            $query->where('card_number', 'like', '%' . strtoupper($request->search) . '%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $cards = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total' => GiftCard::byAccount()->count(),
            'active' => GiftCard::byAccount()->active()->count(),
            'depleted' => GiftCard::byAccount()->depleted()->count(),
            'expired' => GiftCard::byAccount()->expired()->count(),
            'total_balance' => GiftCard::byAccount()->active()->sum('current_balance'),
        ];

        return Inertia::render('GiftCards/Index', [
            'cards' => $cards,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function show(Request $request, GiftCard $card)
    {
        Gate::authorize('use-gift-cards');

        // Ensure card belongs to this account
        if ($card->account_id !== auth()->user()->account_id) {
            abort(403, 'Bu kart sizin hesabınıza aid deyil.');
        }

        $card->load(['customer', 'transactions.user', 'transactions.sale']);

        return Inertia::render('GiftCards/Show', [
            'card' => $card,
        ]);
    }

    /**
     * AJAX endpoint for quick view modal
     */
    public function details(Request $request, GiftCard $card)
    {
        Gate::authorize('use-gift-cards');

        // Ensure card belongs to this account
        if ($card->account_id !== auth()->user()->account_id) {
            abort(403, 'Bu kart sizin hesabınıza aid deyil.');
        }

        $card->load(['customer', 'transactions.user']);

        return response()->json($card);
    }

    public function activate(Request $request)
    {
        Gate::authorize('use-gift-cards');

        $request->validate([
            'card_number' => 'required|string|exists:gift_cards,card_number',
            'customer_id' => 'nullable|exists:customers,id',
        ]);

        $card = GiftCard::byAccount()
            ->where('card_number', strtoupper($request->card_number))
            ->firstOrFail();

        if (!$card->isActive()) {
            return redirect()->back()->with('error', 'Bu kart aktiv deyil.');
        }

        if ($card->customer_id) {
            return redirect()->back()->with('error', 'Bu kart artıq aktivləşdirilib.');
        }

        DB::beginTransaction();
        try {
            $card->activate($request->customer_id);

            GiftCardTransaction::createTransaction(
                $card,
                GiftCardTransaction::TYPE_ACTIVATE,
                0,
                auth()->id(),
                null,
                'Kart müştəriyə verildi'
            );

            DB::commit();

            return redirect()->back()->with('success', 'Hədiyyə kartı aktivləşdirildi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Xəta: ' . $e->getMessage());
        }
    }

    /**
     * AJAX endpoint for POS to lookup gift card by code
     */
    public function lookup(Request $request)
    {
        Gate::authorize('use-gift-cards');

        $request->validate([
            'card_number' => 'required|string',
        ]);

        $card = GiftCard::byAccount()
            ->where('card_number', strtoupper($request->card_number))
            ->first();

        if (!$card) {
            return response()->json([
                'success' => false,
                'message' => 'Kart tapılmadı.',
            ], 404);
        }

        if (!$card->canBeUsed()) {
            return response()->json([
                'success' => false,
                'message' => 'Bu kart istifadə edilə bilməz. Status: ' . $card->status,
            ], 400);
        }

        return response()->json([
            'success' => true,
            'card' => [
                'id' => $card->id,
                'card_number' => $card->card_number,
                'balance' => $card->current_balance,
                'initial_balance' => $card->initial_balance,
                'status' => $card->status,
                'expiry_date' => $card->expiry_date?->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Validate gift card for redemption at POS
     */
    public function validateCard(Request $request)
    {
        Gate::authorize('use-gift-cards');

        $validated = $request->validate([
            'card_number' => 'required|string',
            'amount' => 'required|numeric|min:0',
        ]);

        $card = GiftCard::byAccount()
            ->where('card_number', strtoupper($validated['card_number']))
            ->first();

        if (!$card) {
            return response()->json([
                'valid' => false,
                'message' => 'Kart tapılmadı.',
            ], 404);
        }

        if (!$card->canBeUsed()) {
            return response()->json([
                'valid' => false,
                'message' => 'Bu kart istifadə edilə bilməz.',
            ], 400);
        }

        if ($card->current_balance < $validated['amount']) {
            return response()->json([
                'valid' => false,
                'message' => 'Kartda kifayət qədər balans yoxdur. Mövcud: ' . $card->current_balance . ' AZN',
            ], 400);
        }

        return response()->json([
            'valid' => true,
            'card_id' => $card->id,
            'balance' => $card->current_balance,
        ]);
    }

    /**
     * Reactivate a depleted gift card for resale
     */
    public function reactivate(Request $request, GiftCard $card)
    {
        Gate::authorize('use-gift-cards');

        // Ensure card belongs to this account
        if ($card->account_id !== auth()->user()->account_id) {
            abort(403, 'Bu kart sizin hesabınıza aid deyil.');
        }

        // Only depleted or expired cards can be reactivated
        if (!$card->isDepleted() && !$card->isExpired()) {
            return redirect()->back()->with('error', 'Yalnız istifadə olunmuş və ya vaxtı keçmiş kartlar yenidən aktivləşdirilə bilər.');
        }

        DB::beginTransaction();
        try {
            // Capture current balance before resetting
            $balanceBefore = $card->current_balance ?? 0;

            // Create transaction record BEFORE resetting
            GiftCardTransaction::create([
                'gift_card_id' => $card->id,
                'sale_id' => null,
                'transaction_type' => GiftCardTransaction::TYPE_RESET,
                'amount' => 0,
                'balance_before' => $balanceBefore,
                'balance_after' => 0,
                'user_id' => auth()->id(),
                'notes' => 'Kart yenidən satış üçün sıfırlandı',
            ]);

            // Reset card for resale
            $card->resetForResale();

            DB::commit();

            return redirect()->back()->with('success', 'Hədiyyə kartı yenidən satış üçün hazırlandı.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Xəta: ' . $e->getMessage());
        }
    }

    /**
     * Bulk delete gift cards
     */
    public function bulkDelete(Request $request)
    {
        Gate::authorize('use-gift-cards');

        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:gift_cards,id',
        ]);

        $user = auth()->user();
        $deletedCount = 0;
        $failedCards = [];

        DB::beginTransaction();
        try {
            $cards = GiftCard::whereIn('id', $request->ids)
                ->where('account_id', $user->account_id)
                ->get();

            foreach ($cards as $card) {
                try {
                    // Delete related transactions first
                    GiftCardTransaction::where('gift_card_id', $card->id)->delete();

                    // Delete the card
                    $card->delete();
                    $deletedCount++;
                } catch (\Exception $e) {
                    \Log::error('Bulk gift card deletion failed', [
                        'card_id' => $card->id,
                        'error' => $e->getMessage(),
                    ]);
                    $failedCards[] = $card->card_number ?? "ID: {$card->id}";
                }
            }

            DB::commit();

            if (count($failedCards) > 0) {
                $failedList = implode(', ', $failedCards);
                $message = $deletedCount > 0
                    ? "{$deletedCount} hədiyyə kartı silindi. Bu kartlar silinə bilmədi: {$failedList}"
                    : "Heç bir hədiyyə kartı silinmədi. Xəta: {$failedList}";

                return redirect()->back()->with('warning', $message);
            }

            return redirect()->back()->with('success', "{$deletedCount} hədiyyə kartı uğurla silindi.");
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Bulk gift card deletion failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->with('error', 'Xəta baş verdi: ' . $e->getMessage());
        }
    }
}
