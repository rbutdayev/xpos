<?php

namespace App\Http\Controllers;

use App\Models\GiftCard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GiftCardConfigurationController extends Controller
{
    /**
     * Show configuration page with available cards grouped by status
     */
    public function index()
    {
        Gate::authorize('use-gift-cards');

        $accountId = Auth::user()->account_id;

        // Get cards grouped by status
        $freeCards = GiftCard::where('account_id', $accountId)
            ->where('status', GiftCard::STATUS_FREE)
            ->orderBy('card_number')
            ->get();

        $configuredCards = GiftCard::where('account_id', $accountId)
            ->where('status', GiftCard::STATUS_CONFIGURED)
            ->orderBy('denomination')
            ->orderBy('card_number')
            ->get()
            ->groupBy('denomination');

        $activeCards = GiftCard::where('account_id', $accountId)
            ->where('status', GiftCard::STATUS_ACTIVE)
            ->with('customer')
            ->orderBy('activated_at', 'desc')
            ->limit(50)
            ->get();

        return Inertia::render('GiftCards/Configure', [
            'freeCards' => $freeCards,
            'configuredCards' => $configuredCards,
            'activeCards' => $activeCards,
            'statistics' => [
                'free_count' => $freeCards->count(),
                'configured_count' => GiftCard::where('account_id', $accountId)
                    ->where('status', GiftCard::STATUS_CONFIGURED)
                    ->count(),
                'active_count' => GiftCard::where('account_id', $accountId)
                    ->where('status', GiftCard::STATUS_ACTIVE)
                    ->count(),
                'depleted_count' => GiftCard::where('account_id', $accountId)
                    ->where('status', GiftCard::STATUS_DEPLETED)
                    ->count(),
            ],
        ]);
    }

    /**
     * Bulk configure cards with denominations
     */
    public function bulkConfigure(Request $request)
    {
        Gate::authorize('use-gift-cards');

        $validated = $request->validate([
            'configurations' => 'required|array|min:1',
            'configurations.*.denomination' => 'required|numeric|min:1',
            'configurations.*.quantity' => 'required|integer|min:1',
        ]);

        $accountId = Auth::user()->account_id;
        $configured = 0;
        $errors = [];

        DB::transaction(function () use ($validated, $accountId, &$configured, &$errors) {
            foreach ($validated['configurations'] as $config) {
                $denomination = (float) $config['denomination'];
                $quantity = (int) $config['quantity'];

                // Get free cards for this account
                $freeCards = GiftCard::where('account_id', $accountId)
                    ->where('status', GiftCard::STATUS_FREE)
                    ->limit($quantity)
                    ->get();

                if ($freeCards->count() < $quantity) {
                    $errors[] = "Kifayət qədər boş kart yoxdur. Tələb: {$quantity}, Mövcud: {$freeCards->count()}";
                    continue;
                }

                // Configure each card
                foreach ($freeCards as $card) {
                    $card->configure($denomination);
                    $configured++;
                }
            }
        });

        if (count($errors) > 0) {
            return back()->with('warning', "Konfiqurasiya tamamlandı: {$configured} kart. Xətalar: " . implode(', ', $errors));
        }

        return back()->with('success', "{$configured} hədiyyə kartı uğurla konfiqurasiya edildi.");
    }


    /**
     * Get available denominations (configured cards that can be sold)
     */
    public function getAvailableDenominations()
    {
        Gate::authorize('use-gift-cards');

        $accountId = Auth::user()->account_id;

        $denominations = GiftCard::where('account_id', $accountId)
            ->where('status', GiftCard::STATUS_CONFIGURED)
            ->select('denomination', DB::raw('COUNT(*) as count'))
            ->groupBy('denomination')
            ->orderBy('denomination')
            ->get();

        return response()->json([
            'denominations' => $denominations,
        ]);
    }

    /**
     * Update denomination of configured cards (bulk)
     */
    public function updateDenomination(Request $request)
    {
        Gate::authorize('use-gift-cards');

        $validated = $request->validate([
            'old_denomination' => 'required|numeric',
            'new_denomination' => 'required|numeric|min:1',
            'quantity' => 'nullable|integer|min:1',
        ]);

        $accountId = Auth::user()->account_id;
        $oldDenomination = (float) $validated['old_denomination'];
        $newDenomination = (float) $validated['new_denomination'];
        $quantity = $validated['quantity'] ?? null;

        DB::transaction(function () use ($accountId, $oldDenomination, $newDenomination, $quantity, &$updated) {
            $query = GiftCard::where('account_id', $accountId)
                ->where('status', GiftCard::STATUS_CONFIGURED)
                ->where('denomination', $oldDenomination);

            if ($quantity) {
                $query->limit($quantity);
            }

            $cards = $query->get();

            if ($cards->isEmpty()) {
                throw new \Exception('Dəyişdiriləcək kart tapılmadı.');
            }

            foreach ($cards as $card) {
                $card->update([
                    'denomination' => $newDenomination,
                    'initial_balance' => $newDenomination,
                    'current_balance' => $newDenomination,
                ]);
            }

            $updated = $cards->count();
        });

        return back()->with('success', "{$updated} kartın nominal dəyəri ₼{$oldDenomination}-dən ₼{$newDenomination}-ə dəyişdirildi.");
    }

    /**
     * Reset a configured card back to free status
     */
    public function resetCard(Request $request, $id)
    {
        Gate::authorize('use-gift-cards');

        $card = GiftCard::where('account_id', Auth::user()->account_id)
            ->findOrFail($id);

        if (!$card->isConfigured()) {
            return back()->withErrors(['error' => 'Yalnız konfiqurasiya olunmuş kartları sıfırlaya bilərsiniz.']);
        }

        $card->update([
            'status' => GiftCard::STATUS_FREE,
            'denomination' => null,
            'initial_balance' => null,
            'current_balance' => null,
        ]);

        return back()->with('success', 'Kart uğurla sıfırlandı.');
    }
}
