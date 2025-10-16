# TASK-006: Update TailorServiceController (Transform from ServiceRecordController)

**Assigned To:** Agent (Developer)
**Phase:** 2.3 - Backend Controllers
**Priority:** HIGH
**Estimated Time:** 4-5 hours
**Due Date:** Day 5-6

---

## 📋 Task Description

Transform the existing `ServiceRecordController` into `TailorServiceController` to manage tailor services (alterations, repairs, custom orders) instead of auto service records. Update all CRUD operations, order number generation, and field names to reflect the tailor business domain.

---

## 🎯 Objectives

1. Rename `ServiceRecordController` to `TailorServiceController`
2. Update all method implementations for tailor services
3. Update field names (service_number → order_number, parts_total → materials_total)
4. Add service_type handling (alteration, repair, custom)
5. Add delivery_date tracking
6. Update order number generation (TS-YYYY-NNNN format)
7. Ensure multi-tenant safety with account_id scoping
8. Update relationships (vehicle → customerItem)

---

## 📥 Input Files

**Files to Transform:**
- `app/Http/Controllers/ServiceRecordController.php` → `TailorServiceController.php`

**Reference Files:**
- `app/Models/TailorService.php` (TASK-003 output)
- `app/Models/CustomerItem.php` (TASK-003 output)
- `app/Models/Customer.php` (existing)
- `tasks/NEXT-STEPS-IMPLEMENTATION.md` (lines 544-572)

**Dependencies:**
- ⚠️ **BLOCKED BY:** TASK-003 (TailorService model must be complete)

---

## 🔧 Implementation Requirements

### Step 1: Rename Controller File

```bash
# Rename the controller file
mv app/Http/Controllers/ServiceRecordController.php app/Http/Controllers/TailorServiceController.php
```

---

### Step 2: Update Class Name and Imports

**File:** `app/Http/Controllers/TailorServiceController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Models\TailorService;
use App\Models\CustomerItem;
use App\Models\Customer;
use App\Models\TailorServiceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TailorServiceController extends Controller
{
    /**
     * Get account ID from authenticated user
     */
    protected function getAccountId(): int
    {
        return auth()->user()->account_id;
    }
}
```

---

### Step 3: Update Index Method

**OLD (Service Records):** Listed by service_number, vehicle info
**NEW (Tailor Services):** List by order_number, customer item info, service_type, delivery_date

```php
/**
 * Display a listing of tailor services
 *
 * @param Request $request
 * @return Response
 */
public function index(Request $request): Response
{
    $accountId = $this->getAccountId();

    $query = TailorService::where('account_id', $accountId)
        ->with([
            'customer' => function($q) use ($accountId) {
                $q->where('account_id', $accountId);
            },
            'customerItem' => function($q) use ($accountId) {
                $q->whereHas('customer', fn($q2) => $q2->where('account_id', $accountId));
            }
        ]);

    // Search functionality
    if ($search = $request->input('search')) {
        $query->where(function($q) use ($search) {
            $q->where('order_number', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%")
              ->orWhereHas('customer', function($q2) use ($search) {
                  $q2->where('name', 'like', "%{$search}%");
              });
        });
    }

    // Filter by service type
    if ($type = $request->input('service_type')) {
        $query->byType($type);
    }

    // Filter by status
    if ($status = $request->input('status')) {
        $query->byStatus($status);
    }

    // Filter overdue services
    if ($request->boolean('overdue')) {
        $query->overdue();
    }

    // Filter upcoming deliveries
    if ($request->boolean('upcoming')) {
        $query->upcoming(7); // Next 7 days
    }

    $services = $query->latest('service_date')->paginate(15);

    return Inertia::render('TailorServices/Index', [
        'services' => $services,
        'filters' => $request->only(['search', 'service_type', 'status', 'overdue', 'upcoming']),
        'serviceTypes' => [
            'alteration' => 'Dəyişiklik',
            'repair' => 'Təmir',
            'custom' => 'Fərdi Tikiş',
        ],
    ]);
}
```

---

### Step 4: Update Create Method

**Add service_type and delivery_date:**

