# Goods Receipt Deletion Protection - Implementation Tasks

**Branch:** `feature/goods-receipt-deletion-protection`
**Date:** 2025-11-28
**Issue:** Users can delete goods receipts inappropriately, causing data integrity issues

---

## Problem Statement

Currently, users can delete goods receipts without proper validation, leading to:
1. ❌ Deletion of paid receipts (financial data loss)
2. ❌ Orphaned expense records
3. ❌ Orphaned supplier credit records
4. ❌ No way to track if stock from receipt was already sold
5. ❌ No soft delete mechanism (permanent data loss)

---

## Solution: Option A + Soft Delete

Implement multi-layer validation and soft delete mechanism.

---

## Implementation Steps

### ✅ Step 1: Create Task Documentation
- [x] Create this TASKS.md file
- [ ] Review with team

### ⏳ Step 2: Create Git Branch
```bash
git checkout -b feature/goods-receipt-deletion-protection
```

### ⏳ Step 3: Database Migration - Add Soft Deletes

**File:** `database/migrations/[timestamp]_add_soft_deletes_to_goods_receipts.php`

```php
Schema::table('goods_receipts', function (Blueprint $table) {
    $table->softDeletes();
    $table->index('deleted_at');
});
```

**Rollback:**
```php
Schema::table('goods_receipts', function (Blueprint $table) {
    $table->dropSoftDeletes();
});
```

### ⏳ Step 4: Update GoodsReceipt Model

**File:** `app/Models/GoodsReceipt.php`

Add:
```php
use Illuminate\Database\Eloquent\SoftDeletes;

class GoodsReceipt extends Model
{
    use HasFactory, BelongsToAccount, SoftDeletes;

    // ... rest of model
}
```

### ⏳ Step 5: Update GoodsReceiptController::destroy()

**File:** `app/Http/Controllers/GoodsReceiptController.php`

Add validation checks in this order:

#### Check 1: Block if Paid
```php
if ($goodsReceipt->payment_status === 'paid') {
    return back()->withErrors([
        'error' => 'Ödənilmiş mal qəbulunu silmək mümkün deyil. Əvvəlcə ödəniş statusunu dəyişin.'
    ]);
}
```

#### Check 2: Block if Expenses Exist
```php
use App\Models\Expense;

$linkedExpenses = Expense::where('goods_receipt_id', $goodsReceipt->id)->exists();
if ($linkedExpenses) {
    return back()->withErrors([
        'error' => 'Xərc qeydi ilə əlaqəli mal qəbulunu silmək mümkün deyil.'
    ]);
}
```

#### Check 3: Block if Supplier Credit Exists
```php
if ($goodsReceipt->supplier_credit_id) {
    return back()->withErrors([
        'error' => 'Təchizatçı krediti ilə əlaqəli mal qəbulunu silmək mümkün deyil.'
    ]);
}
```

#### Check 4: Warn if Stock Likely Sold
```php
$receivedQuantity = $goodsReceipt->quantity;
$currentStock = ProductStock::where('product_id', $goodsReceipt->product_id)
    ->where('warehouse_id', $goodsReceipt->warehouse_id)
    ->where('variant_id', $goodsReceipt->variant_id)
    ->where('account_id', $goodsReceipt->account_id)
    ->first();

if ($currentStock && $currentStock->quantity < $receivedQuantity) {
    return back()->withErrors([
        'error' => 'Diqqət: Cari stok miqdarı qəbul edilən miqdardan azdır. ' .
                   'Stok satılmış ola bilər. Silmək təhlükəlidir.'
    ]);
}
```

#### Update: Soft Delete Instead of Hard Delete
Replace:
```php
$goodsReceipt->delete();
```

With soft delete (automatically handled by SoftDeletes trait):
```php
$goodsReceipt->delete(); // Now soft deletes
```

#### Update: Improve Audit Trail
Update stock_history notes:
```php
StockHistory::create([
    'product_id' => $goodsReceipt->product_id,
    'variant_id' => $goodsReceipt->variant_id,
    'warehouse_id' => $goodsReceipt->warehouse_id,
    'quantity_before' => $quantityBefore,
    'quantity_change' => -(float) $goodsReceipt->quantity,
    'quantity_after' => $quantityBefore - (float) $goodsReceipt->quantity,
    'type' => 'duzelis_azaltma',
    'reference_type' => 'goods_receipt_delete',
    'reference_id' => $goodsReceipt->id,
    'user_id' => auth()->id(),
    'notes' => "Mal qəbulu silindi (soft delete): {$goodsReceipt->receipt_number} | " .
               "İstifadəçi: " . auth()->user()->name . " | " .
               "Səbəb: İstifadəçi tərəfindən silinmə tələbi",
    'occurred_at' => now(),
]);
```

### ⏳ Step 6: Testing Checklist

