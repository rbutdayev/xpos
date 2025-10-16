# TASK-005: Update CustomerItemController (Transform from VehicleController)

**Assigned To:** Agent (Developer)
**Phase:** 2.2 - Backend Controllers
**Priority:** MEDIUM
**Estimated Time:** 3-4 hours
**Due Date:** Day 4-5

---

## 📋 Task Description

Transform the existing `VehicleController` into `CustomerItemController` to manage customer clothing items instead of vehicles. Update all CRUD operations, validation rules, and UI responses to reflect the clothes retail domain.

---

## 🎯 Objectives

1. Rename `VehicleController` to `CustomerItemController`
2. Update all method implementations for clothing items
3. Update validation rules (remove vehicle fields, add clothing fields)
4. Update relationships (serviceRecords → tailorServices)
5. Ensure multi-tenant safety (scope through customer's account)
6. Update Inertia responses for new field names

---

## 📥 Input Files

**Files to Transform:**
- `app/Http/Controllers/VehicleController.php` → `CustomerItemController.php`

**Reference Files:**
- `app/Models/CustomerItem.php` (TASK-003 output)
- `app/Models/Customer.php` (existing)
- `tasks/NEXT-STEPS-IMPLEMENTATION.md` (lines 526-543)

**Dependencies:**
- ⚠️ **BLOCKED BY:** TASK-003 (CustomerItem model must be complete)

---

## 🔧 Implementation Requirements

### Step 1: Rename Controller File

```bash
# Rename the controller file
mv app/Http/Controllers/VehicleController.php app/Http/Controllers/CustomerItemController.php
```

---

### Step 2: Update Class Name and Namespace

**File:** `app/Http/Controllers/CustomerItemController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Models\CustomerItem;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerItemController extends Controller
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

**OLD (Vehicle listing):**
- Listed vehicles by plate_number, brand, model

**NEW (CustomerItem listing):**
- List customer items by item_type, description, customer name

```php
/**
 * Display a listing of customer items
 *
 * @param Request $request
 * @return Response
 */
public function index(Request $request): Response
{
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
```

---

### Step 4: Update Create Method

**NEW validation for clothing items:**

```php
/**
 * Show the form for creating a new customer item
 *
 * @return Response
 */
public function create(): Response
{
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
```

---

### Step 5: Update Store Method

**OLD fields:** plate_number, vin, engine_type, mileage, brand, model, year
**NEW fields:** item_type, item_description, fabric, size, color, purchase_date, special_instructions

```php
/**
 * Store a newly created customer item
 *
 * @param Request $request
 * @return \Illuminate\Http\RedirectResponse
 */
public function store(Request $request)
{
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
```

---

### Step 6: Update Show Method

**Include tailor services (renamed from service records):**

```php
/**
 * Display the specified customer item
 *
 * @param int $id
 * @return Response
 */
public function show(int $id): Response
{
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
```

---

### Step 7: Update Edit Method

```php
/**
 * Show the form for editing the specified customer item
 *
 * @param int $id
 * @return Response
 */
public function edit(int $id): Response
{
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
```

---

### Step 8: Update Update Method

```php
/**
 * Update the specified customer item
 *
 * @param Request $request
 * @param int $id
 * @return \Illuminate\Http\RedirectResponse
 */
public function update(Request $request, int $id)
{
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
```

---

### Step 9: Update Destroy Method

```php
/**
 * Remove the specified customer item
 *
 * @param int $id
 * @return \Illuminate\Http\RedirectResponse
 */
public function destroy(int $id)
{
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
```

---

## 📤 Expected Output

### 1. Renamed Controller File

**File:** `app/Http/Controllers/CustomerItemController.php`

Complete transformation following the specification above.

---

### 2. Update Routes

**File:** `routes/web.php`

```php
// REMOVE old route:
// Route::resource('vehicles', VehicleController::class);

// ADD new route:
Route::resource('customer-items', CustomerItemController::class);
```

---

### 3. Remove Old Vehicle References

Search and update any references to:
- `VehicleController` → `CustomerItemController`
- `/vehicles` routes → `/customer-items`

---

### 4. Create Output Report

**File:** `tasks/TASK-005-OUTPUT.md`

```markdown
# TASK-005 Output: CustomerItemController Transformation

**Implemented By:** [Agent Name]
**Date:** [Date]
**Status:** ✅ Complete / ⚠️ Issues Found

---

## ✅ Completed Items

- [x] Renamed VehicleController.php to CustomerItemController.php
- [x] Updated class name to CustomerItemController
- [x] Updated index() method with new fields
- [x] Updated create() method with item types
- [x] Updated store() method with clothing validation
- [x] Updated show() method with tailorServices
- [x] Updated edit() method
- [x] Updated update() method with clothing validation
- [x] Updated destroy() method with tailor service check
- [x] Updated routes in routes/web.php
- [x] Removed old vehicle field references

---

## 🧪 Testing Results

### Test 1: Create Customer Item
```bash
POST /customer-items
{
  "customer_id": 1,
  "item_type": "Jacket",
  "fabric": "Wool",
  "size": "L",
  "color": "Navy Blue"
}
```

**Result:** [✅ Pass / ❌ Fail]

### Test 2: Multi-Tenant Scoping
- Created item for Account A customer
- Attempted to access from Account B
- **Result:** [✅ 404 Not Found / ❌ Security breach]

---

## 📝 Field Mapping

| OLD (Vehicle) | NEW (CustomerItem) |
|---------------|-------------------|
| plate_number | (removed) |
| vin | (removed) |
| engine_type | (removed) |
| mileage | (removed) |
| brand | item_type |
| model | item_description |
| year | purchase_date |
| color | color (kept) |
| notes | notes (kept) |
| - | fabric (NEW) |
| - | size (NEW) |
| - | special_instructions (NEW) |

---

## ✅ Multi-Tenant Safety Verified

- [x] All methods use forAccount() scope
- [x] Customer ownership verified before operations
- [x] Item scoped through customer's account
- [x] TailorServices relationship filtered by account

---

## ⚠️ Breaking Changes

**Route Changes:**
- `/vehicles` → `/customer-items`
- Route names: `vehicles.*` → `customer-items.*`

**Controller Changes:**
- `VehicleController` → `CustomerItemController`

**View References:**
- Update all Inertia components from `Vehicles/*` to `CustomerItems/*`

---

## ✅ Definition of Done

- [x] Controller renamed and updated
- [x] All methods transformed
- [x] Routes updated
- [x] Multi-tenant safety verified
- [x] Output report created
```

---

## ✅ Definition of Done

- [ ] `VehicleController.php` renamed to `CustomerItemController.php`
- [ ] Class name updated
- [ ] All CRUD methods updated with new field names
- [ ] Validation rules updated (removed vehicle fields, added clothing fields)
- [ ] Relationships updated (serviceRecords → tailorServices)
- [ ] Multi-tenant scoping verified (forAccount scope used)
- [ ] Routes updated in routes/web.php
- [ ] PHP syntax valid (no errors)
- [ ] Soft delete check includes tailor services
- [ ] Output report created at `tasks/TASK-005-OUTPUT.md`

---

## 🔗 Related Tasks

- **Depends On:** TASK-003 (CustomerItem model - COMPLETE)
- **Blocks:** Frontend CustomerItems pages (Phase 3)
- **Related:** TASK-006 (TailorServiceController)

---

## ⚠️ Multi-Tenant Safety Reminders

1. ✅ All queries use `forAccount($accountId)` scope
2. ✅ Customer verification includes account_id check
3. ✅ CustomerItem is scoped through customer's account
4. ✅ TailorServices relationship filtered by account_id
5. ✅ No direct CustomerItem::find() without scoping

---

## 📞 Testing Checklist

```bash
# 1. Test item creation
curl -X POST /customer-items -d '{"customer_id": 1, "item_type": "Jacket", ...}'

# 2. Test listing with filters
curl -X GET "/customer-items?search=Jacket&type=Jacket"

# 3. Test multi-tenant isolation
# Login as Account A → Create item
# Login as Account B → Try to access item (should 404)
```

---

**START THIS TASK AFTER TASK-003 IS VERIFIED COMPLETE**
