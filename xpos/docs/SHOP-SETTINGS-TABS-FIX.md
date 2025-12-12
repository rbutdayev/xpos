# Shop Settings - Tabbed Interface & SMS Validation

## Issues Fixed

### Issue 1: E-commerce Shop Toggle Can Be Enabled Without SMS

**Problem**: Users could enable the e-commerce shop even when SMS service was not configured, which violates the dependency requirement.

**Solution**: Added backend and frontend validation to prevent enabling the shop without SMS configuration.

---

### Issue 2: No Separation Between E-commerce and Delivery Platforms

**Problem**: Shop settings page showed all settings in one view. User requested separate tabs for E-commerce, Wolt, Yango, and Bolt, showing only tabs for enabled platforms.

**Solution**: Implemented tabbed interface that dynamically shows tabs based on what's enabled.

---

## Changes Made

### 1. Backend - SMS Validation

#### `app/Http/Controllers/ShopSettingsController.php`

**Added SMS check when enabling shop:**
```php
// If enabling shop, require SMS configuration first
if ($request->shop_enabled) {
    $smsConfigured = SmsCredential::where('account_id', $accountId)
        ->where('is_active', true)
        ->exists();

    if (!$smsConfigured) {
        return back()->withErrors([
            'shop_enabled' => __('errors.shop_requires_sms')
        ]);
    }
    // ... rest of validation
}
```

**Added platform statuses to view:**
```php
// Get platform statuses
$platformStatuses = [
    'wolt_enabled' => $account->wolt_enabled ?? false,
    'yango_enabled' => $account->yango_enabled ?? false,
    'bolt_enabled' => $account->bolt_enabled ?? false,
];

return Inertia::render('Shop/Settings', [
    // ... existing props
    'platform_statuses' => $platformStatuses,
]);
```

---

### 2. Translation Keys

#### `lang/az/errors.php`
```php
'shop_requires_sms' => 'Online mağazanı aktivləşdirmək üçün əvvəlcə SMS xidmətini konfiqurasiya etməlisiniz',
```

#### `lang/en/errors.php`
```php
'shop_requires_sms' => 'You must configure SMS service first before enabling the online shop',
```

---

### 3. Frontend - Tabbed Interface

#### `resources/js/Pages/Shop/Settings.tsx`

**Completely redesigned with tabs:**

1. **Tab Definition** - Dynamically creates tabs based on enabled platforms:
```typescript
const availableTabs = [
    {
        id: 'ecommerce' as TabType,
        label: 'E-commerce',
        icon: ShoppingBagIcon,
        enabled: true // Always show e-commerce tab
    },
    {
        id: 'wolt' as TabType,
        label: 'Wolt',
        icon: TruckIcon,
        enabled: platform_statuses.wolt_enabled
    },
    {
        id: 'yango' as TabType,
        label: 'Yango',
        icon: TruckIcon,
        enabled: platform_statuses.yango_enabled
    },
    {
        id: 'bolt' as TabType,
        label: 'Bolt Food',
        icon: TruckIcon,
        enabled: platform_statuses.bolt_enabled
    },
].filter(tab => tab.enabled);
```

2. **Tab Navigation** - Renders tabs with active state:
```typescript
<nav className="-mb-px flex space-x-8">
    {availableTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={/* dynamic classes based on isActive */}
            >
                <Icon className={/* icon styles */} />
                {tab.label}
            </button>
        );
    })}
</nav>
```

3. **Tab Content** - Shows content based on active tab:
```typescript
{/* E-commerce Tab */}
{activeTab === 'ecommerce' && (
    <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shop Status Card */}
        {/* Shop Configuration Card */}
        {/* Notification Settings Card */}
    </form>
)}

{/* Platform Tabs */}
{activeTab === 'wolt' && (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-12">
            <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Wolt Settings
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Wolt platform settings will be available here soon.
            </p>
        </div>
    </div>
)}
```

4. **SMS Warning & Disabled Checkbox:**
```typescript
{!sms_configured && (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
        {/* Warning message with link to SMS settings */}
    </div>
)}
<Checkbox
    checked={data.shop_enabled}
    onChange={(e) => setData('shop_enabled', e.target.checked)}
    disabled={!sms_configured}  // ← Disabled when SMS not configured
/>
{errors.shop_enabled && (
    <p className="mt-2 text-sm text-red-600">{errors.shop_enabled}</p>
)}
```