#### Test Case 1: Block Paid Receipt Deletion
- [ ] Create goods receipt with instant payment
- [ ] Try to delete it
- [ ] Should show error: "Ödənilmiş mal qəbulunu silmək mümkün deyil"

#### Test Case 2: Block Deletion with Expenses
- [ ] Create goods receipt with expense
- [ ] Try to delete it
- [ ] Should show error: "Xərc qeydi ilə əlaqəli mal qəbulunu silmək mümkün deyil"

#### Test Case 3: Block Deletion with Supplier Credit
- [ ] Create goods receipt with credit payment
- [ ] Verify supplier_credit_id is set
- [ ] Try to delete it
- [ ] Should show error: "Təchizatçı krediti ilə əlaqəli mal qəbulunu silmək mümkün deyil"

#### Test Case 4: Block if Stock Sold
- [ ] Create goods receipt with quantity 100
- [ ] Sell 50 units (current stock = 50)
- [ ] Try to delete receipt (needs 100 but only 50 available)
- [ ] Should show warning about stock being sold

#### Test Case 5: Allow Valid Deletion
- [ ] Create unpaid goods receipt without expenses/credits
- [ ] Don't sell any stock
- [ ] Delete should succeed
- [ ] Verify soft delete (deleted_at is set)
- [ ] Verify stock reversed correctly
- [ ] Verify stock_history created

#### Test Case 6: Restore Deleted Receipt
- [ ] Soft delete a receipt
- [ ] Verify it's hidden from normal queries
- [ ] Restore using: `GoodsReceipt::withTrashed()->find($id)->restore()`
- [ ] Verify it appears again

---

## Database Schema Changes

### goods_receipts Table
```sql
ALTER TABLE goods_receipts ADD COLUMN deleted_at TIMESTAMP NULL;
CREATE INDEX goods_receipts_deleted_at_index ON goods_receipts(deleted_at);
```

---

## Validation Logic Flow

```
User clicks DELETE on goods receipt
    ↓
Check: Is payment_status = 'paid'?
    YES → BLOCK (Error: Cannot delete paid receipt)
    NO ↓
Check: Does it have linked expenses?
    YES → BLOCK (Error: Cannot delete with expenses)
    NO ↓
Check: Does it have supplier_credit_id?
    YES → BLOCK (Error: Cannot delete with supplier credit)
    NO ↓
Check: Is current_stock < received_quantity?
    YES → BLOCK (Warning: Stock may have been sold)
    NO ↓
Proceed with SOFT DELETE:
    1. Reverse stock in product_stock
    2. Create stock_history audit record
    3. Delete stock_movement
    4. Set deleted_at = now() (soft delete)
    5. Show success message
```

---

## Code Locations

| File | Line | Change |
|------|------|--------|
| `GoodsReceiptController.php` | ~663 | `destroy()` method - add validations |
| `GoodsReceipt.php` | ~13 | Add `SoftDeletes` trait |
| Migration (new) | - | Add `deleted_at` column |

---

## Risk Assessment

### Low Risk ✅
- Adding soft deletes (non-breaking change)
- Adding validation checks (prevents bad actions)

### Medium Risk ⚠️
- Stock quantity validation (heuristic, not perfect)
  - **Mitigation:** Clear warning message to user

### High Risk ❌
- None identified

---

## Rollback Plan

If issues occur:
```bash
# Revert migration
php artisan migrate:rollback --step=1

# Switch back to main branch
git checkout main

# Delete feature branch
git branch -D feature/goods-receipt-deletion-protection
```

---

## Future Enhancements

1. **FIFO/LIFO Tracking**
   - Implement batch/lot tracking for goods receipts
   - Link sales to specific receipt batches
   - Accurate "which receipt supplied which sale" tracking

2. **Admin Override**
   - Add permission for super admin to force delete
   - Require reason/notes for forced deletion

3. **Restore UI**
   - Add "Show Deleted" toggle on goods receipts index
   - Add "Restore" button for soft-deleted receipts

4. **Audit Log Enhancement**
   - Create dedicated `audit_logs` table
   - Log all CRUD operations on goods receipts
   - Track who, when, what changed

---

## Notes

- Soft deletes use `deleted_at` timestamp column
- Queries automatically exclude soft-deleted records
- Use `withTrashed()` to include deleted records
- Use `onlyTrashed()` to get only deleted records
- Use `restore()` to un-delete a record
- Use `forceDelete()` for permanent deletion (admin only)

---

## Success Criteria

- ✅ Cannot delete paid goods receipts
- ✅ Cannot delete receipts with expenses
- ✅ Cannot delete receipts with supplier credits
- ✅ Warning shown if stock likely sold
- ✅ Soft delete implemented (can restore)
- ✅ Audit trail preserved in stock_history
- ✅ All tests passing
- ✅ No data integrity issues

---

**Status:** In Progress
**Last Updated:** 2025-11-28
