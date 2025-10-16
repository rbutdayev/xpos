# TASK-001-B: Fix Migration Critical Issues

**Assigned To:** Agent (Developer)
**Phase:** 1.1B - Database & Models (Critical Fixes)
**Priority:** CRITICAL - BLOCKING ALL OTHER TASKS
**Estimated Time:** 1-2 hours
**Due Date:** Immediate

---

## 📋 Task Description

Fix **6 critical issues** identified in TASK-001 review that are blocking all model development tasks. These issues involve multi-tenant security violations and missing business-critical columns.

**⚠️ THIS TASK IS BLOCKING:**
- TASK-002 (ProductVariant Model)
- TASK-003 (CustomerItem & TailorService Models)
- All subsequent development

---

## 🎯 Objectives

1. Add `account_id` column to `product_variants` table
2. Fix unique constraints on `product_variants` to be account-scoped
3. Fix unique constraint on `tailor_services.service_number` to be account-scoped
4. Add missing columns to `tailor_services` table (5 columns)
5. Add missing `size` column to `customer_items` table
6. Add soft deletes to `product_variants` and `tailor_services`
7. Rename columns for tailor context (parts_total → materials_total)

---

## 📥 Input Files

**File to Modify:**
- `database/migrations/2025_10_16_000000_create_xpos_schema.php`

**Reference Files:**
- `tasks/TASK-001-OUTPUT.md` (the review report with all issues)
- `tasks/NEXT-STEPS-IMPLEMENTATION.md` (original requirements)

---

## 🔧 Critical Fixes Required

### ❌ CRITICAL ISSUE #1: Missing `account_id` on `product_variants`

**Location:** Lines 219-236 (product_variants table)

**Problem:** No `account_id` column = multi-tenant security breach!

**Fix:**
```php
Schema::create('product_variants', function (Blueprint $table) {
    $table->id();
    $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete(); // ⚠️ ADD THIS LINE
    $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
    // ... rest of columns
});
```

**Where to add:** Right after `$table->id();` on line ~220

---

### ❌ CRITICAL ISSUE #2: Wrong Unique Constraints on `product_variants`

**Location:** Line 234 (product_variants indexes)

**Current Code:**
```php
$table->unique(['product_id', 'size', 'color']); // ❌ WRONG - globally unique
```

**Replace With:**
```php
// Variant combination unique per account
$table->unique(['account_id', 'product_id', 'size', 'color'], 'unique_variant_per_account');

// Barcode unique per account (not globally)
$table->unique(['account_id', 'barcode'], 'unique_barcode_per_account');

// SKU unique per account (not globally)
$table->unique(['account_id', 'sku'], 'unique_sku_per_account');
```

**Why:** Different accounts should be able to use the same barcodes/SKUs without conflicts.

---

### ❌ CRITICAL ISSUE #3: Wrong Index on `product_variants`

**Location:** Line 235 (product_variants indexes)

**Current Code:**
```php
$table->index(['product_id', 'is_active']); // ❌ Missing account_id
```

**Add Additional Indexes:**
```php
$table->index(['account_id', 'product_id'], 'idx_variants_account_product');
$table->index(['account_id', 'is_active'], 'idx_variants_account_active');
$table->index(['product_id', 'is_active']); // Keep this one too
```

**Why:** Query performance for account-scoped variant lookups.

---

### ❌ CRITICAL ISSUE #4: Missing `deleted_at` on `product_variants`

**Location:** Line 232 (product_variants timestamps)

**Current Code:**
```php
$table->timestamps();
```

**Replace With:**
```php
$table->softDeletes();
$table->timestamps();
```

**Why:** Allow soft deletion of variants (preserve history).

---

### ❌ CRITICAL ISSUE #5: Wrong Unique Constraint on `tailor_services.service_number`

**Location:** Line 696 (tailor_services table)

**Current Code:**
```php
$table->string('service_number')->unique(); // ❌ WRONG - globally unique
```

**Replace With:**
```php
$table->string('service_number'); // Remove ->unique()

// Then add at the end of the table (before timestamps):
$table->unique(['account_id', 'service_number'], 'unique_service_number_per_account');
```

**Why:** Service numbers should be unique per account, not globally. Account A can have "TS-2025-0001" and Account B can also have "TS-2025-0001".

---

### ❌ CRITICAL ISSUE #6: Missing Columns in `tailor_services`

