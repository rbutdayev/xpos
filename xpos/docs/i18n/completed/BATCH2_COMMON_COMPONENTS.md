# 🧩 BATCH 2: Common Components Translation

**Priority:** 🟠 High
**Status:** ⏳ Not Started
**Estimated Time:** 3-4 hours
**Dependencies:** BATCH 1 must be completed first

---

## 🎯 Objective

Translate all shared/reusable components that are used across multiple pages. These components include:
- Buttons (Primary, Secondary, Danger)
- Form inputs (TextInput, Checkbox, Select)
- Modals and dialogs
- Pagination components
- Data tables
- Search and filter components
- Status badges
- Confirmation dialogs

---

## 📋 Component List

### High Priority (User-Facing)
1. `Components/Pagination.tsx`
2. `Components/AdvancedPagination.tsx`
3. `Components/DataTable.tsx`
4. `Components/SearchFilters.tsx`
5. `Components/FilterDropdown.tsx`
6. `Components/Modal.tsx`
7. `Components/StatusBadge.tsx`
8. `Components/BarcodeScanner.tsx`
9. `Components/CustomerSelect.tsx`
10. `Components/ProductSelect.tsx`

### Medium Priority
11. `Components/PrimaryButton.tsx`
12. `Components/SecondaryButton.tsx`
13. `Components/DangerButton.tsx`
14. `Components/TextInput.tsx`
15. `Components/Checkbox.tsx`
16. `Components/InputLabel.tsx`
17. `Components/InputError.tsx`
18. `Components/PaymentForm.tsx`
19. `Components/WarehouseSelector.tsx`
20. `Components/SearchableCustomerSelect.tsx`

---

## 🔧 Standard Pattern for Each Component

### 1. Import the hook
```typescript
import { useTranslation } from 'react-i18next';
```

### 2. Use the hook
```typescript
export default function ComponentName() {
    const { t } = useTranslation('common');
    // ... rest of component
}
```

### 3. Replace strings
```typescript
// ❌ BEFORE
<button>Yadda saxla</button>
<input placeholder="Axtar..." />
<span>Heç bir məlumat tapılmadı</span>

// ✅ AFTER
<button>{t('actions.save')}</button>
<input placeholder={t('placeholders.search')} />
<span>{t('messages.no_data_found')}</span>
```

---

## 📝 Component-Specific Instructions

### 1. Pagination.tsx

**Strings to translate:**
- "Səhifə" → `t('pagination.page')`
- "Cəmi" → `t('pagination.total')`
- "nəticə" → `t('pagination.results')`
- "Növbəti" → `t('pagination.next')`
- "Əvvəlki" → `t('pagination.previous')`

**Example:**
```typescript
const { t } = useTranslation('common');

return (
    <div>
        <span>{t('pagination.page')} {currentPage} / {totalPages}</span>
        <span>{t('pagination.total')}: {total} {t('pagination.results')}</span>
        <button>{t('pagination.previous')}</button>
        <button>{t('pagination.next')}</button>
    </div>
);
```

---

### 2. DataTable.tsx

**Strings to translate:**
- "Axtar" → `t('actions.search')`
- "Filtr" → `t('actions.filter')`
- "Export" → `t('actions.export')`
- "Sətir sayı" → `t('table.rows_per_page')`
- "Heç bir məlumat yoxdur" → `t('table.no_data')`
- "Yüklənir..." → `t('table.loading')`

---

### 3. SearchFilters.tsx

**Strings to translate:**
- "Axtar" → `t('actions.search')`
- "Təmizlə" → `t('actions.clear')`
- "Filtr tətbiq et" → `t('actions.apply_filter')`
- "Tarix aralığı" → `t('filters.date_range')`
- "Status" → `t('labels.status')`
- "Kateqoriya" → `t('labels.category')`

---

### 4. BarcodeScanner.tsx

**Strings to translate:**
- "Barkodu skan edin" → `t('barcode.scan_barcode')`
- "Kamera açılır..." → `t('barcode.opening_camera')`
- "Kamera icazəsi verilmədi" → `t('barcode.camera_permission_denied')`
- "Barkod tapıldı" → `t('barcode.barcode_found')`
- "Yenidən cəhd et" → `t('actions.retry')`
- "Bağla" → `t('actions.close')`

---

### 5. StatusBadge.tsx

**Strings to translate:**
Status values are already coming from backend enums, but labels need translation:
- "Aktiv" → Use backend enum translation
- "Gözləyir" → Use backend enum translation
- "Tamamlandı" → Use backend enum translation

**Note:** This component should use `useTranslations()` hook (from `@/Hooks/useTranslations`) to get backend enum translations.

---

### 6. Modal.tsx

**Strings to translate:**
- "Bağla" → `t('actions.close')`
- "Təsdiqlə" → `t('actions.confirm')`
- "Ləğv et" → `t('actions.cancel')`

---

### 7. PaymentForm.tsx

**Strings to translate:**
- "Ödəniş üsulu" → `t('payment.payment_method')`
- "Məbləğ" → `t('labels.amount')`
- "Qeyd" → `t('labels.notes')`
- "Ödəniş əlavə et" → `t('payment.add_payment')`

**Note:** Payment method labels come from backend enums, use `useTranslations()` hook.

---

### 8. CustomerSelect.tsx

