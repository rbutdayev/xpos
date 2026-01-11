# Adding New Modules to xPOS

This guide explains how to add a new module to the xPOS system with proper integration, billing, and permissions.

## Overview

The xPOS system uses a modular architecture where features can be enabled/disabled per account. Each module can be:
- **Free** or **Paid** (with monthly billing)
- **Configured** (requires setup) or **Simple** (just toggle on/off)
- **Role-restricted** (e.g., only account_owner can access)

---

## Step 1: Database Migration

Add a boolean field to the `accounts` table for the module enable/disable flag.

```bash
php artisan make:migration add_YOUR_MODULE_enabled_to_accounts_table
```

**Migration content:**
```php
public function up(): void
{
    Schema::table('accounts', function (Blueprint $table) {
        $table->boolean('your_module_enabled')->default(false)->after('previous_field');
    });
}

public function down(): void
{
    Schema::table('accounts', function (Blueprint $table) {
        $table->dropColumn('your_module_enabled');
    });
}
```

**Run migration:**
```bash
php artisan migrate
```

---

## Step 2: Module Pricing Configuration

Add your module to the centralized configuration file. The system will **automatically** sync this to the database.

### Add to config/modules.php

Add your module to the `modules` array in `config/modules.php`:

```php
'modules' => [
    // ... existing modules
    'your_module' => [
        'name' => 'Your Module Name',           // Display name (Azerbaijani)
        'default_price' => 20.00,               // Monthly price in AZN (0.00 for free)
        'description' => 'Brief description',   // Module description
        'field' => 'your_module_enabled',       // Corresponding field in accounts table
    ],
],
```

**That's it!** No need to run seeders - the pricing will be auto-synced when a super admin visits the Module Pricing page.

---

## Step 3: Backend Integration

### 3.1 Add to UnifiedSettingsController

**File:** `app/Http/Controllers/UnifiedSettingsController.php`

Add to `$moduleFields` map (~line 323):
```php
$moduleFields = [
    // ... existing modules
    'your_module' => 'your_module_enabled',
];
```

### 3.2 Add to IntegrationsController

**File:** `app/Http/Controllers/IntegrationsController.php`

**In `index()` method (~line 54):**
```php
// Check Your Module
$yourModuleEnabled = (bool) ($account->your_module_enabled ?? false);
```

**Add to return array (~line 108):**
```php
return Inertia::render('Integrations/Index', [
    // ... existing props
    'yourModuleEnabled' => $yourModuleEnabled,
]);
```

**In `bulkDisable()` method (~line 195):**
```php
$fieldMap = [
    // ... existing modules
    'your_module' => 'your_module_enabled',
];
```

**In `bulkActivate()` method (~line 257):**
```php
$fieldMap = [
    // ... existing modules
    'your_module' => 'your_module_enabled',
];
```

### 3.3 Add to ModuleBillingService (If Paid)

**File:** `app/Services/ModuleBillingService.php`

Add to `$moduleFields` in `getAccountBillingBreakdown()` (~line 123):
```php
$moduleFields = [
    // ... existing modules
    'your_module' => 'your_module_enabled',
];
```

### 3.4 Global Props (HandleInertiaRequests)

**File:** `app/Http/Middleware/HandleInertiaRequests.php`

Add to `share()` method (~line 65):
```php
return [
    // ... existing props
    'yourModuleEnabled' => $user && $user->account
        ? (bool) ($user->account->your_module_enabled ?? false)
        : false,
];
```

---

## Step 4: Frontend Integration

### 4.1 Add to Integrations Page

**File:** `resources/js/Pages/Integrations/Index.tsx`

**Add TypeScript interface (~line 54):**
```typescript
interface IntegrationsProps extends PageProps {
    // ... existing props
    yourModuleEnabled: boolean;
}
```

**Destructure prop (~line 87):**
```typescript
export default function Index({
    // ... existing props
    yourModuleEnabled,
}: IntegrationsProps) {
```

**Add to integrations array (~line 160):**
```typescript
const integrations: Integration[] = [
    // ... existing modules
    {
        id: 'your_module',
        name: 'Your Module Name',
        description: 'Brief description of what this module does',
        icon: YourIcon, // Import from @heroicons/react/24/outline
        category: 'business', // or 'communication', 'fiscal', 'loyalty', etc.
        status: yourModuleEnabled ? 'active' : 'inactive',
        route: '/your-module', // Route to module settings/main page
        color: 'blue', // Color theme
        features: [
            'Feature 1',
            'Feature 2',
            'Feature 3',
            'Feature 4'
        ],
        isSimpleToggle: true,
        requiresConfiguration: yourModuleEnabled && !yourModuleConfigured, // If config needed
        requiresOwner: false, // Set true if only account_owner can access
    },
];
```

### 4.2 Module Access Hook

**File:** `resources/js/Hooks/useModuleAccess.ts`

**Add to ModuleFlags interface (~line 18):**
```typescript
interface ModuleFlags {
    // ... existing flags
    yourModuleEnabled?: boolean;
}
```

**Add to flags object (~line 82):**
```typescript
const flags: ModuleFlags = {
    // ... existing flags
    yourModuleEnabled: page.props.yourModuleEnabled as boolean | undefined,
};
```

**Add to isModuleEnabled function if needed (~line 107):**
```typescript
// Special case for your module if custom logic needed
if (moduleId === 'your_module') {
    return flags.yourModuleEnabled === true;
}
```

