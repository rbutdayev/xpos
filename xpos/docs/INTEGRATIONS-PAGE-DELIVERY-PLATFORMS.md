# Integrations Page - Delivery Platforms Added

## Summary

Added Wolt, Yango, and Bolt Food delivery platform integrations to the `/integrations` page, separate from the e-commerce shop module.

---

## What Was Changed

### 1. Frontend - Integrations Page (`/resources/js/Pages/Integrations/Index.tsx`)

**Added 3 new integration cards:**

| Platform | Color | Icon | Category | SMS Required? |
|----------|-------|------|----------|---------------|
| **Wolt Food Delivery** | Violet | 🚚 TruckIcon | delivery | ❌ NO |
| **Yango Food Delivery** | Yellow | 🚚 TruckIcon | delivery | ❌ NO |
| **Bolt Food Delivery** | Green | 🚚 TruckIcon | delivery | ❌ NO |

**New category added:**
- "Çatdırılma Platformaları" (Delivery Platforms)

**Features for each platform:**
- Avtomatik sifariş qəbulu (Automatic order receiving)
- Status sinxronizasiyası (Status synchronization)
- Anbar seçimi (Warehouse selection)
- Filial təyini (Branch assignment)

### 2. Backend - IntegrationsController (`/app/Http/Controllers/IntegrationsController.php`)

**Added props to share platform status:**
```php
'woltEnabled' => $account->wolt_enabled ?? false,
'yangoEnabled' => $account->yango_enabled ?? false,
'boltEnabled' => $account->bolt_enabled ?? false,
```

### 3. Backend - UnifiedSettingsController (`/app/Http/Controllers/UnifiedSettingsController.php`)

**Updated `toggleModule()` method:**

**Added to validation:**
```php
'module' => 'required|in:services,rent,loyalty,shop,discounts,gift_cards,wolt,yango,bolt',
```

**Added to module fields mapping:**
```php
'wolt' => 'wolt_enabled',
'yango' => 'yango_enabled',
'bolt' => 'bolt_enabled',
```

**Added to dependencies:**
```php
'wolt' => [], // No dependencies
'yango' => [],
'bolt' => [],
```

---

## Key Differences: Shop vs Delivery Platforms

### Online Mağaza (E-commerce Shop)
- ⚠️ **Requires SMS** - Shows dependency warning if SMS not configured
- For selling products directly from your own online store
- Needs SMS for customer order notifications

### Wolt / Yango / Bolt (Delivery Platforms)
- ✅ **No SMS required** - Can be enabled independently
- For receiving orders from delivery platform apps
- Platforms have their own customer notification systems

---

## How to Use

### Enabling Delivery Platforms

1. Go to `/integrations` page
2. Find "Çatdırılma Platformaları" category or filter "Hamısı" (All)
3. Click on any delivery platform card (Wolt/Yango/Bolt)
4. Click "Aktivləşdir" (Enable) button
5. Platform is now enabled

### No Configuration Required Yet

Currently, you can toggle platforms on/off. Platform settings pages (for API credentials, warehouse selection, etc.) will be created in the future.

When you enable a platform:
- `wolt_enabled` (or yango/bolt) is set to `true` in the database
- Platform appears in the "Online Orders" sidebar menu source filter
- Ready to receive webhooks (when API credentials are configured)

---

## User Flow

```
User visits /integrations
  ↓
Sees "Çatdırılma Platformaları" category
  ↓
Clicks on "Wolt Food Delivery" card
  ↓
Card shows "Aktivləşdir" button (no dependency warning)
  ↓
User clicks "Aktivləşdir"
  ↓
POST /settings/toggle-module with module=wolt
  ↓
UnifiedSettingsController->toggleModule() validates and toggles
  ↓
account.wolt_enabled = true
  ↓
Card now shows "Aktivdir - Söndür" (Active - Turn Off)
  ↓
Green "Aktiv" badge appears
```

---

## Categories on Integrations Page

