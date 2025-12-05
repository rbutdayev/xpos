<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
        Gate::authorize('manage-gift-cards');

        $query = GiftCard::query()->with(['account', 'customer']);

        if ($request->filled('search')) {
            $query->where('card_number', 'like', '%' . strtoupper($request->search) . '%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('account_id')) {
            $query->where('account_id', $request->account_id);
        }

        if ($request->filled('denomination')) {
            $query->where('denomination', $request->denomination);
        }

        $cards = $query->orderBy('created_at', 'desc')
            ->paginate(50)
            ->withQueryString();

        $stats = [
            'total' => GiftCard::count(),
            'free' => GiftCard::where('status', GiftCard::STATUS_FREE)->count(),
            'configured' => GiftCard::where('status', GiftCard::STATUS_CONFIGURED)->count(),
            'active' => GiftCard::active()->count(),
            'depleted' => GiftCard::depleted()->count(),
            'expired' => GiftCard::expired()->count(),
            'inactive' => GiftCard::inactive()->count(),
            'total_balance' => GiftCard::active()->sum('current_balance'),
        ];

        // Get all accounts for dropdown
        $accounts = \App\Models\Account::select('id', 'company_name')
            ->orderBy('company_name')
            ->get();

        return Inertia::render('Admin/GiftCards/Index', [
            'cards' => $cards,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'account_id', 'denomination']),
            'accounts' => $accounts,
        ]);
    }

    public function generate(Request $request)
    {
        Gate::authorize('manage-gift-cards');

        $request->validate([
            'quantity' => 'required|integer|min:1|max:1000',
            'account_id' => 'required|exists:accounts,id',
        ]);

        $quantity = $request->quantity;
        $accountId = $request->account_id;
        $cards = [];

        DB::beginTransaction();
        try {
            for ($i = 0; $i < $quantity; $i++) {
                $cardNumber = GiftCard::generateUniqueCardNumber();
                $cardData = [
                    'card_number' => $cardNumber,
                    'status' => GiftCard::STATUS_FREE,
                    'account_id' => $accountId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $cards[] = $cardData;
            }

            GiftCard::insert($cards);
            DB::commit();

            return redirect()->back()->with('success', "{$quantity} boş hədiyyə kartı uğurla yaradıldı və hesaba təyin edildi.");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Kartlar yaradılarkən xəta baş verdi: ' . $e->getMessage());
        }
    }

    public function deactivate(Request $request, GiftCard $card)
    {
        Gate::authorize('manage-gift-cards');

        DB::beginTransaction();
        try {
            $card->markAsInactive();

            GiftCardTransaction::createTransaction(
                $card,
                GiftCardTransaction::TYPE_CANCEL,
                0,
                auth()->id(),
                null,
                'Kartı super admin tərəfindən deaktiv edildi'
            );

            DB::commit();

            return redirect()->back()->with('success', 'Kart deaktiv edildi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Xəta: ' . $e->getMessage());
        }
    }

    public function activate(Request $request, GiftCard $card)
    {
        Gate::authorize('manage-gift-cards');

        DB::beginTransaction();
        try {
            // Set expiry date if not already set (12 months from now)
            $updateData = ['status' => GiftCard::STATUS_ACTIVE];
            if (!$card->expiry_date && !$card->activated_at) {
                $updateData['expiry_date'] = now()->addYear();
                $updateData['activated_at'] = now();
            }

            $card->update($updateData);

            GiftCardTransaction::createTransaction(
                $card,
                GiftCardTransaction::TYPE_ACTIVATE,
                0,
                auth()->id(),
                null,
                'Kart super admin tərəfindən aktiv edildi'
            );

            DB::commit();

            return redirect()->back()->with('success', 'Kart aktiv edildi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Xəta: ' . $e->getMessage());
        }
    }

    public function bulkDelete(Request $request)
    {
        Gate::authorize('manage-gift-cards');

        $request->validate([
            'card_ids' => 'required|array|min:1',
            'card_ids.*' => 'required|integer|exists:gift_cards,id',
        ]);

        DB::beginTransaction();
        try {
            // Super admin can delete any card
            $deletedCount = GiftCard::whereIn('id', $request->card_ids)->delete();

            DB::commit();

            return redirect()->back()->with('success', "{$deletedCount} kart silindi.");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Xəta: ' . $e->getMessage());
        }
    }

    public function destroy(GiftCard $card)
    {
        Gate::authorize('manage-gift-cards');

        DB::beginTransaction();
        try {
            $cardNumber = $card->card_number;
            $card->delete();

            DB::commit();

            return redirect()->back()->with('success', "Kart {$cardNumber} silindi.");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Xəta: ' . $e->getMessage());
        }
    }

    public function show(Request $request, GiftCard $card)
    {
        Gate::authorize('manage-gift-cards');

        $card->load(['account', 'customer']);

        $transactions = $card->transactions()
            ->with(['user:id,name', 'sale:sale_id,sale_number'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/GiftCards/Show', [
            'card' => $card,
            'transactions' => $transactions,
        ]);
    }

    public function reports(Request $request)
    {
        Gate::authorize('manage-gift-cards');

        // Account stats
        $accountStats = GiftCard::query()
            ->select(
                'account_id',
                DB::raw('count(*) as total_cards'),
                DB::raw('sum(case when status = "active" then 1 else 0 end) as active_cards'),
                DB::raw('sum(case when status = "depleted" then 1 else 0 end) as depleted_cards'),
                DB::raw('sum(case when status = "expired" then 1 else 0 end) as expired_cards'),
                DB::raw('sum(initial_balance) as total_issued'),
                DB::raw('sum(initial_balance - current_balance) as total_redeemed'),
                DB::raw('sum(current_balance) as current_balance')
            )
            ->whereNotNull('account_id')
            ->groupBy('account_id')
            ->get()
            ->map(function ($stat) {
                $account = \App\Models\Account::find($stat->account_id);
                return [
                    'account_id' => $stat->account_id,
                    'account_name' => $account ? $account->company_name : 'Unknown',
                    'total_cards' => $stat->total_cards,
                    'active_cards' => $stat->active_cards,
                    'depleted_cards' => $stat->depleted_cards,
                    'expired_cards' => $stat->expired_cards,
                    'total_issued' => (float) $stat->total_issued,
                    'total_redeemed' => (float) $stat->total_redeemed,
                    'current_balance' => (float) $stat->current_balance,
                ];
            });

        // Status summary
        $statusSummary = [
            'free' => GiftCard::where('status', GiftCard::STATUS_FREE)->count(),
            'configured' => GiftCard::where('status', GiftCard::STATUS_CONFIGURED)->count(),
            'active' => GiftCard::where('status', GiftCard::STATUS_ACTIVE)->count(),
            'depleted' => GiftCard::where('status', GiftCard::STATUS_DEPLETED)->count(),
            'expired' => GiftCard::where('status', GiftCard::STATUS_EXPIRED)->count(),
            'inactive' => GiftCard::where('status', GiftCard::STATUS_INACTIVE)->count(),
        ];

        // Redemption stats
        $redemptionStats = [
            'total_redemptions' => \App\Models\GiftCardTransaction::where('transaction_type', 'redeem')->count(),
            'total_amount_redeemed' => (float) \App\Models\GiftCardTransaction::where('transaction_type', 'redeem')->sum('amount'),
            'average_redemption' => (float) \App\Models\GiftCardTransaction::where('transaction_type', 'redeem')->avg('amount'),
            'redemptions_today' => \App\Models\GiftCardTransaction::where('transaction_type', 'redeem')
                ->whereDate('created_at', today())->count(),
            'redemptions_this_week' => \App\Models\GiftCardTransaction::where('transaction_type', 'redeem')
                ->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            'redemptions_this_month' => \App\Models\GiftCardTransaction::where('transaction_type', 'redeem')
                ->whereMonth('created_at', now()->month)->count(),
        ];

        // Totals
        $totalBalance = (float) GiftCard::sum('current_balance');
        $totalIssued = (float) GiftCard::sum('initial_balance');

        return Inertia::render('Admin/GiftCards/Reports', [
            'accountStats' => $accountStats,
            'statusSummary' => $statusSummary,
            'redemptionStats' => $redemptionStats,
            'totalBalance' => $totalBalance,
            'totalIssued' => $totalIssued,
        ]);
    }
}
