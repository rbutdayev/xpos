# 🧭 BATCH 1: Navigation Menu Translation

**Priority:** 🔴 CRITICAL
**Status:** ⏳ Not Started
**File:** `resources/js/Layouts/AuthenticatedLayout.tsx`
**Estimated Time:** 2-3 hours

---

## 🎯 Objective

Translate the main navigation sidebar menu so that all menu items, labels, and navigation text appear in the selected language (English/Azerbaijani).

---

## 📍 Current State

The `AuthenticatedLayout.tsx` file contains the entire navigation menu with **500+ hardcoded Azerbaijani strings**:

```typescript
name: 'POS Satış',              // Hardcoded
name: 'Məhsullar',              // Hardcoded
name: 'Anbar İdarəetməsi',      // Hardcoded
name: 'Xidmətlər',              // Hardcoded
// ... hundreds more
```

---

## 🔧 Implementation Steps

### Step 1: Add Translation Hook

**Location:** Line 62 in `AuthenticatedLayout.tsx` (after imports, inside component)

**Add:**
```typescript
import { useTranslation } from 'react-i18next';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { t } = useTranslation(['common', 'navigation']);
    // ... rest of component
```

---

### Step 2: Update Navigation Items

**Location:** Lines 204-780 (the `getNavigationForRole()` function)

Replace all hardcoded `name:` strings with `t()` calls.

#### Pattern to Follow:

```typescript
// ❌ BEFORE
{
    name: 'POS Satış',
    href: route('pos.index'),
    icon: ShoppingCartIcon,
}

// ✅ AFTER
{
    name: t('navigation.pos_sales'),
    href: route('pos.index'),
    icon: ShoppingCartIcon,
}
```

---

### Step 3: Translation Keys Mapping

Here's the mapping for all menu items:

#### Main Navigation
| Azerbaijani | Translation Key |
|-------------|-----------------|
| Dashboard | `common:navigation.dashboard` |
| POS Satış | `common:navigation.pos_sales` |
| TouchPOS | `common:navigation.touch_pos` |
| Məhsullar | `common:navigation.products` |
| Xidmətlər | `common:navigation.services` |
| Satışlar və Müştərilər | `common:navigation.sales_and_customers` |
| Anbar İdarəetməsi | `common:navigation.warehouse_management` |
| İcarə İdarəetməsi | `common:navigation.rental_management` |
| Maliyyə və Hesabatlar | `common:navigation.finance_and_reports` |
| Parametrlər | `common:navigation.settings` |
| Sistem Monitorinqi | `common:navigation.system_monitoring` |

#### Products Submenu
| Azerbaijani | Translation Key |
|-------------|-----------------|
| Məhsul Siyahısı | `common:navigation.product_list` |
| Kateqoriyalar | `common:navigation.categories` |
| Endirim Kampaniyaları | `common:navigation.discount_campaigns` |
| Loyallıq Proqramı | `common:navigation.loyalty_program` |

#### Warehouse Management Submenu
| Azerbaijani | Translation Key |
|-------------|-----------------|
| Mal Qəbulu | `common:navigation.goods_receipt` |
| Təchizatçılar | `common:navigation.suppliers` |
| Stok Hərəkətləri | `common:navigation.stock_movements` |
| İnventar | `common:navigation.inventory` |
| Məhsul Qaytarmaları | `common:navigation.product_returns` |

#### Services Submenu
| Azerbaijani | Translation Key |
|-------------|-----------------|
| Dərzilik Xidməti | `common:navigation.tailor_service` |
| Telefon Təmiri | `common:navigation.phone_repair` |
| Elektronika Təmiri | `common:navigation.electronics_repair` |
| Ümumi Xidmət | `common:navigation.general_service` |
| Xidmətə Qəbul | `common:navigation.service_intake` |

#### Rental Management Submenu
| Azerbaijani | Translation Key |
|-------------|-----------------|
| İcarə Siyahısı | `common:navigation.rental_list` |
| Təqvim | `common:navigation.calendar` |
| İcarə İnventarı | `common:navigation.rental_inventory` |
| İcarə Kateqoriyaları | `common:navigation.rental_categories` |

#### Sales Submenu
| Azerbaijani | Translation Key |
|-------------|-----------------|
| Satış Siyahısı | `common:navigation.sales_list` |
| Satış İadələri | `common:navigation.sales_returns` |
| Növbə İdarəetməsi | `common:navigation.shift_management` |
| Online Sifarişlər | `common:navigation.online_orders` |
| Müştərilər | `common:navigation.customers` |
| SMS | `common:navigation.sms` |
| Hədiyyə Kartları | `common:navigation.gift_cards` |