```php
/**
 * Show the form for creating a new tailor service
 *
 * @param Request $request
 * @return Response
 */
public function create(Request $request): Response
{
    $accountId = $this->getAccountId();

    // Get customers for dropdown
    $customers = Customer::where('account_id', $accountId)
        ->select('id', 'name', 'phone')
        ->orderBy('name')
        ->get();

    // Get customer items if customer selected
    $customerItems = [];
    if ($customerId = $request->input('customer_id')) {
        $customerItems = CustomerItem::whereHas('customer', function($q) use ($accountId) {
                $q->where('account_id', $accountId);
            })
            ->where('customer_id', $customerId)
            ->select('id', 'item_type', 'item_description', 'color', 'size')
            ->get();
    }

    return Inertia::render('TailorServices/Create', [
        'customers' => $customers,
        'customerItems' => $customerItems,
        'serviceTypes' => [
            'alteration' => 'Dəyişiklik',
            'repair' => 'Təmir',
            'custom' => 'Fərdi Tikiş',
        ],
        'defaultServiceDate' => now()->format('Y-m-d'),
    ]);
}
```

---

### Step 5: Update Store Method

**NEW fields:** order_number (auto-generated), service_type, customer_item_condition, materials_total, delivery_date

```php
/**
 * Store a newly created tailor service
 *
 * @param Request $request
 * @return \Illuminate\Http\RedirectResponse
 */
public function store(Request $request)
{
    $accountId = $this->getAccountId();

    // Validate customer and customer item belong to account
    $customer = Customer::where('account_id', $accountId)
        ->where('id', $request->customer_id)
        ->firstOrFail();

    if ($request->customer_item_id) {
        CustomerItem::whereHas('customer', function($q) use ($accountId) {
                $q->where('account_id', $accountId);
            })
            ->where('id', $request->customer_item_id)
            ->firstOrFail();
    }

    $validated = $request->validate([
        'customer_id' => 'required|exists:customers,id',
        'customer_item_id' => 'nullable|exists:customer_items,id',
        'service_type' => 'required|in:alteration,repair,custom',
        'customer_item_condition' => 'nullable|string|max:1000',
        'description' => 'required|string|max:1000',
        'labor_total' => 'required|numeric|min:0',
        'materials_total' => 'required|numeric|min:0',
        'discount' => 'nullable|numeric|min:0',
        'tax' => 'nullable|numeric|min:0',
        'service_date' => 'required|date',
        'delivery_date' => 'nullable|date|after_or_equal:service_date',
        'status' => 'required|in:pending,in_progress,completed,cancelled',
        'notes' => 'nullable|string|max:2000',
    ]);

    DB::beginTransaction();
    try {
        // Create tailor service (order_number auto-generated in model)
        $service = TailorService::create([
            'account_id' => $accountId,
            'customer_id' => $validated['customer_id'],
            'customer_item_id' => $validated['customer_item_id'] ?? null,
            'service_type' => $validated['service_type'],
            'customer_item_condition' => $validated['customer_item_condition'] ?? null,
            'description' => $validated['description'],
            'labor_total' => $validated['labor_total'],
            'materials_total' => $validated['materials_total'],
            'discount' => $validated['discount'] ?? 0,
            'tax' => $validated['tax'] ?? 0,
            'service_date' => $validated['service_date'],
            'delivery_date' => $validated['delivery_date'] ?? null,
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? null,
            // total is auto-calculated in model boot method
        ]);

        DB::commit();

        return redirect()
            ->route('tailor-services.show', $service->id)
            ->with('success', "Tailor service {$service->order_number} created successfully");

    } catch (\Exception $e) {
        DB::rollBack();

        return redirect()
            ->back()
            ->withInput()
            ->with('error', 'Failed to create tailor service: ' . $e->getMessage());
    }
}
```

---

### Step 6: Update Show Method

**Include customer item and materials used:**

```php
/**
 * Display the specified tailor service
 *
 * @param int $id
 * @return Response
 */
public function show(int $id): Response
{
    $accountId = $this->getAccountId();

    $service = TailorService::where('account_id', $accountId)
        ->with([
            'customer' => function($q) use ($accountId) {
                $q->where('account_id', $accountId);
            },
            'customerItem' => function($q) use ($accountId) {
                $q->whereHas('customer', fn($q2) => $q2->where('account_id', $accountId));
            },
            'tailorServiceItems.product' => function($q) use ($accountId) {
                $q->where('account_id', $accountId);
            },
            'tailorServiceItems.variant' => function($q) use ($accountId) {
                $q->where('account_id', $accountId);
            }
        ])
        ->findOrFail($id);

    return Inertia::render('TailorServices/Show', [
        'service' => [
            'id' => $service->id,
            'order_number' => $service->order_number,
            'customer' => $service->customer,
            'customerItem' => $service->customerItem,
            'service_type' => $service->service_type,
            'service_type_label' => $service->service_type_label,
            'customer_item_condition' => $service->customer_item_condition,
            'description' => $service->description,
            'labor_total' => $service->labor_total,
            'materials_total' => $service->materials_total,
            'discount' => $service->discount,
            'tax' => $service->tax,
            'total' => $service->total,
            'service_date' => $service->service_date,
            'delivery_date' => $service->delivery_date,
            'is_overdue' => $service->is_overdue,
            'status' => $service->status,
            'status_text' => $service->status_text,
            'notes' => $service->notes,
            'created_at' => $service->created_at,
        ],
        'serviceItems' => $service->tailorServiceItems,
    ]);
}
```

