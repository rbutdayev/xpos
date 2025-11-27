<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
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
        ]);

        $validated['account_id'] = Auth::user()->account_id;

        $customer = Customer::create($validated);

        return redirect()->route('customers.show', $customer)
            ->with('success', 'Müştəri uğurla yaradıldı.');
    }

    public function show(Customer $customer)
    {
        Gate::authorize('access-account-data');

        // Verify customer belongs to current account
        if ($customer->account_id !== Auth::user()->account_id) {
            abort(403);
        }

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
        ]);

        $customer->update($validated);

        return redirect()->route('customers.show', $customer)
            ->with('success', 'Müştəri məlumatları yeniləndi.');
    }

    public function destroy(Customer $customer)
    {
        Gate::authorize('delete-account-data');

        // Verify customer belongs to current account
        if ($customer->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $customer->delete();

        return redirect()->route('customers.index')
            ->with('success', 'Müştəri silindi.');
    }
}