**Location:** Lines 688-717 (tailor_services table)

**Add these columns after line 697 (after `description`):**

```php
// After $table->text('description');
$table->enum('service_type', ['alteration', 'repair', 'custom'])->nullable()->comment('Type of tailor service');
$table->text('customer_item_condition')->nullable()->comment('Condition of item when received');
```

**Rename column on line 699:**
```php
// CHANGE THIS:
$table->decimal('parts_total', 10, 2)->default(0);

// TO THIS:
$table->decimal('materials_total', 10, 2)->default(0)->comment('Total cost of materials used');
```

**Rename column on line 698:**
```php
// CHANGE THIS:
$table->decimal('labor_cost', 10, 2)->default(0);

// TO THIS:
$table->decimal('labor_total', 10, 2)->default(0)->comment('Total labor cost');
```

**Add delivery date after line 708 (after `completed_at`):**
```php
// After $table->dateTime('completed_at')->nullable();
$table->dateTime('delivery_date')->nullable()->comment('Promised delivery date');
```

**Add soft deletes before timestamps (line 711):**
```php
// BEFORE $table->timestamps();
$table->softDeletes();
```

---

### ❌ CRITICAL ISSUE #7: Missing `size` Column in `customer_items`

**Location:** Lines 577-595 (customer_items table)

**Add after line 584 (after `description`):**
```php
// After $table->string('description')->nullable();
$table->string('size')->nullable()->comment('Size of clothing item (e.g., M, L, XL, 42)');
```

**Why:** Cannot track clothing size without this column!

---

## 📤 Expected Output

### 1. Modified Migration File

**File:** `database/migrations/2025_10_16_000000_create_xpos_schema.php`

All 7 critical issues fixed as specified above.

---

### 2. Verification Checklist

After making changes, verify:

#### product_variants table:
- [ ] `account_id` column added (after id)
- [ ] `account_id` has foreign key to accounts with CASCADE
- [ ] Unique constraint: `(account_id, product_id, size, color)`
- [ ] Unique constraint: `(account_id, barcode)`
- [ ] Unique constraint: `(account_id, sku)`
- [ ] Index: `(account_id, product_id)`
- [ ] Index: `(account_id, is_active)`
- [ ] `softDeletes()` added before `timestamps()`

#### tailor_services table:
- [ ] `service_type` column added (enum: alteration, repair, custom)
- [ ] `customer_item_condition` column added (text)
- [ ] `parts_total` renamed to `materials_total`
- [ ] `labor_cost` renamed to `labor_total`
- [ ] `delivery_date` column added (datetime, nullable)
- [ ] Unique constraint changed to: `(account_id, service_number)`
- [ ] `softDeletes()` added before `timestamps()`

#### customer_items table:
- [ ] `size` column added (varchar, nullable)

---

### 3. Test Migration

**Run these commands to verify migration works:**

```bash
# 1. Drop all tables and re-run migration
php artisan migrate:fresh

# Expected: No errors, all tables created successfully

# 2. Verify product_variants structure
php artisan tinker
> Schema::hasColumn('product_variants', 'account_id');
# Should return: true

> Schema::getColumnListing('product_variants');
# Should include: account_id, product_id, sku, barcode, size, color, deleted_at

# 3. Verify tailor_services structure
> Schema::hasColumn('tailor_services', 'service_type');
# Should return: true

> Schema::hasColumn('tailor_services', 'delivery_date');
# Should return: true

> Schema::hasColumn('tailor_services', 'materials_total');
# Should return: true

> Schema::hasColumn('tailor_services', 'deleted_at');
# Should return: true

# 4. Verify customer_items structure
> Schema::hasColumn('customer_items', 'size');
# Should return: true
```

---

### 4. Create Output Report

**File:** `tasks/TASK-001-B-OUTPUT.md`

