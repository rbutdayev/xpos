# TASK-001: Review & Verify Consolidated Migration

**Assigned To:** Agent (Developer)
**Phase:** 1.1 - Database & Models
**Priority:** HIGH (Blocking other tasks)
**Estimated Time:** 2-3 hours
**Due Date:** Day 1

---

## 📋 Task Description

Review the consolidated migration file and verify that all required tables and columns exist for the XPOS transformation. This is a **READ-ONLY REVIEW TASK** - do not modify the migration yet, just document findings.

---

## 🎯 Objectives

1. Verify `product_variants` table exists with correct structure
2. Verify `variant_id` columns added to 8 stock-related tables
3. Verify `customer_items` table exists (renamed from vehicles)
4. Verify `tailor_services` table exists (renamed from service_records)
5. Verify multi-tenant `account_id` columns exist in all tables
6. Document any missing columns or tables

---

## 📥 Input Files

**Primary File:**
- `database/migrations/2025_10_16_000000_create_xpos_schema.php`

**Reference Documentation:**
- `tasks/NEXT-STEPS-IMPLEMENTATION.md` (lines 280-298 for requirements)

---

## 🔍 Review Checklist

### 1. Product Variants Table
Verify the `product_variants` table exists with these columns:

- [ ] `id` (bigint, primary key)
- [ ] `account_id` (bigint, NOT NULL, indexed) ⚠️ CRITICAL
- [ ] `product_id` (bigint, NOT NULL, foreign key)
- [ ] `sku` (varchar, unique per account)
- [ ] `barcode` (varchar, unique per account)
- [ ] `size` (varchar, nullable)
- [ ] `color` (varchar, nullable)
- [ ] `color_code` (varchar, nullable - hex color)
- [ ] `pattern` (varchar, nullable)
- [ ] `fit` (varchar, nullable)
- [ ] `material` (varchar, nullable)
- [ ] `price_adjustment` (decimal 10,2, default 0.00)
- [ ] `is_active` (boolean, default true)
- [ ] `created_at`, `updated_at`, `deleted_at` (timestamps)

**Indexes to verify:**
- [ ] `UNIQUE KEY (account_id, barcode)` - NOT globally unique!
- [ ] `UNIQUE KEY (account_id, sku)` - NOT globally unique!
- [ ] `INDEX (account_id, product_id)` - For performance
- [ ] `FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE`
- [ ] `FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE`

---

### 2. Variant ID Columns in Stock Tables

Verify these 8 tables have `variant_id` column added:

#### Table 1: `product_stock`
- [ ] `variant_id` column exists (bigint, nullable)
- [ ] Foreign key: `FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE`
- [ ] Composite index: `INDEX (account_id, product_id, variant_id, warehouse_id)`

#### Table 2: `sale_items`
- [ ] `variant_id` column exists (bigint, nullable)
- [ ] Foreign key: `FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL`
- [ ] Index: `INDEX (account_id, variant_id)`

#### Table 3: `goods_receipt_items` (or similar receiving table)
- [ ] `variant_id` column exists (bigint, nullable)
- [ ] Foreign key configured
- [ ] Index configured

#### Table 4: `stock_movements`
- [ ] `variant_id` column exists (bigint, nullable)
- [ ] Foreign key configured
- [ ] Index configured

#### Table 5: `warehouse_transfers` (or transfer_items)
- [ ] `variant_id` column exists (bigint, nullable)
- [ ] Foreign key configured
- [ ] Index configured

#### Table 6: `product_returns` (or return_items)
- [ ] `variant_id` column exists (bigint, nullable)
- [ ] Foreign key configured
- [ ] Index configured

#### Table 7: `service_items` (will become tailor_service_items)
- [ ] `variant_id` column exists (bigint, nullable)
- [ ] Foreign key configured
- [ ] Index configured

#### Table 8: `stock_history`
- [ ] `variant_id` column exists (bigint, nullable)
- [ ] Foreign key configured
- [ ] Index configured

---

### 3. Customer Items Table (renamed from vehicles)

Verify table name and columns:

- [ ] Table named `customer_items` (NOT vehicles)
- [ ] `id` (primary key)
- [ ] `customer_id` (foreign key to customers)
- [ ] `item_type` (varchar - e.g., "Jacket", "Dress")
- [ ] `item_description` (text)
- [ ] `fabric` (varchar, nullable)
- [ ] `size` (varchar, nullable)
- [ ] `color` (varchar, nullable)
- [ ] `purchase_date` (date, nullable)
- [ ] `special_instructions` (text, nullable)
- [ ] `notes` (text, nullable)
- [ ] `created_at`, `updated_at`, `deleted_at`

