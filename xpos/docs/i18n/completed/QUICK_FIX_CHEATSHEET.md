# ⚡ Quick Fix Cheatsheet

## The 3-Step Fix

### 1. Add Import
```typescript
import { useTranslations } from '@/Hooks/useTranslations';
```

### 2. Add Hook
```typescript
const { translatePaymentMethod, paymentMethods } = useTranslations();
```

### 3. Replace Strings

| Old (Hardcoded) | New (Translated) |
|-----------------|------------------|
| `'Nağd'` | `{translatePaymentMethod('cash')}` |
| `'Kart'` | `{translatePaymentMethod('card')}` |
| `expense.payment_method === 'nağd' ? 'Nağd' : 'Kart'` | `{translatePaymentMethod(expense.payment_method)}` |
| `const labels = { 'nağd': 'Nağd' }` | `const { paymentMethods } = useTranslations();` |

---

## Files to Fix (29 Total)

### Start Here (3 files):
1. `Components/TableConfigurations.tsx` (lines 1526, 1699, 2350)
2. `Pages/SupplierPayments/Show.tsx` (line 50)
3. `Pages/Returns/Show.tsx` (line 107)

### Then These (4 files):
4. `Pages/POS/components/SummaryPaymentSection.tsx`
5. `Pages/TouchPOS/components/TouchPayment.tsx`
6. `Pages/Rentals/Return.tsx`
7. `Pages/Rentals/Show.tsx`

### Finally (22 files):
All files in:
- `Pages/GiftCards/` (3 files)
- `Pages/Admin/GiftCards/` (3 files)
- `Pages/Admin/LoyaltyCards/` (2 files)
- `Pages/TailorServices/` (2 files)
- `Pages/Rentals/` (2 more files)
- Others (10 files)

---

## Test Checklist

After fixing each file:
- [ ] No TypeScript errors
- [ ] Switch to Azerbaijani → Shows "Nağd", "Kart"
- [ ] Switch to English → Shows "Cash", "Card"
- [ ] No console errors

---

## Find Command
```bash
grep -rn "Nağd\|Kart" resources/js --include="*.tsx" | grep -v mockData
```

Shows remaining hardcoded strings to fix.
