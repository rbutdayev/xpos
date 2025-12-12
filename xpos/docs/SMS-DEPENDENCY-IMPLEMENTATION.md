# SMS Dependency Implementation for Online Shop

## Overview

The Online Shop module now has proper SMS dependency handling with conditional requirements:

- ✅ **E-commerce shop**: Requires SMS configuration (for customer order notifications)
- ✅ **Delivery platforms** (Wolt/Yango/Bolt): Do NOT require SMS (they have built-in notification systems)

---

## Implementation Details

### 1. SMS Module Added to Registry

**File:** `/resources/js/config/modules.ts`

```typescript
sms: {
    id: 'sms',
    name: 'SMS Integration',
    nameAz: 'SMS İnteqrasiyası',
    description: 'Müştərilərə SMS bildirişləri göndərmə',
    icon: ChatBubbleLeftRightIcon,
    // No flagKey - SMS is checked via hasSmsConfigured() method
    routes: ['/integrations/sms', '/sms/logs', '/sms/send'],
    permissions: ['manage-integrations'],
    requiredRoles: ['admin', 'account_owner'],
    category: 'customer',
}
```

### 2. Shop Module Dependency

**File:** `/resources/js/config/modules.ts`

```typescript
shop: {
    id: 'shop',
    flagKey: 'shop_enabled',
    dependencies: ['sms'], // ← Required for e-commerce notifications
    requiredRoles: ['admin', 'account_owner', 'sales_staff', 'branch_manager', 'accountant'],
}
```

### 3. Backend - SMS Status Shared via Inertia

**File:** `/app/Http/Middleware/HandleInertiaRequests.php`

```php
return [
    // ... other props
    'smsConfigured' => $user && $user->account
        ? $user->account->hasSmsConfigured()
        : false,
];
```

**Account Model Method:**

```php
public function hasSmsConfigured(): bool
{
    return SmsCredential::where('account_id', $this->id)
        ->where('is_active', true)
        ->exists();
}
```

### 4. Frontend - Module Access Logic

**File:** `/resources/js/Hooks/useModuleAccess.ts`

```typescript
// Special handling for SMS module (no database flag)
if (moduleId === 'sms') {
    return flags.smsConfigured === true;
}

// For modules with flagKey
if (!module.flagKey) {
    return false;
}
```

---

## How It Works

### Scenario 1: E-commerce Shop

```
User wants to enable Online Shop
  ↓
System checks: shop_enabled = true AND sms dependency met
  ↓
Check SMS: hasSmsConfigured() returns true/false
  ↓
If SMS configured: ✅ Show "Online Mağaza" menu
If SMS NOT configured: ❌ Hide menu (dependency not met)
```

### Scenario 2: Delivery Platform Orders

```
Wolt/Yango/Bolt order received
  ↓
WebhookController creates Sale (source = 'wolt')
  ↓
Notification sent via:
  - Platform's own system (primary)
  - SMS (if configured, but NOT required)
  - Telegram (if configured)
  - Email (fallback)
```

---

## Checking SMS Configuration

### Via Code:

```php
$account = Auth::user()->account;

// Check if SMS is configured
$hasSms = $account->hasSmsConfigured();

// Check if shop can be enabled
$canEnableShop = $account->shop_enabled && $hasSms;
```

### Via Tinker:

```bash
php artisan tinker
```

```php
$account = \App\Models\Account::first();
echo $account->hasSmsConfigured() ? 'SMS Configured' : 'SMS NOT Configured';
```

### Via Browser Console:

```javascript
console.log('SMS Configured:', window.___inertia?.props?.smsConfigured);
console.log('Shop Enabled:', window.___inertia?.props?.shopEnabled);
```

---

## Configuring SMS

### Step 1: Navigate to SMS Integration

Go to: **Settings → Integrations → SMS**
URL: `/integrations/sms`

### Step 2: Add SMS Credentials