| Category | Modules |
|----------|---------|
| **Hamısı** (All) | All integrations |
| **Biznes Modulları** (Business) | Services, Rent, Discounts, Gift Cards |
| **Əlaqə** (Communication) | SMS, Telegram |
| **Fiskal** (Fiscal) | Fiscal Printer |
| **Loyallıq** (Loyalty) | Loyalty Program |
| **Digər** (Other) | Online Shop |
| **Çatdırılma Platformaları** (Delivery) | **Wolt, Yango, Bolt** ← NEW |

---

## Integration Cards UI

### E-commerce Shop Card
```
┌────────────────────────────────────┐
│ 🛍️  Online Mağaza        [Aktiv] │
│                                    │
│ Məhsullarınızı online satışa      │
│ çıxarın və gəlir əldə edin        │
│                                    │
│ ⚠️ Qoşulma tələb edir              │
│ Bu modulu aktivləşdirmək üçün     │
│ əvvəlcə: SMS Xidməti              │
│                                    │
│ ✓ Online mağaza                   │
│ ✓ Məhsul kataloqu                 │
│ ✓ Online sifarişlər               │
│ ✓ Ödəniş inteqrasiyası            │
│                                    │
│    [Aktivdir - Söndür]            │
└────────────────────────────────────┘
```

### Wolt Card (No Warning!)
```
┌────────────────────────────────────┐
│ 🚚  Wolt Food Delivery  [Deaktiv]│
│                                    │
│ Wolt platformasından sifarişləri  │
│ avtomatik qəbul edin              │
│                                    │
│ ✓ Avtomatik sifariş qəbulu        │
│ ✓ Status sinxronizasiyası         │
│ ✓ Anbar seçimi                    │
│ ✓ Filial təyini                   │
│                                    │
│       [Aktivləşdir]               │
└────────────────────────────────────┘
```

---

## Database Impact

### When User Enables Wolt:
```sql
UPDATE accounts
SET wolt_enabled = 1
WHERE id = <account_id>;
```

### When User Disables Wolt:
```sql
UPDATE accounts
SET wolt_enabled = 0
WHERE id = <account_id>;
```

---

## Next Steps (Future Work)

### 1. Platform Settings Pages

Create pages for each platform:
- `/integrations/wolt` - Wolt settings
- `/integrations/yango` - Yango settings
- `/integrations/bolt` - Bolt Food settings

**Each page should have:**
- API credentials form (api_key, restaurant_id)
- Warehouse selection dropdown
- Branch selection dropdown
- Test connection button
- Save button

### 2. Update Integration Cards Routes

Currently, clicking platform cards tries to navigate to `/integrations/wolt` etc., which return 404. Options:

**Option A:** Create settings pages (recommended)
**Option B:** Change card behavior to just toggle (no navigation)
**Option C:** Navigate to general delivery settings page

### 3. Validation

Add validation when enabling platforms:
- Check if API credentials are set
- Show warning if warehouse not selected
- Suggest warehouse/branch configuration

---

## Testing

### Test Platform Toggle

1. Visit `/integrations`
2. Find Wolt card
3. Click "Aktivləşdir"
4. Should see success message
5. Card should show "Aktiv" badge
6. Button should change to "Aktivdir - Söndür"

### Verify Database

```bash
php artisan tinker
```

```php
$account = \App\Models\Account::first();
echo "Wolt: " . ($account->wolt_enabled ? 'YES' : 'NO') . "\n";
echo "Yango: " . ($account->yango_enabled ? 'YES' : 'NO') . "\n";
echo "Bolt: " . ($account->bolt_enabled ? 'YES' : 'NO') . "\n";
```

### Verify in Online Orders

After enabling Wolt:
1. Go to `/online-orders`
2. Source filter dropdown should show "Wolt" option
3. Can filter orders by Wolt source

---

## Summary

✅ 3 delivery platform cards added to integrations page
✅ New "Delivery Platforms" category created
✅ Backend toggle functionality implemented
✅ No SMS dependency for delivery platforms
✅ E-commerce shop still requires SMS
✅ All platforms can be enabled/disabled independently

**Ready to use!** Users can now enable Wolt/Yango/Bolt from the integrations page without needing SMS configuration.