```markdown
# TASK-001-B Output: Migration Critical Issues Fixed

**Fixed By:** [Agent Name]
**Date:** [Date]
**Status:** ✅ Complete / ❌ Issues Remaining

---

## ✅ Fixes Applied

### Fix #1: Added account_id to product_variants
- [x] Column added at line: [line number]
- [x] Foreign key constraint added
- [x] Cascade on delete configured

### Fix #2: Updated product_variants unique constraints
- [x] Changed to: UNIQUE (account_id, product_id, size, color)
- [x] Added: UNIQUE (account_id, barcode)
- [x] Added: UNIQUE (account_id, sku)

### Fix #3: Added product_variants indexes
- [x] Added: INDEX (account_id, product_id)
- [x] Added: INDEX (account_id, is_active)

### Fix #4: Added soft deletes to product_variants
- [x] softDeletes() added before timestamps()

### Fix #5: Fixed tailor_services.service_number unique constraint
- [x] Changed to: UNIQUE (account_id, service_number)

### Fix #6: Added missing columns to tailor_services
- [x] service_type (enum)
- [x] customer_item_condition (text)
- [x] materials_total (renamed from parts_total)
- [x] labor_total (renamed from labor_cost)
- [x] delivery_date (datetime)
- [x] softDeletes() added

### Fix #7: Added size to customer_items
- [x] size column added (varchar, nullable)

---

## 🧪 Migration Test Results

```bash
# Command run:
php artisan migrate:fresh

# Result:
[✅ Success / ❌ Failed - paste error]
```

### Column Verification:
- [x] product_variants.account_id exists
- [x] product_variants.deleted_at exists
- [x] tailor_services.service_type exists
- [x] tailor_services.customer_item_condition exists
- [x] tailor_services.materials_total exists
- [x] tailor_services.labor_total exists
- [x] tailor_services.delivery_date exists
- [x] tailor_services.deleted_at exists
- [x] customer_items.size exists

---

## 📊 Changes Summary

**Lines Modified:** [total number]
**Columns Added:** 8
**Columns Renamed:** 2
**Constraints Updated:** 3
**Indexes Added:** 3

---

## ⚠️ Issues Encountered

[List any issues or blockers encountered]

---

## ✅ Ready to Proceed?

- [x] All critical issues fixed
- [x] Migration runs successfully
- [x] All columns verified
- [x] Ready to unblock TASK-002 and TASK-003

---

## 📝 Notes

[Any additional observations]
```

---

## 🔍 Code Review Checklist (Self-Check Before Submitting)

Before marking this task complete, verify:

- [ ] Every change listed above is implemented
- [ ] No syntax errors in migration file
- [ ] All unique constraints include `account_id`
- [ ] All new columns have appropriate data types
- [ ] Foreign keys have CASCADE behavior
- [ ] Comments added to new columns for clarity
- [ ] Migration runs without errors: `php artisan migrate:fresh`
- [ ] All column existence verified via tinker
- [ ] Output report created with test results
- [ ] No breaking changes to existing data structure

---

## ✅ Definition of Done

- [ ] All 7 critical issues fixed in migration file
- [ ] Migration file syntax is correct (no PHP errors)
- [ ] `php artisan migrate:fresh` runs successfully
- [ ] All new columns verified via `Schema::hasColumn()`
- [ ] Output report created at `tasks/TASK-001-B-OUTPUT.md`
- [ ] Report shows all checklist items completed
- [ ] No errors or warnings in migration

---

## 🔗 Dependencies

**This task blocks:**
- TASK-002: ProductVariant Model (cannot implement without account_id)
- TASK-003: CustomerItem & TailorService Models (needs correct columns)

**After completion:**
- Notify Team Lead that TASK-002 and TASK-003 can proceed
- Update NEXT-STEPS-IMPLEMENTATION.md Phase 1.1 status to ✅ Complete

---

## 📞 Emergency Contact

If you encounter blocking issues:
1. Document the error in output report
2. Include full error message and stack trace
3. Include the specific line causing the issue
4. DO NOT proceed with broken migration
5. Flag for immediate Team Lead review

---

## 💡 Tips for Success

1. **Make one change at a time** - Test after each critical fix
2. **Use comments** - Mark each change with `// TASK-001-B: Added for [reason]`
3. **Keep backup** - Copy original migration before editing
4. **Test thoroughly** - Run `migrate:fresh` multiple times
5. **Verify each column** - Use tinker to check every new column exists

---

**⚠️ CRITICAL REMINDER:**

This migration is the foundation of the entire XPOS system. Every model, controller, and frontend component depends on this schema being correct.

**Multi-tenant security depends on account_id being on product_variants!**

Take your time, be thorough, and verify everything works before submitting.

---

**START THIS TASK IMMEDIATELY - HIGHEST PRIORITY!**
