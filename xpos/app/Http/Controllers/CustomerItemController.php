<?php

namespace App\Http\Controllers;

use App\Models\CustomerItem;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CustomerItemController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    /**
     * Get account ID from authenticated user
     */
    protected function getAccountId(): int
    {
        return Auth::user()->account_id;
    }

    public function index(Request $request)
    {
        Gate::authorize('access-account-data');

        $accountId = $this->getAccountId();

        $query = CustomerItem::query()
            ->forAccount($accountId) // ⚠️ CRITICAL: Scope by account via customer
            ->with([
                'customer' => function($q) use ($accountId) {
                    $q->where('account_id', $accountId);
                },
                'tailorServices' => function($q) use ($accountId) {
                    $q->where('account_id', $accountId);
                }
            ]);

        // Search functionality
        if ($search = $request->input('search')) {
            $query->search($search);
        }

        // Filter by item type
        if ($type = $request->input('type')) {
            $query->byType($type);
        }

        // Filter by customer
        if ($customerId = $request->input('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        // Filter by status
        if ($status = $request->input('status')) {
            $query->byStatus($status);
        }

        $items = $query->latest()->paginate(15);

        // Get customers for filter dropdown
        $customers = Customer::where('account_id', $accountId)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('CustomerItems/Index', [
            'items' => $items,
            'customers' => $customers,
            'filters' => $request->only(['search', 'type', 'customer_id', 'status']),
        ]);
    }

    public function create()
    {
        Gate::authorize('create-account-data');

        $accountId = $this->getAccountId();

        // Get customers for dropdown
        $customers = Customer::where('account_id', $accountId)
            ->select('id', 'name', 'phone')
            ->orderBy('name')
            ->get();

        return Inertia::render('CustomerItems/Create', [
            'customers' => $customers,
            'itemTypes' => [
                'Jacket' => 'Gödəkçə',
                'Dress' => 'Paltar',
                'Suit' => 'Kostyum',
                'Pants' => 'Şalvar',
                'Shirt' => 'Köynək',
                'Coat' => 'Palto',
                'Other' => 'Digər',
            ],
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('create-account-data');

        $accountId = $this->getAccountId();

        // Validate customer belongs to account
        $customer = Customer::where('account_id', $accountId)
            ->where('id', $request->customer_id)
            ->firstOrFail();

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'item_type' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'fabric_type' => 'nullable|string|max:100',
            'size' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'measurements' => 'nullable|array',
            'reference_number' => 'nullable|string|max:100',
            'received_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean',
        ]);

        $item = CustomerItem::create($validated);

        return redirect()
            ->route('customer-items.show', $item->id)
            ->with('success', 'Customer item created successfully');
    }

    public function show(int $id)
    {
        Gate::authorize('access-account-data');

        $accountId = $this->getAccountId();

        $item = CustomerItem::forAccount($accountId)
            ->with([
                'customer' => function($q) use ($accountId) {
                    $q->where('account_id', $accountId);
                },
                'tailorServices' => function($q) use ($accountId) {
                    $q->where('account_id', $accountId)
                      ->with('employee')
                      ->latest()
                      ->take(10);
                }
            ])
            ->findOrFail($id);

        return Inertia::render('CustomerItems/Show', [
            'item' => [
                'id' => $item->id,
                'customer' => $item->customer,
                'item_type' => $item->item_type,
                'description' => $item->description,
                'fabric_type' => $item->fabric_type,
                'size' => $item->size,
                'color' => $item->color,
                'measurements' => $item->measurements,
                'reference_number' => $item->reference_number,
                'received_date' => $item->received_date,
                'status' => $item->status,
                'status_text' => $item->status_text,
                'status_color' => $item->status_color,
                'notes' => $item->notes,
                'is_active' => $item->is_active,
                'full_description' => $item->full_description,
                'display_name' => $item->display_name,
                'created_at' => $item->created_at,
            ],
            'tailorServices' => $item->tailorServices,
        ]);
    }

    public function edit(int $id)
    {
        Gate::authorize('edit-account-data');

        $accountId = $this->getAccountId();

        $item = CustomerItem::forAccount($accountId)
            ->with('customer')
            ->findOrFail($id);

        $customers = Customer::where('account_id', $accountId)
            ->select('id', 'name', 'phone')
            ->orderBy('name')
            ->get();

        return Inertia::render('CustomerItems/Edit', [
            'item' => $item,
            'customers' => $customers,
            'itemTypes' => [
                'Jacket' => 'Gödəkçə',
                'Dress' => 'Paltar',
                'Suit' => 'Kostyum',
                'Pants' => 'Şalvar',
                'Shirt' => 'Köynək',
                'Coat' => 'Palto',
                'Other' => 'Digər',
            ],
        ]);
    }

    public function update(Request $request, int $id)
    {
        Gate::authorize('edit-account-data');

        $accountId = $this->getAccountId();

        $item = CustomerItem::forAccount($accountId)
            ->findOrFail($id);

        // Validate customer belongs to account (if changing customer)
        if ($request->has('customer_id')) {
            Customer::where('account_id', $accountId)
                ->where('id', $request->customer_id)
                ->firstOrFail();
        }

        $validated = $request->validate([
            'customer_id' => 'sometimes|required|exists:customers,id',
            'item_type' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:500',
            'fabric_type' => 'nullable|string|max:100',
            'size' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'measurements' => 'nullable|array',
            'reference_number' => 'nullable|string|max:100',
            'received_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean',
        ]);

        $item->update($validated);

        return redirect()
            ->route('customer-items.show', $item->id)
            ->with('success', 'Customer item updated successfully');
    }

    public function destroy(int $id)
    {
        Gate::authorize('delete-account-data');

        $accountId = $this->getAccountId();

        $item = CustomerItem::forAccount($accountId)
            ->findOrFail($id);

        // Check if item has tailor services
        $servicesCount = $item->tailorServices()->count();
        if ($servicesCount > 0) {
            return redirect()
                ->back()
                ->with('error', "Cannot delete item with {$servicesCount} associated tailor service(s)");
        }

        $item->delete(); // Soft delete

        return redirect()
            ->route('customer-items.index')
            ->with('success', 'Customer item deleted successfully');
    }

    public function search(Request $request)
    {
        Gate::authorize('access-account-data');

        $accountId = $this->getAccountId();
        $search = $request->get('q', '');

        $customerItems = CustomerItem::forAccount($accountId)
            ->when($search, function($query) use ($search) {
                $query->search($search);
            })
            ->with('customer')
            ->limit(20)
            ->get();

        return response()->json($customerItems);
    }

    /**
     * Update the status of a customer item
     * This allows marking items as delivered when customer picks them up
     */
    public function updateStatus(Request $request, int $id)
    {
        Gate::authorize('edit-account-data');

        $accountId = $this->getAccountId();

        $item = CustomerItem::forAccount($accountId)
            ->findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:received,in_service,completed,delivered',
        ]);

        // Don't allow changing to 'in_service' manually - only through tailor service creation
        if ($validated['status'] === 'in_service' && $item->status !== 'in_service') {
            return back()->withErrors(['status' => 'Status "in_service" can only be set through tailor service creation.']);
        }

        $item->update(['status' => $validated['status']]);

        return back()->with('success', 'Item status updated successfully');
    }
}