#### Finance Submenu
| Azerbaijani | Translation Key |
|-------------|-----------------|
| Xərclər | `common:navigation.expenses` |
| İşçi Maaşları | `common:navigation.employee_salaries` |
| Təchizatçı Ödənişləri | `common:navigation.supplier_payments` |
| Hesabat Mərkəzi | `common:navigation.report_center` |

#### Settings Submenu
| Azerbaijani | Translation Key |
|-------------|-----------------|
| Şirkət Parametrləri | `common:navigation.company_settings` |
| Filiallar | `common:navigation.branches` |
| İstifadəçilər | `common:navigation.users` |
| Anbarlar | `common:navigation.warehouses` |
| Ümumi Parametrlər | `common:navigation.general_settings` |
| Printer Konfiqurasiyası | `common:navigation.printer_config` |
| Çek Şablonları | `common:navigation.receipt_templates` |
| API Tokenləri | `common:navigation.api_tokens` |
| İnteqrasiyalar | `common:navigation.integrations` |

#### System Monitoring Submenu
| Azerbaijani | Translation Key |
|-------------|-----------------|
| Fiskal Printer Növbəsi | `common:navigation.fiscal_printer_queue` |
| SMS Logları | `common:navigation.sms_logs` |
| Telegram Logları | `common:navigation.telegram_logs` |
| Audit Logları | `common:navigation.audit_logs` |

---

### Step 4: Verify Translation Keys Exist

Before making changes, verify all keys exist in:
- `resources/js/i18n/locales/en/common.json`
- `resources/js/i18n/locales/az/common.json`

**If keys are missing, add them first!**

Example structure needed in `common.json`:

```json
{
  "navigation": {
    "dashboard": "Dashboard",
    "pos_sales": "POS Sales",
    "touch_pos": "TouchPOS",
    "products": "Products",
    "services": "Services",
    // ... all other keys
  }
}
```

---

### Step 5: Handle Special Cases

#### User Profile Section
Replace hardcoded "Profil" and "Çıxış":

```typescript
// ❌ BEFORE
<span>Profil</span>
<button>Çıxış</button>

// ✅ AFTER
<span>{t('common:navigation.profile')}</span>
<button>{t('common:actions.logout')}</button>
```

#### Warehouse Selector
Look for warehouse-related labels around line 90-100.

---

## 📝 Full Example: Before & After

### Before (Lines 240-253):
```typescript
{
    name: 'Məhsullar',
    href: '/products',
    icon: CubeIcon,
    current: route().current('products.*')
}
```

### After:
```typescript
{
    name: t('common:navigation.products'),
    href: '/products',
    icon: CubeIcon,
    current: route().current('products.*')
}
```

---

## 🧪 Testing Instructions

### 1. Build the application
```bash
npm run build
```

### 2. Test in browser
1. Log in to the application
2. Check the navigation menu
3. Switch language to **English**
   - All menu items should show in English
4. Switch language to **Azerbaijani**
   - All menu items should show in Azerbaijani
5. Check all submenus expand/collapse correctly
6. Verify no console errors

### 3. Checklist
- [ ] No TypeScript errors
- [ ] Build completes successfully
- [ ] Navigation menu displays in English when EN is selected
- [ ] Navigation menu displays in Azerbaijani when AZ is selected
- [ ] All submenus work correctly
- [ ] User dropdown (Profile/Logout) translated
- [ ] No "missing translation" warnings in console
- [ ] Page doesn't break when switching languages

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find name 't'"
**Solution:** Make sure you added `const { t } = useTranslation()` inside the component.

### Issue 2: "Missing translation key"
**Solution:** Add the missing key to both `en/common.json` and `az/common.json`.

### Issue 3: Menu items show as "navigation.products"
**Solution:** You forgot the namespace prefix. Use `t('common:navigation.products')` not `t('navigation.products')`.

### Issue 4: TypeScript error on `t()`
**Solution:** The import is correct. If error persists, restart TypeScript server.

---

## ✅ Completion Criteria

- [x] Added `useTranslation` hook to AuthenticatedLayout
- [x] Replaced all hardcoded menu item names with `t()` calls
- [x] Verified all translation keys exist in JSON files
- [x] Built successfully without errors
- [x] Tested language switching (EN ↔ AZ)
- [x] No console errors or warnings
- [x] Updated PROGRESS_TRACKER.md

---

## 📊 Impact

**Files Changed:** 1
**Lines Modified:** ~500 lines
**Translation Keys Added:** ~50 keys
**User-Facing Impact:** 🔴 High - Navigation is the most visible part of the UI

---

## 🚀 Next Steps

After completing this batch:
1. Mark as completed in `PROGRESS_TRACKER.md`
2. Commit changes with message: "feat(i18n): translate navigation menu"
3. Move to **BATCH 2: Common Components**

---

**Questions or Issues?** Document them in the progress tracker and proceed to the next batch.