---

## How It Works Now

### E-commerce Tab (Always Visible)
- Shows e-commerce shop settings
- Toggle is **disabled** if SMS not configured
- Warning message appears when SMS not configured
- Backend validates SMS requirement

### Platform Tabs (Conditional)
- **Wolt Tab**: Only shows if `wolt_enabled = true`
- **Yango Tab**: Only shows if `yango_enabled = true`
- **Bolt Tab**: Only shows if `bolt_enabled = true`
- Currently shows placeholder content
- Future: Will have platform-specific settings (API keys, warehouse, branch)

---

## User Experience

### Scenario 1: No SMS Configured
```
User visits /shop-settings
→ Only "E-commerce" tab visible
→ Warning appears: "SMS xidməti konfiqurasiya edilməyib"
→ Shop enable toggle is DISABLED
→ User clicks toggle anyway → Nothing happens (disabled)
→ User clicks "SMS Xidməti" link → Redirects to /integrations/sms
```

### Scenario 2: SMS Configured, No Platforms Enabled
```
User visits /shop-settings
→ Only "E-commerce" tab visible
→ No warning
→ Shop enable toggle is ENABLED
→ User can enable/configure e-commerce shop
```

### Scenario 3: SMS + Wolt + Bolt Enabled
```
User visits /shop-settings
→ 3 tabs visible: "E-commerce", "Wolt", "Bolt Food"
→ Yango tab NOT visible (not enabled)
→ User clicks "Wolt" tab → Shows Wolt placeholder
→ User clicks "Bolt Food" tab → Shows Bolt placeholder
→ User clicks "E-commerce" tab → Shows full e-commerce settings
```

---

## Tab Content (Future Implementation)

Each platform tab will eventually include:
- **API Credentials**: API key, restaurant ID
- **Warehouse Selection**: Which warehouse to deduct stock from
- **Branch Selection**: Which branch to assign orders to
- **Test Connection**: Button to verify API credentials
- **Order Notifications**: Platform-specific notification settings
- **Webhook URL**: Display webhook URL for platform configuration

---

## Database Fields Used

### E-commerce:
- `shop_enabled` - Toggle flag
- `shop_slug` - URL slug
- `shop_warehouse_id` - Default warehouse
- SMS configuration checked via `SmsCredential` model

### Platforms:
- `wolt_enabled`, `yango_enabled`, `bolt_enabled` - Toggle flags
- Future: `wolt_api_key`, `wolt_warehouse_id`, `wolt_branch_id`, etc.

---

## Testing

### Test Case 1: SMS Validation
1. Ensure SMS is NOT configured
2. Visit `/shop-settings`
3. Verify "Aktivləşdir" checkbox is disabled
4. Try to enable via form submission (if possible) → Should show error
5. Configure SMS at `/integrations/sms`
6. Return to `/shop-settings`
7. Checkbox should now be enabled ✅

### Test Case 2: Tab Visibility
1. Disable all delivery platforms
2. Visit `/shop-settings`
3. Only "E-commerce" tab should be visible ✅
4. Enable Wolt from `/integrations`
5. Refresh `/shop-settings`
6. Both "E-commerce" and "Wolt" tabs should be visible ✅

### Test Case 3: Tab Navigation
1. Visit `/shop-settings` with Wolt enabled
2. Click "Wolt" tab
3. Should see placeholder message ✅
4. Click "E-commerce" tab
5. Should see full e-commerce settings form ✅

---

## Files Changed

### Backend
- `app/Http/Controllers/ShopSettingsController.php`
- `lang/az/errors.php`
- `lang/en/errors.php`

### Frontend
- `resources/js/Pages/Shop/Settings.tsx` (complete rewrite)

---

## Summary

✅ **Issue #1 Fixed**: E-commerce shop cannot be enabled without SMS configuration
- Backend validation added
- Frontend checkbox disabled
- Error message shown
- Translation keys added

✅ **Issue #2 Fixed**: Tabbed interface with platform separation
- Dynamic tab rendering based on enabled platforms
- E-commerce tab always visible
- Platform tabs (Wolt/Yango/Bolt) only show when enabled
- Clean separation of concerns
- Placeholder content for future platform settings

**Frontend builds successfully** ✅
**Ready for testing** ✅

---

**Date**: December 12, 2025
**Branch**: develop
**Status**: Complete