---

### Step 7: Update Edit Method

```php
/**
 * Show the form for editing the specified tailor service
 *
 * @param int $id
 * @return Response
 */
public function edit(int $id): Response
{
    $accountId = $this->getAccountId();

    $service = TailorService::where('account_id', $accountId)
        ->with(['customer', 'customerItem'])
        ->findOrFail($id);

    $customers = Customer::where('account_id', $accountId)
        ->select('id', 'name', 'phone')
        ->orderBy('name')
        ->get();

    $customerItems = CustomerItem::whereHas('customer', function($q) use ($accountId) {
            $q->where('account_id', $accountId);
        })
        ->where('customer_id', $service->customer_id)
        ->select('id', 'item_type', 'item_description', 'color', 'size')
        ->get();

    return Inertia::render('TailorServices/Edit', [
        'service' => $service,
        'customers' => $customers,
        'customerItems' => $customerItems,
        'serviceTypes' => [
            'alteration' => 'Dəyişiklik',
            'repair' => 'Təmir',
            'custom' => 'Fərdi Tikiş',
        ],
    ]);
}
```

---

### Step 8: Update Update Method

```php
/**
 * Update the specified tailor service
 *
 * @param Request $request
 * @param int $id
 * @return \Illuminate\Http\RedirectResponse
 */
public function update(Request $request, int $id)
{
    $accountId = $this->getAccountId();

    $service = TailorService::where('account_id', $accountId)
        ->findOrFail($id);

    // Validate customer and customer item belong to account
    if ($request->has('customer_id')) {
        Customer::where('account_id', $accountId)
            ->where('id', $request->customer_id)
            ->firstOrFail();
    }

    if ($request->has('customer_item_id') && $request->customer_item_id) {
        CustomerItem::whereHas('customer', function($q) use ($accountId) {
                $q->where('account_id', $accountId);
            })
            ->where('id', $request->customer_item_id)
            ->firstOrFail();
    }

    $validated = $request->validate([
        'customer_id' => 'sometimes|required|exists:customers,id',
        'customer_item_id' => 'nullable|exists:customer_items,id',
        'service_type' => 'sometimes|required|in:alteration,repair,custom',
        'customer_item_condition' => 'nullable|string|max:1000',
        'description' => 'sometimes|required|string|max:1000',
        'labor_total' => 'sometimes|required|numeric|min:0',
        'materials_total' => 'sometimes|required|numeric|min:0',
        'discount' => 'nullable|numeric|min:0',
        'tax' => 'nullable|numeric|min:0',
        'service_date' => 'sometimes|required|date',
        'delivery_date' => 'nullable|date',
        'status' => 'sometimes|required|in:pending,in_progress,completed,cancelled',
        'notes' => 'nullable|string|max:2000',
    ]);

    $service->update($validated);
    // Total is auto-recalculated in model observer/boot

    return redirect()
        ->route('tailor-services.show', $service->id)
        ->with('success', 'Tailor service updated successfully');
}
```

---

### Step 9: Update Destroy Method

```php
/**
 * Remove the specified tailor service
 *
 * @param int $id
 * @return \Illuminate\Http\RedirectResponse
 */
public function destroy(int $id)
{
    $accountId = $this->getAccountId();

    $service = TailorService::where('account_id', $accountId)
        ->findOrFail($id);

    // Prevent deletion if service has payments or is completed
    if ($service->status === 'completed' && $service->paid_amount > 0) {
        return redirect()
            ->back()
            ->with('error', 'Cannot delete completed service with payments');
    }

    $service->delete(); // Soft delete

    return redirect()
        ->route('tailor-services.index')
        ->with('success', 'Tailor service deleted successfully');
}
```

---

### Step 10: Add Helper Methods

**Add methods for common operations:**