**Strings to translate:**
- "Müştəri seçin" → `t('customer.select_customer')`
- "Axtar..." → `t('placeholders.search')`
- "Yeni müştəri" → `t('customer.new_customer')`
- "Heç bir müştəri tapılmadı" → `t('customer.no_customer_found')`

---

### 9. ProductSelect.tsx

**Strings to translate:**
- "Məhsul seçin" → `t('product.select_product')`
- "Məhsul axtar..." → `t('product.search_product')`
- "Heç bir məhsul tapılmadı" → `t('product.no_product_found')`
- "Stokda yoxdur" → `t('product.out_of_stock')`

---

### 10. WarehouseSelector.tsx

**Strings to translate:**
- "Anbar seçin" → `t('warehouse.select_warehouse')`
- "Bütün anbarlar" → `t('warehouse.all_warehouses')`

---

## 📚 Translation Keys Structure

Add these to `resources/js/i18n/locales/en/common.json`:

```json
{
  "actions": {
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "clear": "Clear",
    "apply_filter": "Apply Filter",
    "retry": "Retry",
    "close": "Close",
    "confirm": "Confirm",
    "cancel": "Cancel"
  },
  "pagination": {
    "page": "Page",
    "total": "Total",
    "results": "results",
    "next": "Next",
    "previous": "Previous",
    "rows_per_page": "Rows per page",
    "showing": "Showing",
    "of": "of"
  },
  "table": {
    "rows_per_page": "Rows per page",
    "no_data": "No data available",
    "loading": "Loading...",
    "search": "Search in table...",
    "actions": "Actions"
  },
  "filters": {
    "date_range": "Date Range",
    "start_date": "Start Date",
    "end_date": "End Date",
    "apply": "Apply",
    "reset": "Reset"
  },
  "barcode": {
    "scan_barcode": "Scan Barcode",
    "opening_camera": "Opening camera...",
    "camera_permission_denied": "Camera permission denied",
    "barcode_found": "Barcode found",
    "scan_again": "Scan Again"
  },
  "payment": {
    "payment_method": "Payment Method",
    "add_payment": "Add Payment",
    "payment_amount": "Payment Amount",
    "remaining_amount": "Remaining Amount"
  },
  "customer": {
    "select_customer": "Select Customer",
    "new_customer": "New Customer",
    "no_customer_found": "No customer found",
    "search_customer": "Search customer..."
  },
  "product": {
    "select_product": "Select Product",
    "search_product": "Search product...",
    "no_product_found": "No product found",
    "out_of_stock": "Out of Stock"
  },
  "warehouse": {
    "select_warehouse": "Select Warehouse",
    "all_warehouses": "All Warehouses"
  },
  "placeholders": {
    "search": "Search...",
    "select": "Select...",
    "enter_text": "Enter text..."
  },
  "messages": {
    "no_data_found": "No data found",
    "loading": "Loading...",
    "success": "Success",
    "error": "Error",
    "confirm_delete": "Are you sure you want to delete?"
  }
}
```

And corresponding Azerbaijani in `az/common.json`:

```json
{
  "actions": {
    "search": "Axtar",
    "filter": "Filtr",
    "export": "Export",
    "clear": "Təmizlə",
    "apply_filter": "Filtri tətbiq et",
    "retry": "Yenidən cəhd et",
    "close": "Bağla",
    "confirm": "Təsdiqlə",
    "cancel": "Ləğv et"
  },
  "pagination": {
    "page": "Səhifə",
    "total": "Cəmi",
    "results": "nəticə",
    "next": "Növbəti",
    "previous": "Əvvəlki",
    "rows_per_page": "Səhifə başına sətir",
    "showing": "Göstərilir",
    "of": "/dən"
  },
  // ... and so on
}
```

---

## 🧪 Testing Each Component

For each component:

1. **Find where it's used**
   ```bash
   grep -r "import.*ComponentName" resources/js/Pages
   ```

2. **Test in a page that uses it**
   - Navigate to that page
   - Switch to English → Check component text
   - Switch to Azerbaijani → Check component text
   - Interact with the component (if interactive)

3. **Check console for errors**
   - No missing translation warnings
   - No TypeScript errors

---

## ✅ Completion Checklist

### For Each Component:
- [ ] Added `useTranslation` hook
- [ ] Replaced all hardcoded strings with `t()` calls
- [ ] Added missing translation keys to JSON files
- [ ] Tested in at least one page
- [ ] No console errors
- [ ] Marked as complete in tracker

### Overall:
- [ ] All 20 components completed
- [ ] Build successful (`npm run build`)
- [ ] Tested language switching
- [ ] Updated PROGRESS_TRACKER.md
- [ ] Ready for BATCH 3

---

## 📊 Progress Tracking

Update `docs/i18n/PROGRESS_TRACKER.md`:

```markdown
## BATCH 2: Common Components

### High Priority (10/10)
- [x] Pagination.tsx
- [x] AdvancedPagination.tsx
- [ ] DataTable.tsx
- [ ] SearchFilters.tsx
...

Status: 🚧 In Progress (2/20 completed)
```

---

## 💡 Tips

1. **Use existing keys:** Before adding new translation keys, check if similar keys already exist
2. **Be consistent:** Use the same translation keys across similar components
3. **Test early:** Don't wait to translate all components before testing
4. **Document issues:** If a component can't be translated easily, document why

---

## 🚀 Next Steps

After completing this batch:
1. Update progress tracker
2. Commit: "feat(i18n): translate common components"
3. Move to **BATCH 3: Dashboard Pages**
