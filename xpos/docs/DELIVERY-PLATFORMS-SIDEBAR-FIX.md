# Delivery Platforms - Sidebar Menu Fix

## Issue

After enabling Wolt/Yango/Bolt delivery platforms from the integrations page, the "Online Shop" menu was not appearing in the sidebar navigation.

## Root Cause

The sidebar menu visibility logic was checking ONLY for `shop_enabled` (e-commerce flag) but not for delivery platform flags (`wolt_enabled`, `yango_enabled`, `bolt_enabled`).

The delivery platforms have separate database flags from the e-commerce shop:
- **E-commerce Shop**: `shop_enabled` (requires SMS)
- **Delivery Platforms**: `wolt_enabled`, `yango_enabled`, `bolt_enabled` (do NOT require SMS)

## Solution

Updated the system to show "Online Shop" menu when EITHER e-commerce OR any delivery platform is enabled.

### Files Changed

#### 1. Backend - Global Props (`app/Http/Middleware/HandleInertiaRequests.php`)

**Added platform flags to shared props:**
```php
'woltEnabled' => $user && $user->account ? ($user->account->wolt_enabled ?? false) : false,
'yangoEnabled' => $user && $user->account ? ($user->account->yango_enabled ?? false) : false,
'boltEnabled' => $user && $user->account ? ($user->account->bolt_enabled ?? false) : false,
```

These props are now available globally in all frontend pages via Inertia.

---

#### 2. Frontend - Type Definitions (`resources/js/types/index.d.ts`)

**Added platform flags to PageProps:**
```typescript
export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: { user: User };
    shopEnabled?: boolean;
    // ... other flags
    woltEnabled?: boolean;
    yangoEnabled?: boolean;
    boltEnabled?: boolean;
    smsConfigured?: boolean;
    // ...
};
```

---

#### 3. Frontend - Module Access Hook (`resources/js/Hooks/useModuleAccess.ts`)

**Updated ModuleFlags interface:**
```typescript
interface ModuleFlags {
    shopEnabled?: boolean;
    loyaltyEnabled?: boolean;
    servicesEnabled?: boolean;
    rentEnabled?: boolean;
    discountsEnabled?: boolean;
    smsConfigured?: boolean;
    woltEnabled?: boolean;    // ← NEW
    yangoEnabled?: boolean;   // ← NEW
    boltEnabled?: boolean;    // ← NEW
}
```

**Updated hook to read platform flags:**
```typescript
const flags: ModuleFlags = {
    shopEnabled: page.props.shopEnabled as boolean | undefined,
    // ... other flags
    woltEnabled: page.props.woltEnabled as boolean | undefined,
    yangoEnabled: page.props.yangoEnabled as boolean | undefined,
    boltEnabled: page.props.boltEnabled as boolean | undefined,
};
```

**Added new helper function:**
```typescript
/**
 * Check if any online ordering is enabled (shop OR delivery platforms)
 */
const hasAnyOnlineOrdering = (): boolean => {
    // Check if e-commerce shop is enabled with SMS
    const shopAccessible = canAccessModule('shop');

    // Check if any delivery platform is enabled
    const anyPlatformEnabled = !!(flags.woltEnabled || flags.yangoEnabled || flags.boltEnabled);

    // User must have proper role to see online orders
    const hasProperRole = ['admin', 'account_owner', 'sales_staff', 'branch_manager', 'accountant'].includes(user.role);

    return (shopAccessible || anyPlatformEnabled) && hasProperRole;
};
```

**Updated return type:**
```typescript
interface UseModuleAccessReturn {
    // ... existing methods
    hasAnyOnlineOrdering: () => boolean;  // ← NEW
    flags: ModuleFlags;
}
```

---

#### 4. Frontend - Sidebar Layout (`resources/js/Layouts/AuthenticatedLayout.tsx`)

**Updated sidebar logic:**

Before:
```typescript
const { canAccessModule } = useModuleAccess();
// ...
...(canAccessModule('shop') ? [{ /* Online Shop menu */ }] : [])
```

After:
```typescript
const { canAccessModule, hasAnyOnlineOrdering } = useModuleAccess();
// ...
...(hasAnyOnlineOrdering() ? [{ /* Online Shop menu */ }] : [])
```

**Changed in multiple places:**
- Sales staff navigation
- Accountant navigation
- Admin navigation
- Initial open menus logic

---

## How It Works Now

### E-commerce Shop Only
```
shop_enabled = true
SMS configured = true
wolt_enabled = false
→ Shows "Online Shop" menu ✅
```

### Delivery Platform Only
```
shop_enabled = false
wolt_enabled = true
→ Shows "Online Shop" menu ✅
```

### Both E-commerce and Platforms
```
shop_enabled = true
SMS configured = true
wolt_enabled = true
→ Shows "Online Shop" menu ✅
```

### Neither Enabled
```
shop_enabled = false
wolt_enabled = false
→ Hides "Online Shop" menu ❌
```

---

## Testing

### Test Case 1: Enable Wolt Only
1. Go to `/integrations`
2. Enable Wolt delivery platform
3. Check sidebar - "Online Shop" menu should appear ✅
4. Visit `/online-orders` - should see Wolt orders

### Test Case 2: Enable E-commerce Only
1. Configure SMS
2. Enable shop module
3. Check sidebar - "Online Shop" menu should appear ✅
4. Visit `/online-orders` - should see e-commerce orders

### Test Case 3: Disable Both
1. Disable shop and all delivery platforms
2. Check sidebar - "Online Shop" menu should NOT appear ❌

---

## Related Documentation

- Main implementation: `/docs/DELIVERY-PLATFORMS-COMPLETE-SUMMARY.md`
- Integration page changes: `/docs/INTEGRATIONS-PAGE-DELIVERY-PLATFORMS.md`
- SMS dependency logic: `/docs/SMS-DEPENDENCY-IMPLEMENTATION.md`

---

## Summary

✅ Fixed sidebar menu visibility logic
✅ Added platform flags to global props
✅ Created `hasAnyOnlineOrdering()` helper function
✅ Updated TypeScript types
✅ Frontend builds successfully
✅ Users can now see "Online Shop" menu when delivery platforms are enabled, even without e-commerce shop

**Date**: December 12, 2025
**Branch**: develop
**Status**: Complete and tested
