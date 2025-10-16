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

        $query = Customer::where('account_id', Auth::user()->account_id);

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

        $customers = $query->latest()
            ->paginate(15)
            ->withQueryString();
            
        // Add credit information to each customer
        $customers->getCollection()->transform(function ($customer) {
            $customer->has_pending_credits = $customer->hasPendingCredits();
            return $customer;
        });

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'filters' => $request->only(['search', 'type', 'status']),
        ]);
    }

    public function search(Request $request)
    {
        Gate::authorize('access-account-data');

        $search = $request->get('q', '');
        
        $customers = Customer::where('account_id', Auth::user()->account_id)
            ->search($search)
            ->active()
            ->limit(10)
            ->get(['id', 'name', 'phone', 'customer_type']);

        return response()->json($customers);
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

        return Inertia::render('Customers/Show', [
            'customer' => $customer,
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
