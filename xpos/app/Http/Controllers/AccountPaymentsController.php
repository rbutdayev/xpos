<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\AccountPayment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountPaymentsController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');

        // Update overdue payments
        $this->updateOverduePayments();

        $accounts = Account::query()
            ->withCount('users')
            ->with(['payments' => function ($query) {
                $query->latest('due_date')->limit(3);
            }])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('company_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($status, function ($query, $status) {
                if ($status === 'overdue') {
                    $query->whereHas('payments', function ($q) {
                        $q->where('status', 'overdue');
                    });
                } elseif ($status === 'paid') {
                    $query->whereHas('payments', function ($q) {
                        $q->where('status', 'paid')->where('due_date', '>=', Carbon::now()->subDays(30));
                    });
                } elseif ($status === 'pending') {
                    $query->whereHas('payments', function ($q) {
                        $q->where('status', 'pending');
                    });
                }
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        // Add payment status to each account
        $accounts->getCollection()->transform(function ($account) {
            $account->payment_status = 'none';
            $account->latest_payment = null;
            $account->next_due_date = null;

            if ($account->monthly_payment_amount && $account->payment_start_date) {
                $startDate = Carbon::parse($account->payment_start_date);
                $today = Carbon::today();

                // Find the latest paid payment to determine where we are in the schedule
                $latestPaidPayment = $account->payments()
                    ->where('status', 'paid')
                    ->latest('due_date')
                    ->first();

                if ($latestPaidPayment) {
                    // Next payment is 1 month after the latest paid payment
                    $nextDueDate = Carbon::parse($latestPaidPayment->due_date)->addMonth();
                } else {
                    // No paid payments - start from the first period
                    $nextDueDate = $startDate->copy()->addMonth();
                }

                $account->next_due_date = $nextDueDate;

                // Determine payment status
                if ($today->lt($startDate)) {
                    // Payment hasn't started yet
                    $account->payment_status = 'pending';
                } elseif ($today->gte($nextDueDate)) {
                    // Payment is overdue
                    $account->payment_status = 'overdue';
                } else {
                    // Payment is pending (not yet due)
                    $account->payment_status = 'pending';
                }

                // Check if there's an existing payment record for this period
                $existingPayment = $account->payments()
                    ->where('due_date', $nextDueDate)
                    ->first();

                if ($existingPayment) {
                    $account->latest_payment = $existingPayment;
                    $account->payment_status = $existingPayment->status;
                }
            }

            return $account;
        });

        return Inertia::render('SuperAdmin/Payments', [
            'accounts' => $accounts,
            'search' => $search,
            'status' => $status,
        ]);
    }

    public function markAsPaid(Request $request, Account $account)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        $startDate = Carbon::parse($account->payment_start_date);
        $today = Carbon::today();

        // Find the next unpaid period
        $latestPaidPayment = AccountPayment::where('account_id', $account->id)
            ->where('status', 'paid')
            ->latest('due_date')
            ->first();

        if ($latestPaidPayment) {
            // Next payment is after the latest paid one
            $nextDueDate = Carbon::parse($latestPaidPayment->due_date)->addMonth();
        } else {
            // No paid payments yet - use first period
            $nextDueDate = $startDate->copy()->addMonth();
        }

        // Check if payment already exists for this period
        $payment = AccountPayment::where('account_id', $account->id)
            ->where('due_date', $nextDueDate)
            ->first();

        if (!$payment) {
            // Create new payment record
            $payment = AccountPayment::create([
                'account_id' => $account->id,
                'amount' => $account->monthly_payment_amount,
                'due_date' => $nextDueDate,
                'status' => 'paid',
                'paid_date' => Carbon::today(),
                'notes' => $validated['notes'] ?? null,
                'processed_by' => auth()->id(),
            ]);
        } else {
            // Mark existing payment as paid
            $payment->markAsPaid($validated['notes'] ?? null);
        }

        return redirect()->back()->with('success', 'Ödəniş ödənilmiş kimi qeyd edildi');
    }

    public function markAsUnpaid(Request $request, Account $account)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        $startDate = Carbon::parse($account->payment_start_date);

        // Find the latest paid payment to mark as unpaid
        $latestPaidPayment = AccountPayment::where('account_id', $account->id)
            ->where('status', 'paid')
            ->latest('due_date')
            ->first();

        if ($latestPaidPayment) {
            $latestPaidPayment->markAsUnpaid($validated['notes'] ?? null);
            return redirect()->back()->with('success', 'Ödəniş ödənilməmiş kimi qeyd edildi');
        }

        return redirect()->back()->with('error', 'Ödəniş qeydi tapılmadı');
    }

    public function toggleAccountStatus(Account $account)
    {
        $account->update([
            'is_active' => !$account->is_active,
        ]);

        $status = $account->is_active ? 'aktivləşdirildi' : 'dayandırıldı';
        return redirect()->back()->with('success', "Hesab {$status}");
    }

    public function updatePaymentSettings(Request $request, Account $account)
    {
        $validated = $request->validate([
            'monthly_payment_amount' => 'required|numeric|min:0',
            'payment_start_date' => 'required|date',
        ]);

        $account->update([
            'monthly_payment_amount' => $validated['monthly_payment_amount'],
            'payment_start_date' => $validated['payment_start_date'],
        ]);

        return redirect()->back()->with('success', 'Ödəniş təyinatları yeniləndi');
    }

    public function destroy(Account $account)
    {
        try {
            $account->delete();
            return redirect()->route('superadmin.payments')->with('success', 'Hesab uğurla silindi');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Hesabı silməkdə xəta baş verdi');
        }
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:accounts,id'
        ]);

        try {
            \DB::beginTransaction();

            $deletedCount = Account::whereIn('id', $validated['ids'])->delete();

            \DB::commit();

            return redirect()->back()->with('success', "{$deletedCount} hesab uğurla silindi");
        } catch (\Exception $e) {
            \DB::rollBack();
            return redirect()->back()->with('error', 'Hesabları silməkdə xəta baş verdi: ' . $e->getMessage());
        }
    }

    private function updateOverduePayments()
    {
        AccountPayment::where('status', 'pending')
            ->where('due_date', '<', Carbon::today())
            ->update(['status' => 'overdue']);
    }
}
