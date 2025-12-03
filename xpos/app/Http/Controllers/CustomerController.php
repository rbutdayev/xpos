<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\LoyaltyCard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
        $this->middleware('branch.access');
    }

    public function index(Request $request)
    {
        Gate::authorize('access-account-data');

        $query = Customer::where('account_id', Auth::user()->account_id)
            ->withCount(['tailorServices', 'customerItems']);

        // Search
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        // Filter by customer type
        if ($request->filled('type')) {
            $query->byType($request->type);
        }

        // Filter by status
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->active();
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        // Filter by credit status
        if ($request->filled('credit_status')) {
            if ($request->credit_status === 'with_debt') {
                $query->where(function ($q) {
                    // Check for pending credits in customer_credits table
                    $q->whereHas('credits', function ($creditQuery) {
                        $creditQuery->where('type', 'credit')
                            ->whereIn('status', ['pending', 'partial'])
                            ->where('remaining_amount', '>', 0);
                    })
                    // OR check for unpaid tailor services
                    ->orWhereHas('tailorServices', function ($serviceQuery) {
                        $serviceQuery->whereIn('payment_status', ['unpaid', 'partial', 'credit'])
                            ->where('credit_amount', '>', 0);
                    });
                });
            } elseif ($request->credit_status === 'no_debt') {
                $query->whereDoesntHave('credits', function ($creditQuery) {
                    $creditQuery->where('type', 'credit')
                        ->whereIn('status', ['pending', 'partial'])
                        ->where('remaining_amount', '>', 0);
                })
                ->whereDoesntHave('tailorServices', function ($serviceQuery) {
                    $serviceQuery->whereIn('payment_status', ['unpaid', 'partial', 'credit'])
                        ->where('credit_amount', '>', 0);
                });
            }
        }

        // Filter by service history
        if ($request->filled('has_services')) {
            if ($request->has_services === 'yes') {
                $query->has('tailorServices');
            } elseif ($request->has_services === 'no') {
                $query->doesntHave('tailorServices');
            }
        }

        // Filter by birthday month
        if ($request->filled('birthday_month')) {
            $query->whereMonth('birthday', $request->birthday_month);
        }

        // Get per_page from request, default to 25, max 100
        $perPage = $request->input('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100]) ? $perPage : 25;

        $customers = $query->latest()
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'filters' => $request->only(['search', 'type', 'status', 'credit_status', 'has_services', 'birthday_month']),
        ]);
    }

    public function search(Request $request)
    {
        Gate::authorize('access-account-data');

        $search = $request->get('q', '');

        $customers = Customer::where('account_id', Auth::user()->account_id)
            ->search($search)
            ->active()
            ->limit(20)
            ->get(['id', 'name', 'phone', 'customer_type']);

        // Add formatted fields
        $customers->each(function($customer) {
            $customer->formatted_phone = $customer->formatted_phone;
            $customer->customer_type_text = $customer->customer_type_text;
        });

        return response()->json($customers);
    }

    public function getById(Request $request, $id)
    {
        Gate::authorize('access-account-data');

        $customer = Customer::where('account_id', Auth::user()->account_id)
            ->where('id', $id)
            ->first(['id', 'name', 'phone', 'customer_type', 'loyalty_points', 'loyalty_card_number']);

        if (!$customer) {
            return response()->json(['error' => 'Customer not found'], 404);
        }

        // Add formatted fields
        $customer->formatted_phone = $customer->formatted_phone;
        $customer->customer_type_text = $customer->customer_type_text;

        return response()->json($customer);
    }

    public function quickStore(Request $request)
    {
        Gate::authorize('create-account-data');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'birthday' => 'nullable|date',
            'customer_type' => 'in:individual,corporate',
        ]);

        $validated['account_id'] = Auth::user()->account_id;
        $validated['customer_type'] = $validated['customer_type'] ?? 'individual';

        try {
            $customer = Customer::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Müştəri uğurla yaradıldı.',
                'customer' => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'email' => $customer->email,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Müştəri yaradılarkən xəta baş verdi: ' . $e->getMessage(),
            ], 400);
        }
    }

    public function create()
    {
        Gate::authorize('create-account-data');

        return Inertia::render('Customers/Create');
    }

    public function store(Request $request)
    {
        Gate::authorize('create-account-data');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:1000',
            'birthday' => 'nullable|date',
            'customer_type' => 'required|in:individual,corporate',
            'tax_number' => 'nullable|string|max:50|unique:customers,tax_number,NULL,id,account_id,' . Auth::user()->account_id,
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
            'card_number' => 'nullable|string|size:14',
        ]);

        DB::beginTransaction();
        try {
            $loyaltyCard = null;
            $accountId = Auth::user()->account_id;

            if ($request->filled('card_number')) {
                $cardNumber = strtoupper(trim($request->card_number));

                $loyaltyCard = LoyaltyCard::where('card_number', $cardNumber)->first();

                if (!$loyaltyCard) {
                    return back()->withErrors(['card_number' => 'Loaylıq kartı tapılmadı.'])->withInput();
                }

                // Check if card belongs to this account
                if ($loyaltyCard->account_id !== $accountId) {
                    return back()->withErrors(['card_number' => 'Bu kart sizin hesabınıza aid deyil.'])->withInput();
                }

                if (!$loyaltyCard->isFree()) {
                    return back()->withErrors(['card_number' => 'Bu kart artıq təyin olunub və ya qeyri-aktivdir.'])->withInput();
                }
            }

            $validated['account_id'] = $accountId;
            $customer = Customer::create($validated);

            if ($loyaltyCard) {
                $loyaltyCard->markAsUsed($customer->id, $accountId);
                $customer->update(['loyalty_card_id' => $loyaltyCard->id]);
            }

            DB::commit();

            return redirect()->route('customers.show', $customer)
                ->with('success', 'Müştəri uğurla yaradıldı.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Müştəri yaradılarkən xəta baş verdi: ' . $e->getMessage()])->withInput();
        }
    }

    public function show(Customer $customer)
    {
        Gate::authorize('access-account-data');

        // Verify customer belongs to current account
        if ($customer->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        // Load loyalty card relationship
        $customer->load('loyaltyCard');

        // Load customer items
        $customerItems = $customer->customerItems()
            ->where('is_active', true)
            ->latest()
            ->get();

        // Load relationships - get all services regardless of type
        $serviceHistory = $customer->tailorServices()
            ->with(['employee:id,name', 'customerItem:id,description'])
            ->latest('received_date')
            ->limit(10)
            ->get()
            ->map(function ($service) {
                // Map employee to user for frontend compatibility
                $service->user = $service->employee;
                return $service;
            });

        // Calculate service counts by type
        $serviceCounts = [
            'tailor' => $customer->tailorServices()->where('service_type', 'tailor')->count(),
            'phone_repair' => $customer->tailorServices()->where('service_type', 'phone_repair')->count(),
            'electronics' => $customer->tailorServices()->where('service_type', 'electronics')->count(),
            'general' => $customer->tailorServices()->where('service_type', 'general')->count(),
        ];

        return Inertia::render('Customers/Show', [
            'customer' => $customer,
            'customerItems' => $customerItems,
            'vehicles' => [], // Vehicles feature not implemented yet
            'serviceHistory' => $serviceHistory,
            'serviceCounts' => $serviceCounts,
        ]);
    }

    public function edit(Customer $customer)
    {
        Gate::authorize('edit-account-data');

        // Verify customer belongs to current account
        if ($customer->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        // Load loyalty card relationship
        $customer->load('loyaltyCard');

        return Inertia::render('Customers/Edit', [
            'customer' => $customer,
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        Gate::authorize('edit-account-data');

        // Verify customer belongs to current account
        if ($customer->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:1000',
            'birthday' => 'nullable|date',
            'customer_type' => 'required|in:individual,corporate',
            'tax_number' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('customers', 'tax_number')
                    ->where('account_id', Auth::user()->account_id)
                    ->ignore($customer->id)
            ],
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
            'card_number' => 'nullable|string|size:14',
        ]);

        DB::beginTransaction();
        try {
            $newLoyaltyCard = null;
            $oldLoyaltyCardId = $customer->loyalty_card_id;
            $accountId = Auth::user()->account_id;

            if ($request->filled('card_number')) {
                $cardNumber = strtoupper(trim($request->card_number));

                $newLoyaltyCard = LoyaltyCard::where('card_number', $cardNumber)->first();

                if (!$newLoyaltyCard) {
                    return back()->withErrors(['card_number' => 'Loaylıq kartı tapılmadı.'])->withInput();
                }

                // Check if card belongs to this account
                if ($newLoyaltyCard->account_id !== $accountId) {
                    return back()->withErrors(['card_number' => 'Bu kart sizin hesabınıza aid deyil.'])->withInput();
                }

                if (!$newLoyaltyCard->isFree() && $newLoyaltyCard->id !== $oldLoyaltyCardId) {
                    return back()->withErrors(['card_number' => 'Bu kart artıq təyin olunub və ya qeyri-aktivdir.'])->withInput();
                }
            }

            if ($oldLoyaltyCardId && (!$request->filled('card_number') || ($newLoyaltyCard && $newLoyaltyCard->id !== $oldLoyaltyCardId))) {
                $oldCard = LoyaltyCard::find($oldLoyaltyCardId);
                if ($oldCard) {
                    $oldCard->markAsFree();
                }
                $customer->update(['loyalty_card_id' => null]);
            }

            if ($newLoyaltyCard && $newLoyaltyCard->id !== $oldLoyaltyCardId) {
                $newLoyaltyCard->markAsUsed($customer->id, $accountId);
                $validated['loyalty_card_id'] = $newLoyaltyCard->id;
            }

            $customer->update($validated);

            DB::commit();

            return redirect()->route('customers.show', $customer)
                ->with('success', 'Müştəri məlumatları yeniləndi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Müştəri yenilənərkən xəta baş verdi: ' . $e->getMessage()])->withInput();
        }
    }

    public function destroy(Customer $customer)
    {
        Gate::authorize('delete-account-data');

        // Verify customer belongs to current account
        if ($customer->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        DB::beginTransaction();
        try {
            if ($customer->loyalty_card_id) {
                $card = LoyaltyCard::find($customer->loyalty_card_id);
                if ($card) {
                    $card->markAsFree();
                }
            }

            $customer->delete();

            DB::commit();

            return redirect()->route('customers.index')
                ->with('success', 'Müştəri silindi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Müştəri silinərkən xəta baş verdi: ' . $e->getMessage()]);
        }
    }

    public function validateLoyaltyCard(Request $request)
    {
        Gate::authorize('assign-loyalty-cards');

        $request->validate([
            'card_number' => 'required|string|size:14',
        ]);

        $cardNumber = strtoupper(trim($request->card_number));
        $accountId = auth()->user()->account_id;

        $card = LoyaltyCard::where('card_number', $cardNumber)->first();

        if (!$card) {
            return response()->json([
                'valid' => false,
                'message' => 'Kart sistemdə tapılmadı.',
            ], 404);
        }

        // Check if card belongs to this account
        if ($card->account_id !== $accountId) {
            return response()->json([
                'valid' => false,
                'message' => 'Bu kart sizin hesabınıza aid deyil.',
            ], 403);
        }

        if ($card->isInactive()) {
            return response()->json([
                'valid' => false,
                'message' => 'Bu kart qeyri-aktivdir.',
            ], 400);
        }

        if ($card->isUsed()) {
            $customer = $card->customer;
            return response()->json([
                'valid' => false,
                'message' => 'Bu kart artıq təyin olunub: ' . ($customer ? $customer->name : 'başqa müştəri'),
                'assigned_to' => $customer ? [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                ] : null,
            ], 400);
        }

        return response()->json([
            'valid' => true,
            'message' => 'Kart əlçatandır və istifadəyə hazırdır.',
            'card' => [
                'id' => $card->id,
                'card_number' => $card->card_number,
            ],
        ]);
    }
}