**Add to flagMap (~line 114):**
```typescript
const flagMap: Record<string, boolean | undefined> = {
    // ... existing flags
    your_module_enabled: flags.yourModuleEnabled,
};
```

### 4.3 Add Navigation Link (If Needed)

If your module needs a menu link, add to appropriate navigation component:

**Example - Sales Navigation:**
**File:** `resources/js/Components/Navigation/SalesTopbar.tsx`

```typescript
const navItems = [
    // ... existing items
    ...(canAccessModule('your_module') ? [{
        href: route('your-module.index'),
        icon: YourIcon,
        label: t('navigation.your_module'),
        isActive: isActive('your-module')
    }] : []),
];
```

---

## Step 5: Routes & Controller

### 5.1 Create Controller

```bash
php artisan make:controller YourModuleController
```

**Add module check in constructor:**
```php
public function __construct()
{
    $this->middleware(function ($request, $next) {
        $user = Auth::user();
        $account = $user->account ?? null;

        // Check if module is enabled
        if (!$account || !$account->your_module_enabled) {
            abort(403, 'Your Module aktiv deyil. Əvvəlcə modulu aktivləşdirin.');
        }

        return $next($request);
    });
}
```

### 5.2 Add Routes

**File:** `routes/web.php`

```php
// Your Module Routes
Route::prefix('your-module')->name('your-module.')->group(function () {
    Route::get('/', [YourModuleController::class, 'index'])->name('index');
    Route::get('/create', [YourModuleController::class, 'create'])->name('create');
    Route::post('/', [YourModuleController::class, 'store'])->name('store');
    Route::get('/{id}', [YourModuleController::class, 'show'])->name('show');
    Route::get('/{id}/edit', [YourModuleController::class, 'edit'])->name('edit');
    Route::put('/{id}', [YourModuleController::class, 'update'])->name('update');
    Route::delete('/{id}', [YourModuleController::class, 'destroy'])->name('destroy');
});
```

---

## Step 6: Permissions & Gates

Add authorization gates if needed:

**File:** `app/Providers/AuthorizationServiceProvider.php`

```php
// Your module access
Gate::define('manage-your-module', function ($user) {
    return in_array($user->role, ['account_owner', 'admin', 'branch_manager']);
});
```

**Use in controller:**
```php
public function index()
{
    Gate::authorize('manage-your-module');
    // ... rest of code
}
```

---

## Step 7: Super Admin Configuration

### 7.1 Module Pricing Management

Super admins can manage module pricing at:
- **Route:** `/super-admin/module-pricing`
- **Controller:** `SuperAdmin\ModulePricingController`

They can:
- Set module price
- Enable/disable module for all accounts
- View pricing history

### 7.2 Module Usage History

Track which accounts enabled/disabled modules:
- **Route:** `/super-admin/module-history`
- **Table:** `module_usage_history`

---

## Step 8: Translations (Optional)

Add translations for UI labels:

**Files:**
- `public/locales/en/modules.json`
- `public/locales/az/modules.json`

```json
{
  "your_module": {
    "name": "Your Module Name",
    "description": "Module description",
    "features": {
      "feature1": "Feature 1",
      "feature2": "Feature 2"
    }
  }
}
```

---

## Important Considerations

### ✅ Multi-tenancy
- **ALWAYS** filter by `account_id` in database queries
- Use `where('account_id', auth()->user()->account_id)` or `byAccount()` scope

### ✅ First Month Free
- Paid modules are FREE for the first month
- Billing starts from the next month
- No prorated charges on activation

### ✅ Configuration vs Enabled
- `your_module_enabled` = Module is turned on (in accounts table)
- `your_module_configured` = Module has settings saved (separate table/check)
- Show "Quraşdırılmayıb" badge ONLY when enabled but not configured

### ✅ Status Display Rules
- **Inactive + Not Configured:** Show only "Quraşdır" button
- **Inactive + Configured:** Show only "Aktiv et" button
- **Active + Not Configured:** Show "Quraşdır" + "Deaktiv et" buttons
- **Active + Configured:** Show "Bax", "Parametrlər", "Deaktiv et" buttons

### ✅ Route Protection
- Add middleware to check `your_module_enabled` before allowing access
- Return 403 error if module is disabled
- Hide navigation links when module is disabled

---

## Testing Checklist

- [ ] Module appears in Integrations page
- [ ] Can enable/disable module with confirmation modal
- [ ] First month shows as FREE (0 ₼)
- [ ] Module price shows correctly in billing
- [ ] Navigation link appears only when enabled
- [ ] Routes return 403 when module is disabled
- [ ] "Quraşdırılmayıb" badge shows correctly
- [ ] Double-click blocked on inactive modules
- [ ] Bulk operations work (enable/disable multiple)
- [ ] Module usage tracked in `module_usage_history`
- [ ] Super admin can manage pricing
- [ ] Multi-tenancy enforced (account_id filtering)

---

## Example: Complete Module Addition

See existing modules as reference:
- **Simple Module:** `services`, `rent`, `discounts`
- **Configured Module:** `sms`, `telegram`, `loyalty`, `fiscal-printer`
- **E-commerce Module:** `shop`

---

## Need Help?

Check these files for complete implementation examples:
- Controllers: `IntegrationsController.php`, `SmsController.php`
- Services: `ModuleBillingService.php`
- Frontend: `resources/js/Pages/Integrations/Index.tsx`
- Hooks: `resources/js/Hooks/useModuleAccess.ts`

---

**Last Updated:** January 2026
**Version:** 1.0