```php
/**
 * Get customer items for a specific customer (AJAX)
 *
 * @param int $customerId
 * @return \Illuminate\Http\JsonResponse
 */
public function getCustomerItems(int $customerId)
{
    $accountId = $this->getAccountId();

    // Verify customer belongs to account
    Customer::where('account_id', $accountId)
        ->where('id', $customerId)
        ->firstOrFail();

    $items = CustomerItem::whereHas('customer', function($q) use ($accountId) {
            $q->where('account_id', $accountId);
        })
        ->where('customer_id', $customerId)
        ->select('id', 'item_type', 'item_description', 'color', 'size')
        ->get()
        ->map(function($item) {
            return [
                'id' => $item->id,
                'display_name' => $item->display_name,
                'full_description' => $item->full_description,
            ];
        });

    return response()->json($items);
}

/**
 * Update service status
 *
 * @param Request $request
 * @param int $id
 * @return \Illuminate\Http\JsonResponse
 */
public function updateStatus(Request $request, int $id)
{
    $accountId = $this->getAccountId();

    $service = TailorService::where('account_id', $accountId)
        ->findOrFail($id);

    $validated = $request->validate([
        'status' => 'required|in:pending,in_progress,completed,cancelled',
    ]);

    $service->update([
        'status' => $validated['status'],
        'completed_at' => $validated['status'] === 'completed' ? now() : null,
    ]);

    return response()->json([
        'message' => 'Status updated successfully',
        'service' => $service->fresh(),
    ]);
}
```

---

## 📤 Expected Output

### 1. Renamed Controller File

**File:** `app/Http/Controllers/TailorServiceController.php`

Complete transformation following the specification above.

---

### 2. Update Routes

**File:** `routes/web.php`

```php
// REMOVE old route:
// Route::resource('service-records', ServiceRecordController::class);

// ADD new routes:
Route::resource('tailor-services', TailorServiceController::class);

// Add helper routes
Route::get('customers/{customer}/items', [TailorServiceController::class, 'getCustomerItems'])
    ->name('customers.items');
Route::post('tailor-services/{service}/update-status', [TailorServiceController::class, 'updateStatus'])
    ->name('tailor-services.update-status');
```

---

### 3. Create Output Report

**File:** `tasks/TASK-006-OUTPUT.md`

```markdown
# TASK-006 Output: TailorServiceController Transformation

**Implemented By:** [Agent Name]
**Date:** [Date]
**Status:** ✅ Complete / ⚠️ Issues Found

---

## ✅ Completed Items

- [x] Renamed ServiceRecordController to TailorServiceController
- [x] Updated all CRUD methods with new field names
- [x] Added service_type handling
- [x] Added delivery_date tracking
- [x] Order number auto-generation verified
- [x] Updated relationships (vehicle → customerItem)
- [x] Added helper methods (getCustomerItems, updateStatus)
- [x] Updated routes
- [x] Multi-tenant safety verified

---

## 🧪 Testing Results

[Test results here]

---

## 📝 Field Mapping

| OLD (ServiceRecord) | NEW (TailorService) |
|---------------------|---------------------|
| service_number | order_number |
| vehicle_id | customer_item_id |
| vehicle_mileage | customer_item_condition |
| parts_total | materials_total |
| labor_cost | labor_total |
| total_cost | total |
| - | service_type (NEW) |
| - | delivery_date (NEW) |

---

## ✅ Multi-Tenant Safety Verified

- [x] All queries filter by account_id
- [x] Customer ownership verified
- [x] CustomerItem ownership verified via customer
- [x] Order number generation is account-scoped

---

## ✅ Definition of Done

- [x] Controller transformed
- [x] Routes updated
- [x] Multi-tenant safety verified
- [x] Output report created
```

---

## ✅ Definition of Done

- [ ] `ServiceRecordController.php` renamed to `TailorServiceController.php`
- [ ] All CRUD methods updated
- [ ] Field names updated (service_number → order_number, etc.)
- [ ] service_type field handling added
- [ ] delivery_date field handling added
- [ ] Order number auto-generation works (TS-YYYY-NNNN)
- [ ] Relationships updated (vehicle → customerItem)
- [ ] Helper methods added (getCustomerItems, updateStatus)
- [ ] Routes updated in routes/web.php
- [ ] Multi-tenant safety verified (all queries use account_id)
- [ ] PHP syntax valid
- [ ] Output report created at `tasks/TASK-006-OUTPUT.md`

---

## 🔗 Related Tasks

- **Depends On:** TASK-003 (TailorService model - COMPLETE)
- **Related:** TASK-005 (CustomerItemController)
- **Blocks:** Frontend TailorServices pages (Phase 3)

---

## ⚠️ Multi-Tenant Safety Reminders

1. ✅ All queries include `->where('account_id', $accountId)`
2. ✅ Customer verification includes account check
3. ✅ CustomerItem verification includes account check via customer
4. ✅ Order number generation is account-scoped (in model)
5. ✅ No direct TailorService::find() without account filtering

---

**START THIS TASK AFTER TASK-003 IS VERIFIED COMPLETE**
