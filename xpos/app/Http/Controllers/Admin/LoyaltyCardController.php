<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyCard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LoyaltyCardController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('manage-loyalty-cards');

        $query = LoyaltyCard::query()->with(['account', 'customer']);

        if ($request->filled('search')) {
            $query->where('card_number', 'like', '%' . strtoupper($request->search) . '%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('account_id')) {
            $query->where('account_id', $request->account_id);
        }

        $cards = $query->orderBy('created_at', 'desc')
            ->paginate(50)
            ->withQueryString();

        $stats = [
            'total' => LoyaltyCard::count(),
            'free' => LoyaltyCard::free()->count(),
            'used' => LoyaltyCard::used()->count(),
            'inactive' => LoyaltyCard::inactive()->count(),
        ];

        // Get all accounts for dropdown
        $accounts = \App\Models\Account::select('id', 'company_name')
            ->orderBy('company_name')
            ->get();

        return Inertia::render('Admin/LoyaltyCards/Index', [
            'cards' => $cards,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'account_id']),
            'accounts' => $accounts,
        ]);
    }

    public function generate(Request $request)
    {
        Gate::authorize('manage-loyalty-cards');

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
                $cardNumber = LoyaltyCard::generateUniqueCardNumber();
                $cards[] = [
                    'card_number' => $cardNumber,
                    'status' => LoyaltyCard::STATUS_FREE,
                    'account_id' => $accountId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            LoyaltyCard::insert($cards);
            DB::commit();

            return redirect()->back()->with('success', "{$quantity} loaylıq kartı uğurla yaradıldı.");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Kartlar yaradılarkən xəta baş verdi: ' . $e->getMessage());
        }
    }

    public function deactivate(Request $request, LoyaltyCard $card)
    {
        Gate::authorize('manage-loyalty-cards');

        $card->markAsInactive();

        return redirect()->back()->with('success', 'Card has been deactivated.');
    }

    public function activate(Request $request, LoyaltyCard $card)
    {
        Gate::authorize('manage-loyalty-cards');

        $card->update(['status' => LoyaltyCard::STATUS_FREE]);

        return redirect()->back()->with('success', 'Card has been activated.');
    }

    public function unassign(Request $request, LoyaltyCard $card)
    {
        Gate::authorize('manage-loyalty-cards');

        if (!$card->isUsed()) {
            return redirect()->back()->with('error', 'Card is not assigned to any customer.');
        }

        $customerId = $card->customer_id;

        DB::beginTransaction();
        try {
            if ($customerId) {
                DB::table('customers')->where('id', $customerId)->update(['loyalty_card_id' => null]);
            }

            $card->markAsFree();

            DB::commit();

            return redirect()->back()->with('success', 'Card has been unassigned and is now available.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to unassign card: ' . $e->getMessage());
        }
    }

    public function bulkDelete(Request $request)
    {
        Gate::authorize('manage-loyalty-cards');

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:loyalty_cards,id',
        ]);

        DB::beginTransaction();
        try {
            // Note: This is a super admin function, so we don't filter by account_id
            // But we still ensure proper cleanup of related data
            $deletedCount = 0;

            foreach ($request->ids as $id) {
                $card = LoyaltyCard::find($id);

                if ($card) {
                    // If card is assigned, unassign it first
                    if ($card->customer_id) {
                        DB::table('customers')
                            ->where('id', $card->customer_id)
                            ->update(['loyalty_card_id' => null]);
                    }

                    $card->delete();
                    $deletedCount++;
                }
            }

            DB::commit();

            return redirect()->back()->with('success', "{$deletedCount} loaylıq kartı uğurla silindi.");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Kartlar silinərkən xəta baş verdi: ' . $e->getMessage());
        }
    }

    public function reports(Request $request)
    {
        Gate::authorize('manage-loyalty-cards');

        $cardsByAccount = LoyaltyCard::used()
            ->select('account_id', DB::raw('count(*) as total'))
            ->groupBy('account_id')
            ->with('account:id,company_name')
            ->orderBy('total', 'desc')
            ->limit(20)
            ->get();

        $recentAssignments = LoyaltyCard::used()
            ->with(['account:id,company_name', 'customer:id,name,phone'])
            ->orderBy('assigned_at', 'desc')
            ->limit(50)
            ->get();

        return Inertia::render('Admin/LoyaltyCards/Reports', [
            'cardsByAccount' => $cardsByAccount,
            'recentAssignments' => $recentAssignments,
        ]);
    }
}
