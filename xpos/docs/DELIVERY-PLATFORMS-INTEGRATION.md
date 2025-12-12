# Delivery Platforms Integration (Wolt, Yango, Bolt Food)

## Overview
Extend existing "Online Orders" module to support orders from food delivery platforms (Wolt, Yango, Bolt Food) alongside the existing e-commerce shop.

**Business Model:** Single module fee covers all platforms (e-commerce + all delivery platforms)

---

## Current State

✅ **Already Implemented:**
- Database structure for online orders (`is_online_order` flag)
- Order management UI (view, update status, cancel)
- Stock integration (auto-deduct from warehouse)
- Status workflow (pending → completed → cancelled)
- Customer info support (with/without registration)

---

## Implementation Steps

### **Phase 1: Database Schema Updates**

#### 1.1 Add Source Tracking
- Add `source` column to `sales` table
  - Values: `'shop'` (default), `'wolt'`, `'yango'`, `'bolt'`
  - Index: `(account_id, source, created_at)`

#### 1.2 Add Platform-Specific Fields
- Add `platform_order_id` (external order ID from platform)
- Add `platform_order_data` (JSON field for platform metadata)
- Add `delivery_fee` (platform delivery charges)
- Add `platform_commission` (platform commission amount)

#### 1.3 Update Account Settings
- Rename `shop_enabled` → `online_orders_enabled` (or keep both for backwards compatibility)
- Add `wolt_enabled` (boolean, default false)
- Add `yango_enabled` (boolean, default false)
- Add `bolt_enabled` (boolean, default false)
- Add `wolt_api_key`, `wolt_restaurant_id` (credentials)
- Add `yango_api_key`, `yango_restaurant_id`
- Add `bolt_api_key`, `bolt_restaurant_id`

---

### **Phase 2: API Webhook Receivers**

#### 2.1 Create Webhook Controllers
Create separate webhook endpoints for each platform:
- `POST /api/webhooks/wolt/orders` - Receive new Wolt orders
- `POST /api/webhooks/yango/orders` - Receive new Yango orders
- `POST /api/webhooks/bolt/orders` - Receive new Bolt orders

#### 2.2 Webhook Processing Logic
Each webhook should:
1. **Authenticate** request (verify signature/token from platform)
2. **Validate** account has platform enabled (`wolt_enabled = true`)
3. **Check account_id** from credentials (maintain multitenant security)
4. **Parse** platform order JSON
5. **Map** platform products to local products (by SKU/barcode)
6. **Create Sale** record:
   - `is_online_order = true`
   - `source = 'wolt'` (or yango/bolt)
   - `platform_order_id = external_id`
   - `status = 'pending'`
   - `customer_name`, `customer_phone` from platform
   - `delivery_notes` from platform
7. **Create SaleItems** for each product
8. **Send notification** to staff (email/SMS/Telegram)
9. **Respond to platform** (HTTP 200 = accepted)

#### 2.3 Product Matching Strategy
- Match by `barcode` (primary)
- Match by `sku` (secondary)
- If no match → log error, notify staff, reject order

---

### **Phase 3: Status Sync to Platforms**

#### 3.1 Update OnlineOrderController
When staff changes order status, notify the platform:

**Status Mapping:**
- `pending` → Platform: "received" or "confirmed"
- `completed` → Platform: "ready_for_pickup"
- `cancelled` → Platform: "cancelled"

#### 3.2 Platform API Clients
Create service classes for each platform:
- `App\Services\WoltService->updateOrderStatus($orderId, $status)`
- `App\Services\YangoService->updateOrderStatus($orderId, $status)`
- `App\Services\BoltService->updateOrderStatus($orderId, $status)`

Each service handles:
- Authentication with platform API
- Status update requests
- Error handling/retry logic
- Logging

---

### **Phase 4: Menu Sync (Optional - Future Enhancement)**

Push product catalog to platforms:
- Export products with prices, descriptions, images
- Update availability based on stock levels
- Handle product updates/deletions

**Note:** This can be Phase 2 if needed. Most platforms allow manual menu setup initially.

---

### **Phase 5: UI/UX Updates**

#### 5.1 Online Orders List Page
- Add **source filter**: "All | Your Shop | Wolt | Yango | Bolt"
- Add **source badge** on each order:
  - 🛒 Shop (green)
  - 🟣 Wolt (purple)
  - 🟡 Yango (yellow)
  - 🟢 Bolt (green)
- Show `platform_order_id` for delivery platform orders

#### 5.2 Settings Page
Add new section: **"Delivery Platform Integrations"**

