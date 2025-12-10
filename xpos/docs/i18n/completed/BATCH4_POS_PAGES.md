# 🛒 BATCH 4: POS & Sales Pages Translation

**Priority:** 🟡 Medium
**Status:** ⏳ Not Started
**Estimated Time:** 3-4 hours
**Dependencies:** BATCH 1, 2, 3 must be completed first

---

## 🎯 Objective

Translate Point of Sale and Sales-related pages - these are critical user-facing screens.

---

## 📋 Files to Translate

### POS Pages
1. `Pages/POS/Index.tsx` - Main POS interface
2. `Pages/TouchPOS/Index.tsx` - Touch-friendly POS
3. `Pages/POS/components/SummaryPaymentSection.tsx`
4. `Pages/TouchPOS/components/TouchPayment.tsx`
5. `Pages/TouchPOS/components/TouchCart.tsx`
6. `Pages/TouchPOS/components/TouchHeader.tsx`
7. `Pages/TouchPOS/components/TouchProductGrid.tsx`

### Sales Pages
8. `Pages/Sales/Index.tsx` - Sales list
9. `Pages/Sales/Show.tsx` - Sale details
10. `Pages/Sales/Edit.tsx` - Edit sale
11. `Pages/Returns/Show.tsx` - Return details
12. `Pages/OnlineOrders/Index.tsx` - Online orders
13. `Pages/ShiftManagement/*` - Shift management pages

### Sales Components
14. `Components/CartSection.tsx`
15. `Components/CustomerSection.tsx`
16. `Components/ProductSearchSection.tsx`
17. `Components/DiscountModal.tsx`
18. `Components/ReturnModal.tsx`
19. `Components/GiftCardSaleModal.tsx`

---

## 🔑 Translation Keys

Add to `resources/js/i18n/locales/en/sales.json`:

```json
{
  "pos": {
    "title": "Point of Sale",
    "cart": "Cart",
    "total": "Total",
    "subtotal": "Subtotal",
    "tax": "Tax",
    "discount": "Discount",
    "grand_total": "Grand Total",
    "add_product": "Add Product",
    "search_product": "Search product by name or barcode",
    "scan_barcode": "Scan Barcode",
    "customer": "Customer",
    "select_customer": "Select Customer",
    "no_customer": "Walk-in Customer",
    "payment": "Payment",
    "complete_sale": "Complete Sale",
    "clear_cart": "Clear Cart",
    "apply_discount": "Apply Discount",
    "item_discount": "Item Discount",
    "cart_discount": "Cart Discount",
    "empty_cart": "Cart is empty",
    "add_items_to_continue": "Add items to continue"
  },
  "sales_list": {
    "title": "Sales List",
    "sale_number": "Sale #",
    "date": "Date",
    "customer": "Customer",
    "total": "Total",
    "status": "Status",
    "payment_status": "Payment Status",
    "actions": "Actions",
    "view": "View",
    "edit": "Edit",
    "print": "Print",
    "return": "Return"
  },
  "sale_details": {
    "title": "Sale Details",
    "sale_info": "Sale Information",
    "customer_info": "Customer Information",
    "items": "Items",
    "payment_info": "Payment Information",
    "notes": "Notes",
    "created_by": "Created By",
    "created_at": "Created At"
  },
  "returns": {
    "title": "Return Sale",
    "return_items": "Return Items",
    "return_reason": "Return Reason",
    "refund_method": "Refund Method",
    "refund_amount": "Refund Amount",
    "process_return": "Process Return",
    "select_items": "Select items to return",
    "quantity_to_return": "Quantity to Return"
  },
  "online_orders": {
    "title": "Online Orders",
    "order_number": "Order #",
    "order_status": "Order Status",
    "pending": "Pending",
    "processing": "Processing",
    "completed": "Completed",
    "cancelled": "Cancelled"
  }
}
```

---

## 🔧 Key Changes

### POS/Index.tsx - Main changes:

```typescript
import { useTranslation } from 'react-i18next';

export default function POS() {
    const { t } = useTranslation('sales');

    return (
        <>
            <h1>{t('pos.title')}</h1>
            <button>{t('pos.complete_sale')}</button>
            <button>{t('pos.clear_cart')}</button>
            <span>{t('pos.total')}: {total}</span>
        </>
    );
}
```

### TouchPayment.tsx - Payment section:

```typescript
const { t } = useTranslation('sales');
const { translatePaymentMethod } = useTranslations(); // For backend enums

<button>{translatePaymentMethod('cash')}</button>
<button>{translatePaymentMethod('card')}</button>
<span>{t('pos.grand_total')}: {grandTotal}</span>
```

---

## 🧪 Testing

### POS Testing:
1. Navigate to `/pos`
2. Add products to cart
3. Switch language → Check all buttons, labels
4. Select customer
5. Apply discount
6. Complete sale
7. Verify all text is translated

### Sales List Testing:
1. Navigate to `/sales`
2. Check table headers
3. Check action buttons
4. View sale details
5. Switch language → Verify all text updates

---

## ⚠️ Important Notes

- **Payment methods** use backend enums → Use `useTranslations()` hook
- **Status badges** use backend enums → Already handled
- **Cart is highly interactive** → Test thoroughly
- **TouchPOS has different layout** → Test separately

---

## ✅ Completion Checklist

- [ ] All 19 POS/Sales files translated
- [ ] Translation keys added to `sales.json` (EN & AZ)
- [ ] Tested complete sale flow in both languages
- [ ] Tested returns in both languages
- [ ] Payment methods display correctly
- [ ] No console errors
- [ ] Updated PROGRESS_TRACKER.md

---

**Next:** BATCH 5: Inventory & Warehouse Pages
