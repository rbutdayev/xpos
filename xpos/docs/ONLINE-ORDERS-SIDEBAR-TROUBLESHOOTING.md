# Online Orders Sidebar Menu - Troubleshooting Guide

## Issue: "Online Shop" menu not appearing in sidebar

### What Should Appear:

When the shop module is enabled, you should see this in the sidebar:

```
📦 Online Mağaza / Online Shop
   ├─ 🛍️ Online Sifarişlər / Online Orders
   └─ ⚙️ Mağaza Parametrləri / Shop Settings
```

### Requirements for Menu to Show:

The menu only appears when **ALL** these conditions are met:

1. ✅ **Module enabled**: `account.shop_enabled = true`
2. ✅ **User role**: Must be one of: `admin`, `account_owner`, `sales_staff`, `branch_manager`, `accountant`
3. ✅ **Frontend built**: Assets compiled with `npm run build` or `npm run dev`
4. ✅ **Browser cache cleared**: Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

---

## Debugging Steps

### Step 1: Verify Shop Module is Enabled

```bash
cd /Users/ruslan/projects/xpos/xpos
php artisan tinker
```

Then run:
```php
$account = \App\Models\Account::first();
echo "Shop enabled: " . ($account->shop_enabled ? 'YES' : 'NO') . "\n";
echo "Shop slug: " . ($account->shop_slug ?? 'NOT SET') . "\n";
```

**Expected output:**
```
Shop enabled: YES
Shop slug: your-shop-slug
```

**If shop_enabled is NO:**
```php
$account = \App\Models\Account::first();
$account->shop_enabled = true;
$account->shop_slug = 'test-shop'; // or your preferred slug
$account->save();
echo "Shop enabled successfully!";
```

### Step 2: Verify User Role

```php
$user = \App\Models\User::first();
echo "User role: " . $user->role . "\n";
echo "Account ID: " . $user->account_id . "\n";
```

**Expected output:**
```
User role: account_owner (or admin, sales_staff, branch_manager, accountant)
Account ID: 1
```

**Allowed roles:**
- `account_owner` ✅
- `admin` ✅
- `sales_staff` ✅
- `branch_manager` ✅
- `accountant` ✅
- `warehouse_manager` ❌
- `warehouse_admin` ❌
- `tailor` ❌

### Step 3: Check Frontend Inertia Props

Open browser DevTools (F12), go to Console, and run:

```javascript
console.log('Shop Enabled:', window.___inertia?.props?.shopEnabled);
console.log('User Role:', window.___inertia?.props?.auth?.user?.role);
```

**Expected output:**
```
Shop Enabled: true
User Role: account_owner
```

**If shopEnabled is undefined or false:**
- Check HandleInertiaRequests.php line 59
- Verify user->account relationship is loaded
- Restart Laravel server: `php artisan serve` or restart Docker

### Step 4: Rebuild Frontend Assets

```bash
# Development mode (with hot reload)
npm run dev

# OR Production build
npm run build
```

**Wait for build to complete**, then:
1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)
2. Clear browser cache completely
3. Close and reopen browser

### Step 5: Check Browser Console for Errors

Open DevTools Console and look for errors like:

- `❌ Module "shop" not found in registry`
- `❌ Translation key not found: navigation.online_shop`
- `❌ canAccessModule is not a function`

**If you see translation errors:**
Check these files exist:
- `/resources/js/i18n/locales/en/common.json` (line 114-116)
- `/resources/js/i18n/locales/az/common.json` (line 114-116)

Should contain:
```json
"online_shop": "Online Shop",
"online_orders_list": "Online Orders",
"shop_settings": "Shop Settings"
```

### Step 6: Verify Module Configuration

Check `/resources/js/config/modules.ts`:

```typescript
shop: {
    id: 'shop',
    name: 'Online Shop',
    nameAz: 'Online Mağaza',
    flagKey: 'shop_enabled',
    routes: [
        '/online-orders',
        '/shop/settings'
    ],
    requiredRoles: ['admin', 'account_owner', 'sales_staff', 'branch_manager', 'accountant'],
    category: 'sales',
}
```

### Step 7: Check useModuleAccess Hook

In browser console:

```javascript
// Get all modules
console.log('All modules:', window.MODULES);

// Check if canAccessModule function works
// (You'll need to be on a page that uses it)
```

---

## Common Issues & Solutions

### Issue 1: Menu not showing after enabling shop module

**Solution:**
1. Log out and log back in
2. Clear Laravel cache: `php artisan cache:clear`
3. Rebuild frontend: `npm run build`
4. Hard refresh browser

### Issue 2: Translation keys showing instead of text

**Problem:** Shows `navigation.online_shop` instead of "Online Shop"

