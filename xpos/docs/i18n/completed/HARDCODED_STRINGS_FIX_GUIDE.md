# 🔧 Hardcoded Strings - Fix Guide

## Quick Reference

**What's the problem?**
29 files have hardcoded Azerbaijani text like `'Nağd'`, `'Kart'` that don't change when user switches language.

**How to fix?**
Replace hardcoded strings with `useTranslations()` hook.

---

## 🎯 Files to Fix (Priority Order)

### **PHASE 1: Critical (Fix First)** ⚠️

| File | Issue | Lines |
|------|-------|-------|
| `Components/TableConfigurations.tsx` | Payment method display | 1526, 1699, 2350 |
| `Pages/SupplierPayments/Show.tsx` | Payment method map | 50-52 |
| `Pages/Returns/Show.tsx` | Payment method map | 107-108 |

### **PHASE 2: Customer Facing** 🛒

| File | Issue |
|------|-------|
| `Pages/POS/components/SummaryPaymentSection.tsx` | Payment buttons |
| `Pages/TouchPOS/components/TouchPayment.tsx` | Payment selection |
| `Pages/Rentals/Return.tsx` | Payment method state |
| `Pages/Rentals/Show.tsx` | Payment method buttons |

### **PHASE 3: Admin & Reports** 📊

| Category | Files |
|----------|-------|
| Gift Cards | 5 files in `Pages/GiftCards/` and `Pages/Admin/GiftCards/` |
| Loyalty Cards | 2 files in `Pages/Admin/LoyaltyCards/` |
| Services | 2 files in `Pages/TailorServices/` |

### **PHASE 4: Low Priority** 📝

| Category | Files |
|----------|-------|
| Navigation | 3 files in `Components/` |
| Forms | `Pages/GoodsReceipts/Components/GoodsReceiptForm.tsx` |
| Settings | `Pages/Settings/FiscalPrinter/Index.tsx` |
| Other | `Pages/Integrations/Index.tsx` |

---

## 📖 Fix Patterns

### **Pattern 1: Replace Ternary Operators**

**Find:**
```typescript
{expense.payment_method === 'nağd' ? 'Nağd' :
 expense.payment_method === 'kart' ? 'Kart' : 'Köçürmə'}
```

**Replace with:**
```typescript
// 1. Add import at top:
import { useTranslations } from '@/Hooks/useTranslations';

// 2. Inside component:
const { translatePaymentMethod } = useTranslations();

// 3. Use it:
{translatePaymentMethod(expense.payment_method)}
```

---

### **Pattern 2: Replace Hardcoded Maps**

**Find:**
```typescript
const PAYMENT_METHOD_LABELS = {
    'nağd': 'Nağd',
    'kart': 'Kart',
    'köçürmə': 'Köçürmə',
};

// Usage:
{PAYMENT_METHOD_LABELS[payment.method]}
```

**Replace with:**
```typescript
// 1. Add import:
import { useTranslations } from '@/Hooks/useTranslations';

// 2. Inside component:
const { paymentMethods } = useTranslations();

// 3. Remove the hardcoded map, use directly:
{paymentMethods[payment.method] || payment.method}
```

---

### **Pattern 3: Replace Payment Method Buttons**

**Find:**
```typescript
<button onClick={() => setPaymentMethod('cash')}>
    Nağd
</button>
<button onClick={() => setPaymentMethod('card')}>
    Kart
</button>
```

**Replace with:**
```typescript
// 1. Add import:
import { useTranslations } from '@/Hooks/useTranslations';

// 2. Inside component:
const { paymentMethods } = useTranslations();

// 3. Generate buttons dynamically:
{Object.entries(paymentMethods).map(([value, label]) => (
    <button
        key={value}
        onClick={() => setPaymentMethod(value)}
    >
        {label}
    </button>
))}
```

---

## ✅ Checklist (Copy this for each file)

For each file you fix:

```
File: ___________________________

□ Added import: `import { useTranslations } from '@/Hooks/useTranslations';`
□ Added hook: `const { translatePaymentMethod, paymentMethods } = useTranslations();`
□ Replaced all hardcoded 'Nağd' with translatePaymentMethod()
□ Replaced all hardcoded 'Kart' with translatePaymentMethod()
□ Replaced all hardcoded 'Köçürmə' with translatePaymentMethod()
□ Removed hardcoded maps (if any)
□ Tested: Switched language and verified translations work
□ Tested: No console errors
```

---

## 🚀 Quick Start (Fix First File)

**Start with `TableConfigurations.tsx`:**

1. Open file: `resources/js/Components/TableConfigurations.tsx`

2. Add at top (line ~1-5):
```typescript
import { useTranslations } from '@/Hooks/useTranslations';
```

3. Find line 1526, replace:
```typescript
// OLD:
{expense.payment_method === 'nağd' ? 'Nağd' :
 expense.payment_method === 'kart' ? 'Kart' : 'Köçürmə'}

// NEW (add hook first in component):
const { translatePaymentMethod } = useTranslations();
// Then use:
{translatePaymentMethod(expense.payment_method)}
```

4. Repeat for lines 1699 and 2350

5. Test: Switch language, verify table shows translated payment methods

---

## 🔍 How to Find Hardcoded Strings

Run this to find remaining hardcoded strings:
```bash
grep -rn "Nağd\|Kart\|Köçürmə" resources/js --include="*.tsx" | grep -v mockData
```

---

## ❓ Common Questions

**Q: Do I need to change enum values like `'cash'`, `'card'`?**
A: No. Keep values as-is. Only change the display labels.

**Q: What if translation is missing?**
A: The hook returns the original value as fallback. No errors.

**Q: Can I use `translatePaymentMethod` with wrong value?**
A: Yes, it safely returns the value if not found.

**Q: Do I need to update TypeScript types?**
A: No, types are already updated in PageProps.

---

## 📊 Progress Tracker

Total files: **29**

- [ ] Phase 1: 3 files (Critical)
- [ ] Phase 2: 4 files (Customer Facing)
- [ ] Phase 3: 9 files (Admin & Reports)
- [ ] Phase 4: 13 files (Low Priority)

---

## 💡 Pro Tips

1. **Fix one file completely, test, then move to next**
2. **Use search (Cmd/Ctrl + F) to find all instances in file**
3. **Always import hook at top of file**
4. **Test language switch after each fix**
5. **Commit after each phase**

---

## 🎉 After Fixing All Files

Run final check:
```bash
# Should return 0 or only mockData files
grep -rn "Nağd\|Kart\|Köçürmə" resources/js --include="*.tsx" | grep -v mockData | wc -l
```

Then test:
1. Switch language to Azerbaijani - all enums should show in Azerbaijani
2. Switch language to English - all enums should show in English
3. Check all 29 files in browser
4. Verify no console errors

**Done!** 🎊
