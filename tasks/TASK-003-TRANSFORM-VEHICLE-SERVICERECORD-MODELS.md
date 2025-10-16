# TASK-003: Transform Vehicle → CustomerItem & ServiceRecord → TailorService

**Assigned To:** Agent (Developer)
**Phase:** 1.3 & 1.4 - Database & Models
**Priority:** MEDIUM
**Estimated Time:** 4-5 hours
**Due Date:** Day 2-3

---

## 📋 Task Description

Rename and transform two model pairs:
1. **Vehicle → CustomerItem** (tracking customer's clothing items instead of vehicles)
2. **ServiceRecord → TailorService** (tracking tailor services instead of auto repairs)

This task involves renaming files, updating fields, relationships, and ensuring multi-tenant safety.

---

## 🎯 Objectives

1. Rename `Vehicle` model to `CustomerItem` with new fields
2. Rename `ServiceRecord` model to `TailorService` with new fields
3. Update all relationships in both models
4. Update fillable arrays and casts
5. Update computed attributes
6. Update validation and business logic
7. Ensure multi-tenant safety (account_id scoping)

---

## 📥 Input Files

**Files to Transform:**
- `app/Models/Vehicle.php` → `app/Models/CustomerItem.php`
- `app/Models/ServiceRecord.php` → `app/Models/TailorService.php`
- `app/Models/ServiceItem.php` → `app/Models/TailorServiceItem.php` (if exists)

**Reference:**
- `tasks/NEXT-STEPS-IMPLEMENTATION.md` (lines 379-450)
- `tasks/TASK-001-OUTPUT.md` (verify table structure)

**Dependencies:**
- ⚠️ **BLOCKED BY:** TASK-001 (migration must be verified)

---

## 🔧 Part 1: Transform Vehicle → CustomerItem

### 1.1 Rename File

**Action:**
```bash
# Rename the model file
mv app/Models/Vehicle.php app/Models/CustomerItem.php
```

---

### 1.2 Update Class Declaration

**File:** `app/Models/CustomerItem.php`

```php
<?php

namespace App\Models;

use App\Traits\BelongsToAccount; // If needed
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerItem extends Model
{
    use SoftDeletes;

    protected $table = 'customer_items';
}
```

---

### 1.3 Update Fillable Fields

**OLD (Vehicle) → NEW (CustomerItem):**

```php
// REMOVE these fields:
'plate_number',
'vin',
'engine_type',
'mileage',
'brand',        // Will be renamed
'model',        // Will be renamed
'year',         // Will be renamed

// REPLACE with these fields:
protected $fillable = [
    'customer_id',           // Keep (foreign key)
    'item_type',            // NEW: e.g., "Jacket", "Dress", "Suit"
    'item_description',     // NEW: Detailed description
    'fabric',               // NEW: e.g., "Cotton", "Wool", "Polyester"
    'size',                 // NEW: e.g., "M", "L", "42"
    'color',                // Keep from old model
    'purchase_date',        // Renamed from 'year'
    'special_instructions', // NEW: Customer's special requests
    'notes',                // Keep from old model
    'created_at',
    'updated_at',
    'deleted_at',
];
```

---

### 1.4 Update Casts

```php
protected $casts = [
    'purchase_date' => 'date',
    'deleted_at' => 'datetime',
];
```

---

### 1.5 Update Relationships

```php
/**
 * Get the customer that owns this item
 * ⚠️ Multi-tenant: CustomerItem is scoped through customer's account
 */
public function customer(): BelongsTo
{
    return $this->belongsTo(Customer::class);
}

/**
 * Get all tailor services for this item
 * (Renamed from serviceRecords)
 */
public function tailorServices(): HasMany
{
    return $this->hasMany(TailorService::class, 'customer_item_id')
        ->whereHas('customer', function($q) {
            // Ensure we only get services from the same account
            if (auth()->check()) {
                $q->where('account_id', auth()->user()->account_id);
            }
        });
}
```

---

### 1.6 Update Computed Attributes

```php
/**
 * Get full item description
 * Example: "Blue Cotton Jacket (Size M)"
 */
public function getFullDescriptionAttribute(): string
{
    $parts = [];

    if ($this->color) {
        $parts[] = $this->color;
    }

    if ($this->fabric) {
        $parts[] = $this->fabric;
    }

    if ($this->item_type) {
        $parts[] = $this->item_type;
    }

    if ($this->size) {
        $parts[] = "(Size {$this->size})";
    }

    return implode(' ', $parts);
}

/**
 * Get short display name
 * Example: "Jacket #123"
 */
public function getDisplayNameAttribute(): string
{
    return ($this->item_type ?? 'Item') . ' #' . $this->id;
}
```

---

### 1.7 Remove Old Methods

**Remove all vehicle-specific methods:**
- Remove: `getPlateNumberFormatted()`
- Remove: `getMileageFormatted()`
- Remove: `updateMileage()`
- Remove any other vehicle-specific logic

---

### 1.8 Add Query Scopes

```php
/**
 * Scope to filter by customer's account
 * ⚠️ CRITICAL: Always use when querying across customers
 */
public function scopeForAccount($query, int $accountId)
{
    return $query->whereHas('customer', function($q) use ($accountId) {
        $q->where('account_id', $accountId);
    });
}

/**
 * Scope to filter by item type
 */
public function scopeByType($query, string $type)
{
    return $query->where('item_type', $type);
}

/**
 * Scope to search items
 */
public function scopeSearch($query, string $search)
{
    return $query->where(function($q) use ($search) {
        $q->where('item_type', 'like', "%{$search}%")
          ->orWhere('item_description', 'like', "%{$search}%")
          ->orWhere('fabric', 'like', "%{$search}%");
    });
}
```

---

## 🔧 Part 2: Transform ServiceRecord → TailorService

### 2.1 Rename File

**Action:**
```bash
# Rename the model file
mv app/Models/ServiceRecord.php app/Models/TailorService.php
```

---

### 2.2 Update Class Declaration

**File:** `app/Models/TailorService.php`

```php
<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TailorService extends Model
{
    use BelongsToAccount, SoftDeletes;

    protected $table = 'tailor_services';
}
```

---

### 2.3 Update Fillable Fields

**OLD (ServiceRecord) → NEW (TailorService):**

```php
// REMOVE these fields:
'vehicle_id',           // Replaced by customer_item_id
'vehicle_mileage',      // Replaced by customer_item_condition
'service_number',       // Replaced by order_number
'parts_total',          // Replaced by materials_total

// REPLACE with these fields:
protected $fillable = [
    'account_id',                  // ⚠️ CRITICAL - Multi-tenant
    'customer_id',                 // Keep
    'customer_item_id',           // NEW (foreign key to customer_items)
    'order_number',               // NEW: e.g., "TS-2025-0001"
    'service_type',               // NEW: "alteration", "repair", "custom"
    'customer_item_condition',    // NEW: Text description of item condition
    'materials_total',            // Renamed from parts_total
    'labor_total',                // Keep
    'discount',                   // Keep
    'tax',                        // Keep
    'total',                      // Keep
    'delivery_date',              // NEW: Expected delivery date
    'status',                     // Keep (pending, in_progress, completed, etc.)
    'notes',                      // Keep
    'created_at',
    'updated_at',
    'deleted_at',
];
```

---

### 2.4 Update Casts

```php
protected $casts = [
    'materials_total' => 'decimal:2',
    'labor_total' => 'decimal:2',
    'discount' => 'decimal:2',
    'tax' => 'decimal:2',
    'total' => 'decimal:2',
    'delivery_date' => 'datetime',
    'deleted_at' => 'datetime',
];
```

---

### 2.5 Update Relationships

```php
/**
 * Get the account that owns this service
 */
public function account(): BelongsTo
{
    return $this->belongsTo(Account::class);
}

/**
 * Get the customer
 * ⚠️ Must filter by account_id
 */
public function customer(): BelongsTo
{
    return $this->belongsTo(Customer::class)
        ->where('account_id', $this->account_id);
}

/**
 * Get the customer item being serviced
 * (Renamed from vehicle)
 */
public function customerItem(): BelongsTo
{
    return $this->belongsTo(CustomerItem::class, 'customer_item_id')
        ->whereHas('customer', function($q) {
            $q->where('account_id', $this->account_id);
        });
}

/**
 * Get service items (materials/products used)
 * (Renamed from serviceItems)
 */
public function tailorServiceItems(): HasMany
{
    return $this->hasMany(TailorServiceItem::class, 'tailor_service_id')
        ->where('account_id', $this->account_id);
}
```

---

### 2.6 Update Order Number Generation

**Remove old service_number logic, add new order_number logic:**

```php
/**
 * Boot the model
 */
protected static function boot()
{
    parent::boot();

    // Auto-generate order number on creation
    static::creating(function ($service) {
        if (!$service->order_number) {
            $service->order_number = static::generateOrderNumber($service->account_id);
        }

        // Auto-set account_id if not set
        if (!$service->account_id && auth()->check()) {
            $service->account_id = auth()->user()->account_id;
        }
    });
}

/**
 * Generate unique order number
 * Format: TS-YYYY-NNNN (TS = Tailor Service)
 * ⚠️ CRITICAL: Must be scoped by account_id!
 */
public static function generateOrderNumber(int $accountId): string
{
    $year = date('Y');
    $prefix = "TS-{$year}-";

    // Get last order number for this account and year
    $lastService = static::where('account_id', $accountId)
        ->where('order_number', 'like', "{$prefix}%")
        ->orderBy('order_number', 'desc')
        ->first();

    if ($lastService) {
        // Extract number from last order: TS-2025-0001 → 0001
        $lastNumber = (int) substr($lastService->order_number, -4);
        $nextNumber = $lastNumber + 1;
    } else {
        $nextNumber = 1;
    }

    return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
}
```

---

### 2.7 Update Computed Attributes

```php
/**
 * Get service type label
 */
public function getServiceTypeLabelAttribute(): string
{
    return match($this->service_type) {
        'alteration' => 'Dəyişiklik',
        'repair' => 'Təmir',
        'custom' => 'Fərdi Tikiş',
        default => $this->service_type,
    };
}

/**
 * Get status label
 */
public function getStatusLabelAttribute(): string
{
    return match($this->status) {
        'pending' => 'Gözləyir',
        'in_progress' => 'İşləniir',
        'completed' => 'Tamamlandı',
        'cancelled' => 'Ləğv edildi',
        default => $this->status,
    };
}

/**
 * Check if service is overdue
 */
public function getIsOverdueAttribute(): bool
{
    if (!$this->delivery_date) {
        return false;
    }

    return $this->delivery_date < now() && $this->status !== 'completed';
}
```

---

### 2.8 Add Query Scopes

```php
/**
 * Scope to filter by account
 * ⚠️ CRITICAL: Always use this!
 */
public function scopeForAccount($query, int $accountId)
{
    return $query->where('account_id', $accountId);
}

/**
 * Scope to filter by service type
 */
public function scopeByType($query, string $type)
{
    return $query->where('service_type', $type);
}

/**
 * Scope to filter by status
 */
public function scopeByStatus($query, string $status)
{
    return $query->where('status', $status);
}

/**
 * Scope to get overdue services
 */
public function scopeOverdue($query)
{
    return $query->where('delivery_date', '<', now())
        ->whereNotIn('status', ['completed', 'cancelled']);
}

/**
 * Scope to get upcoming deliveries
 */
public function scopeUpcoming($query, int $days = 7)
{
    return $query->whereBetween('delivery_date', [now(), now()->addDays($days)])
        ->whereNotIn('status', ['completed', 'cancelled']);
}
```

---

## 🔧 Part 3: Transform ServiceItem → TailorServiceItem (If Exists)

### 3.1 Rename File

**Action:**
```bash
# If the file exists:
mv app/Models/ServiceItem.php app/Models/TailorServiceItem.php
```

---

### 3.2 Update Basic Structure

```php
<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TailorServiceItem extends Model
{
    use BelongsToAccount;

    protected $table = 'tailor_service_items';

    protected $fillable = [
        'account_id',           // ⚠️ CRITICAL
        'tailor_service_id',    // Renamed from service_record_id
        'product_id',
        'variant_id',           // NEW: Support for product variants
        'quantity',
        'unit_price',
        'total',
        'notes',
    ];
}
```

---

### 3.3 Update Relationships

```php
/**
 * Get the tailor service
 */
public function tailorService(): BelongsTo
{
    return $this->belongsTo(TailorService::class, 'tailor_service_id')
        ->where('account_id', $this->account_id);
}

/**
 * Get the product
 */
public function product(): BelongsTo
{
    return $this->belongsTo(Product::class)
        ->where('account_id', $this->account_id);
}

/**
 * Get the product variant (if applicable)
 */
public function variant(): BelongsTo
{
    return $this->belongsTo(ProductVariant::class, 'variant_id')
        ->where('account_id', $this->account_id);
}
```

---

## 📤 Expected Output

### 1. Renamed Model Files

- ✅ `app/Models/CustomerItem.php` (renamed from Vehicle.php)
- ✅ `app/Models/TailorService.php` (renamed from ServiceRecord.php)
- ✅ `app/Models/TailorServiceItem.php` (renamed from ServiceItem.php, if exists)

---

### 2. Updated Code

All three models fully transformed following specifications above.

---

### 3. Create Output Report

**File:** `tasks/TASK-003-OUTPUT.md`

```markdown
# TASK-003 Output: Model Transformation Report

**Implemented By:** [Agent Name]
**Date:** [Date]
**Status:** ✅ Complete / ⚠️ Issues Found

---

## ✅ Completed Items

### CustomerItem Model
- [x] File renamed: Vehicle.php → CustomerItem.php
- [x] Class renamed
- [x] Table name updated to 'customer_items'
- [x] Fillable fields updated (removed vehicle fields, added clothing fields)
- [x] Relationships updated (serviceRecords → tailorServices)
- [x] Computed attributes updated
- [x] Old vehicle methods removed
- [x] Query scopes added (forAccount, byType, search)

### TailorService Model
- [x] File renamed: ServiceRecord.php → TailorService.php
- [x] Class renamed
- [x] Table name updated to 'tailor_services'
- [x] BelongsToAccount trait added
- [x] Fillable fields updated
- [x] Order number generation implemented (account-scoped)
- [x] Relationships updated (vehicle → customerItem)
- [x] Computed attributes added (service_type_label, is_overdue)
- [x] Query scopes added (forAccount, byType, overdue, upcoming)

### TailorServiceItem Model (if exists)
- [x] File renamed: ServiceItem.php → TailorServiceItem.php
- [x] variant_id field added
- [x] Relationships updated
- [x] BelongsToAccount trait added

---

## 🧪 Testing Results

### Test 1: CustomerItem Creation
```bash
php artisan tinker
> $customer = Customer::first();
> $item = CustomerItem::create([
    'customer_id' => $customer->id,
    'item_type' => 'Jacket',
    'fabric' => 'Wool',
    'size' => 'L',
    'color' => 'Navy Blue'
]);
> $item->full_description; // Should show: "Navy Blue Wool Jacket (Size L)"
```

**Result:** [✅ Pass / ❌ Fail]

### Test 2: TailorService with Order Number
```bash
> $service = TailorService::create([
    'account_id' => auth()->user()->account_id,
    'customer_id' => $customer->id,
    'customer_item_id' => $item->id,
    'service_type' => 'alteration'
]);
> $service->order_number; // Should show: "TS-2025-0001"
```

**Result:** [✅ Pass / ❌ Fail]

---

## ⚠️ Issues Encountered

[List any issues]

---

## 📝 Files Modified

1. app/Models/CustomerItem.php (renamed from Vehicle.php)
2. app/Models/TailorService.php (renamed from ServiceRecord.php)
3. app/Models/TailorServiceItem.php (renamed from ServiceItem.php)

---

## ✅ Multi-Tenant Safety Verified

- [x] All relationships filter by account_id
- [x] Order number generation scoped by account_id
- [x] All scopes include account filtering
- [x] BelongsToAccount trait used where needed
```

---

## ✅ Definition of Done

- [ ] CustomerItem model renamed and updated
- [ ] TailorService model renamed and updated
- [ ] TailorServiceItem model renamed and updated (if exists)
- [ ] All fillable fields updated
- [ ] All relationships updated
- [ ] All computed attributes working
- [ ] Order number generation works (account-scoped)
- [ ] Query scopes implemented
- [ ] Multi-tenant safety verified
- [ ] Old vehicle-specific code removed
- [ ] Output report created at `tasks/TASK-003-OUTPUT.md`

---

## 🔗 Related Tasks

- **Depends On:** TASK-001 (migration verification)
- **Blocks:** Controllers that use these models
- **Related:** TASK-002 (ProductVariant model - TailorServiceItem needs variant relationship)

---

## ⚠️ Multi-Tenant Safety Reminders

1. ✅ TailorService has BelongsToAccount trait
2. ✅ All TailorService queries filter by account_id
3. ✅ Order number generation is account-scoped
4. ✅ CustomerItem is scoped through customer's account
5. ✅ All relationships verify account ownership

---

## 📞 Questions or Issues?

Document in output report and flag for Team Lead review.