**Columns that should NOT exist (old vehicle fields):**
- [ ] NO `plate_number` column
- [ ] NO `vin` column
- [ ] NO `engine_type` column
- [ ] NO `mileage` column

---

### 4. Tailor Services Table (renamed from service_records)

Verify table name and columns:

- [ ] Table named `tailor_services` (NOT service_records)
- [ ] `id` (primary key)
- [ ] `account_id` (bigint, NOT NULL) ⚠️ CRITICAL
- [ ] `customer_id` (foreign key)
- [ ] `customer_item_id` (foreign key to customer_items)
- [ ] `order_number` (varchar, unique per account)
- [ ] `service_type` (enum or varchar: 'alteration', 'repair', 'custom')
- [ ] `customer_item_condition` (text - condition description)
- [ ] `materials_total` (decimal)
- [ ] `labor_total` (decimal)
- [ ] `delivery_date` (datetime, nullable)
- [ ] `status` (varchar/enum)
- [ ] `created_at`, `updated_at`, `deleted_at`

**Columns that should NOT exist (old service_record fields):**
- [ ] NO `vehicle_id` column
- [ ] NO `vehicle_mileage` column
- [ ] NO `service_number` column (replaced by order_number)
- [ ] NO `parts_total` column (replaced by materials_total)

**Index to verify:**
- [ ] `UNIQUE KEY (account_id, order_number)` - Order numbers unique per account

---

### 5. Multi-Tenant Safety Check

For EVERY table in the migration, verify:

- [ ] Tables that store business data have `account_id` column
- [ ] `account_id` is indexed (standalone or composite)
- [ ] Foreign keys include `ON DELETE CASCADE` for account_id
- [ ] Unique constraints include `account_id` (not globally unique)

**Tables that MUST have account_id:**
- products, product_variants, product_stock
- customers, customer_items
- tailor_services, tailor_service_items
- sales, sale_items
- warehouses, warehouse_transfers
- goods_receipts, goods_receipt_items
- stock_movements, stock_history
- product_returns

---

## 📤 Expected Output

Create a detailed review report file: `tasks/TASK-001-OUTPUT.md`

### Report Structure:

```markdown
# TASK-001 Output: Migration Review Report

**Reviewed By:** [Agent Name]
**Review Date:** [Date]
**Migration File:** database/migrations/2025_10_16_000000_create_xpos_schema.php

---

## ✅ Verified Items

### 1. Product Variants Table
- ✅ Table exists
- ✅ All required columns present
- ✅ Indexes configured correctly
- ✅ Foreign keys configured correctly
- ✅ Multi-tenant account_id present

[List each verified item...]

---

## ⚠️ Missing Items

### Critical Issues (Blocking)
1. **Missing Column:** `product_variants.barcode` does not exist
2. **Missing Index:** Unique constraint on (account_id, barcode) not found

### Non-Critical Issues (Nice to have)
1. **Missing Column:** `tailor_services.delivery_date` not found

---

## 🔧 Required Changes

List all changes needed to make migration compliant:

1. **Add column:** `product_variants.barcode` (varchar 255, nullable)
2. **Add index:** UNIQUE KEY (account_id, barcode) on product_variants
3. ...

---

## 📊 Summary Statistics

- Total tables reviewed: X
- Tables with account_id: X / X required
- Tables with variant_id: X / 8 required
- Critical issues found: X
- Non-critical issues: X

---

## ✅ Ready to Proceed?

- [ ] YES - Migration is complete and correct
- [ ] NO - Changes required (see "Required Changes" section)

---

## 📝 Additional Notes

[Any additional observations, concerns, or recommendations]
```

---

## 🚫 Constraints

- **DO NOT** modify the migration file in this task
- **DO NOT** run the migration yet
- **DO NOT** create new files (except the output report)
- **ONLY** read and document findings

---

## ✅ Definition of Done

- [ ] Migration file fully reviewed
- [ ] All checklist items completed
- [ ] Output report created at `tasks/TASK-001-OUTPUT.md`
- [ ] Report clearly states if migration is ready or needs changes
- [ ] All missing items documented with exact requirements
- [ ] Multi-tenant safety verified for all tables

---

## 🔗 Related Tasks

- **Depends On:** None (first task)
- **Blocks:** TASK-002 (ProductVariant Model), TASK-003 (CustomerItem/TailorService Models)

---

## 📞 Questions or Issues?

If you find any ambiguities or need clarification:
1. Document the question in the output report
2. Continue with other review items
3. Flag for Team Lead review

---

**START THIS TASK IMMEDIATELY - IT BLOCKS ALL OTHER TASKS!**
