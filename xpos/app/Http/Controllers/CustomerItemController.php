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
            ->with(['customer' => function($q) use ($accountId) {
                $q->where('account_id', $accountId);
            }]);

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

        $items = $query->latest()->paginate(15);

        return Inertia::render('CustomerItems/Index', [
            'items' => $items,
            'filters' => $request->only(['search', 'type', 'customer_id']),
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
            'item_description' => 'nullable|string|max:500',
            'fabric' => 'nullable|string|max:100',
            'size' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'purchase_date' => 'nullable|date',
            'special_instructions' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:1000',
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
                'item_description' => $item->item_description,
                'fabric' => $item->fabric,
                'size' => $item->size,
                'color' => $item->color,
                'purchase_date' => $item->purchase_date,
                'special_instructions' => $item->special_instructions,
                'notes' => $item->notes,
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
            'item_description' => 'nullable|string|max:500',
            'fabric' => 'nullable|string|max:100',
            'size' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'purchase_date' => 'nullable|date',
            'special_instructions' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:1000',
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
}