**Solution:**
1. Check translation files exist (see Step 5)
2. Rebuild with `npm run build`
3. Check i18n is properly initialized in app.tsx

### Issue 3: Menu shows for wrong roles

**Problem:** Warehouse manager sees menu (shouldn't) or Accountant doesn't see it (should)

**Solution:**
1. Check `/resources/js/config/modules.ts` requiredRoles
2. Verify user role in database: `SELECT role FROM users WHERE id = 1;`
3. Rebuild frontend

### Issue 4: shopEnabled is false even though database is true

**Problem:** HandleInertiaRequests.php not sharing the prop correctly

**Solution:**
1. Check `/app/Http/Middleware/HandleInertiaRequests.php` line 59
2. Verify user has account relationship: `User::with('account')->first()`
3. Restart Laravel: `php artisan serve` or restart Docker

### Issue 5: Different menus for different roles

This is **intentional** behavior:

- **Admin/Account Owner**: See "Shop Settings" option
- **Sales Staff**: See "Shop Settings" option
- **Branch Manager**: See only "Online Orders" (no settings)
- **Accountant**: See only "Online Orders" (no settings)

Check AuthenticatedLayout.tsx:
- Lines 327-344: Sales staff (has settings)
- Lines 375-386: Accountant (no settings)
- Lines 552-563: Branch manager (no settings)
- Lines 744-761: Admin/Owner (has settings)

---

## Quick Verification Script

Run this complete check:

```php
php artisan tinker
```

```php
$account = \App\Models\Account::first();
$user = \App\Models\User::first();

echo "=== Account Check ===\n";
echo "Shop Enabled: " . ($account->shop_enabled ? 'YES' : 'NO') . "\n";
echo "Shop Slug: " . ($account->shop_slug ?? 'NOT SET') . "\n\n";

echo "=== User Check ===\n";
echo "User Role: " . $user->role . "\n";
echo "Account ID: " . $user->account_id . "\n";
echo "Account Active: " . ($user->account->is_active ? 'YES' : 'NO') . "\n\n";

echo "=== Access Check ===\n";
$allowedRoles = ['admin', 'account_owner', 'sales_staff', 'branch_manager', 'accountant'];
$hasAccess = in_array($user->role, $allowedRoles);
echo "Should see menu: " . ($hasAccess && $account->shop_enabled ? 'YES ✅' : 'NO ❌') . "\n";

if (!$hasAccess || !$account->shop_enabled) {
    echo "\n=== Issues Found ===\n";
    if (!$account->shop_enabled) {
        echo "- Shop module is NOT enabled. Enable it with:\n";
        echo "  \$account->shop_enabled = true; \$account->save();\n";
    }
    if (!$hasAccess) {
        echo "- User role '" . $user->role . "' is NOT allowed.\n";
        echo "  Allowed roles: " . implode(', ', $allowedRoles) . "\n";
    }
}
```

---

## Expected Result

After following these steps, you should see:

**Sidebar Navigation:**
```
📊 Dashboard
🛒 POS Sales
💻 Touch POS
🛍️ Sales & Customers
📦 Products
🏪 Warehouse Management
🔧 Services (if enabled)
⏰ Rental Management (if enabled)
📦 Online Mağaza ← THIS SHOULD APPEAR
   ├─ Online Sifarişlər
   └─ Mağaza Parametrləri
💰 Finance & Reports
⚙️ Settings
```

---

## Still Not Working?

If the menu still doesn't appear after all these steps:

1. **Check console logs:**
   ```bash
   tail -f storage/logs/laravel.log
   ```

2. **Enable React DevTools:**
   - Install React DevTools browser extension
   - Check component tree for AuthenticatedLayout
   - Verify canAccessModule('shop') returns true

3. **Debug in AuthenticatedLayout.tsx:**

   Add this temporarily around line 744:
   ```typescript
   {(() => {
       const canAccess = canAccessModule('shop');
       console.log('Can access shop module:', canAccess);
       console.log('Shop enabled prop:', page.props.shopEnabled);
       console.log('User role:', user.role);
       return canAccess ? [{
           name: t('navigation.online_shop'),
           // ... rest of menu
       }] : [];
   })()}
   ```

4. **Contact support** with:
   - Laravel version: `php artisan --version`
   - Node version: `node --version`
   - Browser console screenshot
   - Output of verification script above

---

## Summary

The "Online Shop" menu is controlled by:

1. **Backend:** `shop_enabled` flag in accounts table
2. **Backend:** User role must be in allowed list
3. **Backend:** HandleInertiaRequests shares shopEnabled prop
4. **Frontend:** modules.ts defines requiredRoles
5. **Frontend:** useModuleAccess hook checks access
6. **Frontend:** AuthenticatedLayout renders menu conditionally

All pieces must be in place for the menu to appear!