Required fields:
- **Gateway URL**: SMS provider API endpoint
- **Login**: API username
- **Password**: API password (encrypted)
- **Sender Name**: Displayed as sender
- **Status**: Active

### Step 3: Verify Configuration

```php
php artisan tinker
```

```php
$credential = \App\Models\SmsCredential::where('account_id', 1)->first();
echo "Gateway: " . $credential->gateway_url . "\n";
echo "Login: " . $credential->login . "\n";
echo "Sender: " . $credential->sender_name . "\n";
echo "Active: " . ($credential->is_active ? 'Yes' : 'No') . "\n";
```

---

## Menu Visibility Logic

The "Online Mağaza" menu appears when **ALL** conditions are met:

1. ✅ User role is allowed: `admin`, `account_owner`, `sales_staff`, `branch_manager`, or `accountant`
2. ✅ Shop module enabled: `shop_enabled = true` in accounts table
3. ✅ SMS configured: Active SmsCredential record exists
4. ✅ Frontend built: `npm run build` completed

---

## Troubleshooting

### Problem: Menu not showing

**Check 1: User role**
```bash
php artisan tinker --execute="echo 'Role: ' . \App\Models\User::first()->role;"
```

**Check 2: Shop enabled**
```bash
php artisan tinker --execute="echo 'Shop: ' . (\App\Models\Account::first()->shop_enabled ? 'YES' : 'NO');"
```

**Check 3: SMS configured**
```bash
php artisan tinker --execute="echo 'SMS: ' . (\App\Models\Account::first()->hasSmsConfigured() ? 'YES' : 'NO');"
```

**Check 4: Frontend props**
- Open browser console (F12)
- Run: `console.log(window.___inertia.props)`
- Verify: `smsConfigured: true` and `shopEnabled: true`

### Problem: "Module 'sms' not found in registry"

This error means the frontend wasn't rebuilt after adding the SMS module.

**Solution:**
```bash
npm run build
# Hard refresh browser (Cmd+Shift+R)
```

### Problem: SMS configured but menu still hidden

**Possible causes:**
1. Browser cache - hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
2. Old build - run `npm run build` again
3. Laravel cache - run `php artisan cache:clear`
4. Session issue - log out and log back in

---

## For Developers

### Adding New Dependencies

If you need to add more dependencies to modules:

1. **Add the dependency module** to `modules.ts`:
```typescript
telegram: {
    id: 'telegram',
    name: 'Telegram Integration',
    // ... config
}
```

2. **Share the status** via Inertia (`HandleInertiaRequests.php`):
```php
'telegramConfigured' => $user && $user->account
    ? $user->account->hasTelegramConfigured()
    : false,
```

3. **Update useModuleAccess** hook for special handling:
```typescript
if (moduleId === 'telegram') {
    return flags.telegramConfigured === true;
}
```

4. **Add dependency** to dependent module:
```typescript
shop: {
    dependencies: ['sms', 'telegram'], // Multiple dependencies
}
```

### Dependency Check Logic

The `canAccessModule()` function in `useModuleAccess.ts`:

```typescript
// 1. Check if module is enabled
if (!isModuleEnabled(moduleId)) return false;

// 2. Check user role
if (!module.requiredRoles.includes(user.role)) return false;

// 3. Check dependencies (recursive)
if (module.dependencies) {
    const allDepsAccessible = module.dependencies.every(depId =>
        canAccessModule(depId) // ← Recursive check
    );
    if (!allDepsAccessible) return false;
}

return true;
```

---

## Summary

✅ **SMS module** properly registered in modules.ts
✅ **Shop module** requires SMS via `dependencies: ['sms']`
✅ **Backend** shares SMS status via `smsConfigured` prop
✅ **Frontend** checks SMS via `hasSmsConfigured()` method
✅ **Conditional logic** allows platforms (Wolt/Yango/Bolt) without SMS
✅ **Menu visibility** controlled by dependency chain

The system now correctly enforces SMS configuration for e-commerce while allowing delivery platforms to work independently!