**Settings UI:**
```
Online Orders Module: ✓ Enabled

Your E-commerce Shop
  ☑ Enabled
  🔗 Shop URL: https://shop.yourstore.com

Delivery Platforms
  ☑ Wolt Integration
      Restaurant ID: [________]
      API Key: [________]
      Status: ✓ Connected

  ☐ Yango Integration
      Restaurant ID: [________]
      API Key: [________]

  ☐ Bolt Food Integration
      Restaurant ID: [________]
      API Key: [________]
```

#### 5.3 Order Details View
For platform orders, show:
- Platform name badge
- External order ID
- Delivery fee (if applicable)
- Platform commission
- Delivery notes from customer

---

### **Phase 6: Reporting Updates**

Update reports to distinguish order sources:
- Sales reports: breakdown by source (shop vs wolt vs yango vs bolt)
- Commission tracking: calculate platform fees
- Delivery fee tracking

---

## Security Considerations

### **Multitenant Safety (per CLAUDE.md)**
- **ALWAYS filter by `account_id`** when:
  - Looking up API credentials
  - Creating sales from webhooks
  - Updating order status
- Use Gates: `Gate::authorize('access-account-data')`
- Validate webhook signatures to prevent fake orders

### **API Authentication**
Each platform webhook should:
1. Verify signature/token from platform
2. Look up account by platform credentials
3. Ensure `online_orders_enabled = true`
4. Ensure platform-specific flag enabled (`wolt_enabled = true`)

---

## Testing Checklist

### **Webhook Testing**
- [ ] Test receiving order from Wolt
- [ ] Test receiving order from Yango
- [ ] Test receiving order from Bolt
- [ ] Test product matching (by barcode/SKU)
- [ ] Test product not found scenario
- [ ] Test duplicate order prevention
- [ ] Test multitenant isolation (wrong account_id)

### **Status Sync Testing**
- [ ] Mark order as completed → platform notified
- [ ] Mark order as cancelled → platform notified
- [ ] Handle platform API errors gracefully
- [ ] Retry failed status updates

### **UI Testing**
- [ ] Filter orders by source
- [ ] Source badges display correctly
- [ ] Platform order ID shown
- [ ] Settings page enable/disable works

### **Stock Integration**
- [ ] Stock deducted when platform order marked completed
- [ ] Stock restored when order cancelled
- [ ] Negative stock alerts work for platform orders

---

## Migration Path

**For Existing Customers:**
1. Module already enabled (`shop_enabled = true`) → auto-upgrade to `online_orders_enabled = true`
2. All existing orders get `source = 'shop'` (default)
3. Platform integrations start disabled (`wolt_enabled = false`)
4. Customer opts-in to each platform in settings

**Backwards Compatibility:**
- Keep `shop_enabled` column for now (deprecated)
- `online_orders_enabled` is new master switch
- Existing code continues to work

---

## Platform-Specific Notes

### **Wolt**
- API Docs: https://docs.wolt.com/
- Webhook events: `order.created`, `order.cancelled`
- Status updates: REST API
- Product matching: Use Wolt's product ID mapping

### **Yango**
- API Docs: https://yandex.com/dev/delivery/
- Webhook events: Similar to Yandex.Eats
- OAuth2 authentication
- Product catalog sync required

### **Bolt Food**
- API Docs: https://docs.bolt.eu/
- Webhook events: `order.new`, `order.updated`
- API key authentication
- Menu sync via REST API

---

## Future Enhancements

- [ ] Auto-print kitchen receipts for platform orders
- [ ] SMS notifications to customers (order ready)
- [ ] Analytics dashboard (revenue by platform)
- [ ] Automated menu sync
- [ ] Multi-location support (different credentials per branch)
- [ ] Platform-specific pricing rules

---

## Questions to Research

1. **Platform Onboarding:** How do restaurants get API credentials from each platform?
2. **Product Mapping:** Do platforms provide SKU/barcode fields, or only product names?
3. **Pricing:** Can we set different prices on platforms vs our shop?
4. **Stock Sync:** Do platforms expect real-time stock availability updates?
5. **Order Timing:** Do platforms expect order acceptance within X minutes?

---

## Development Timeline Estimate

- **Phase 1 (Database):** 1 day
- **Phase 2 (Webhooks):** 3-4 days (per platform = test each one)
- **Phase 3 (Status Sync):** 2 days
- **Phase 4 (Menu Sync):** 3-5 days (optional)
- **Phase 5 (UI Updates):** 2-3 days
- **Phase 6 (Reporting):** 1-2 days
- **Testing & Bug Fixes:** 3-4 days

**Total:** ~2-3 weeks for core functionality (Phases 1-3, 5)

---

## Success Criteria

✅ Restaurant receives order from Wolt → appears in POS as "pending"
✅ Staff marks order "completed" → Wolt notified → courier dispatched
✅ Stock automatically deducted from warehouse
✅ Staff can see which orders are from which platform
✅ All orders filtered by account_id (multitenant safe)
✅ Platform credentials stored securely per account
