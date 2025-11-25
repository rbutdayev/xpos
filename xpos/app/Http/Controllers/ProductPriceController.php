<?php

namespace App\Http\Controllers;

use App\Models\ProductPrice;
use App\Models\Product;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class ProductPriceController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    /**
     * Store a new discount for a product
     */
    public function store(Request $request, Product $product)
    {
        Gate::authorize('create-account-data');

        // Verify product belongs to current account
        if ($product->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $validated = $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'effective_from' => 'required|date',
            'effective_until' => 'nullable|date|after:effective_from',
            'min_sale_price' => 'nullable|numeric|min:0',
        ]);

        // If branch_id provided, verify it belongs to account
        if (!empty($validated['branch_id'])) {
            $branch = Branch::where('id', $validated['branch_id'])
                ->where('account_id', Auth::user()->account_id)
                ->firstOrFail();
        }

        $productPrice = ProductPrice::create([
            'product_id' => $product->id,
            'branch_id' => $validated['branch_id'] ?? null,
            'purchase_price' => $product->purchase_price ?? 0,
            'sale_price' => $product->sale_price,
            'discount_percentage' => $validated['discount_percentage'],
            'min_sale_price' => $validated['min_sale_price'] ?? null,
            'effective_from' => $validated['effective_from'],
            'effective_until' => $validated['effective_until'] ?? null,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', 'Endirim uğurla əlavə edildi.');
    }

    /**
     * Update an existing discount
     */
    public function update(Request $request, ProductPrice $productPrice)
    {
        Gate::authorize('edit-account-data');

        // Verify product price belongs to product that belongs to current account
        if ($productPrice->product->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $validated = $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'effective_from' => 'required|date',
            'effective_until' => 'nullable|date|after:effective_from',
            'min_sale_price' => 'nullable|numeric|min:0',
        ]);

        // If branch_id provided, verify it belongs to account
        if (!empty($validated['branch_id'])) {
            $branch = Branch::where('id', $validated['branch_id'])
                ->where('account_id', Auth::user()->account_id)
                ->firstOrFail();
        }

        $productPrice->update([
            'branch_id' => $validated['branch_id'] ?? null,
            'discount_percentage' => $validated['discount_percentage'],
            'min_sale_price' => $validated['min_sale_price'] ?? null,
            'effective_from' => $validated['effective_from'],
            'effective_until' => $validated['effective_until'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Endirim yeniləndi.');
    }

    /**
     * Toggle active status of a discount
     */
    public function toggleActive(ProductPrice $productPrice)
    {
        Gate::authorize('edit-account-data');

        // Verify product price belongs to product that belongs to current account
        if ($productPrice->product->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $productPrice->update([
            'is_active' => !$productPrice->is_active,
        ]);

        $status = $productPrice->is_active ? 'aktivləşdirildi' : 'dayandırıldı';

        return redirect()->back()->with('success', "Endirim {$status}.");
    }

    /**
     * Delete a discount
     */
    public function destroy(ProductPrice $productPrice)
    {
        Gate::authorize('delete-account-data');

        // Verify product price belongs to product that belongs to current account
        if ($productPrice->product->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $productPrice->delete();

        return redirect()->back()->with('success', 'Endirim silindi.');
    }
}
