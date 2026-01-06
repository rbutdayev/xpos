# XPOS Kiosk - User Guide

## Quick Answers to Common Questions

### 1. Where Can I Change the API Key?

**Currently:** The app doesn't have an "edit API key" feature in the UI. Once registered, you need to reset the device to change it.

**To Change API Settings:**

**Option A: Reset Device (Recommended)**
1. Go to **Settings** page (click Settings in navigation)
2. Scroll to bottom - "Danger Zone"
3. Click **"Logout & Reset"**
4. Confirm the action
5. You'll be taken back to Setup page
6. Enter new API key and URL
7. Re-register the device

**Option B: Manual Database Edit** (Advanced)
```bash
# Open SQLite database
sqlite3 ~/Library/Application\ Support/xpos-kiosk/kiosk.db

# View current config
SELECT * FROM app_config;

# Update API URL
UPDATE app_config SET value = 'https://new-api.com' WHERE key = 'api_url';

# Update token
UPDATE app_config SET value = 'new_token_here' WHERE key = 'token';

# Exit
.quit

# Restart the app
```

---

### 2. Where Can I See the API Address?

**Location:** Settings Page

**Steps:**
1. Click **Settings** in the top navigation
2. Look for **"Device Information"** section
3. Click to expand it (arrow icon on right)
4. You'll see:
   - **Device Name**
   - **Account ID**
   - **Branch ID**
   - **API URL** ← Here!
   - **Version**

**Screenshot of what you'll see:**
```
Device Information                           ▼
─────────────────────────────────────────────
Device Name:     Kiosk-1
Account ID:      123
Branch ID:       456
API URL:         https://your-api.com
Version:         v1.0.0
```

---

### 3. Why Do I See "Sync Status: Offline"?

**Common Causes:**

**A. Backend Server Not Running**
```bash
# Check if Laravel backend is running
curl https://your-api.com/api/kiosk/heartbeat

# If you get "Connection refused" - backend is down
# Start your Laravel backend:
cd /path/to/laravel
php artisan serve
```

**B. Wrong API URL Configured**
- Check Settings → Device Information → API URL
- Make sure it matches your Laravel server address
- Common mistake: `http://localhost:8000` vs `http://127.0.0.1:8000`

**C. Firewall Blocking Connection**
- Check if firewall is blocking the port
- Try disabling firewall temporarily to test

**D. Device Not Registered**
- If you're on the Setup page, you haven't registered yet
- Complete the registration process first

**E. Network Issues**
- Check internet connection
- Try pinging the API server

**How to Fix:**

1. **Check Backend Status:**
```bash
# From Laravel project directory
php artisan serve --host=0.0.0.0 --port=8000
```

2. **Test Heartbeat:**
```bash
# Replace with your actual API URL and token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-api.com/api/kiosk/heartbeat
```

3. **Check Kiosk Logs:**
- Open DevTools (Cmd+Option+I on Mac, Ctrl+Shift+I on Windows)
- Look for errors in Console tab
- Check Network tab for failed requests

4. **Manual Sync Test:**
- Go to Settings page
- Click **"Sync Now"** button
- Watch for error messages

---

### 4. I Built the App But UI Looks the Same - Where Can I Create a Sale?

**Issue:** You only built the Electron main process, not the React UI!

**Solution: Build Both Parts**

```bash
cd /Users/ruslan/projects/xpos/kiosk-app

# Build BOTH Electron AND React renderer
npm run build

# OR build them separately:
npm run build:electron    # ← You did this (backend only)
npm run build:renderer    # ← You need this too (UI)
```

**After building, run the app:**
```bash
npm start
```

---

## 📱 App Navigation Guide

### Pages Available:

```
┌─────────────────────────────────────────────────────┐
│  [POS]  [Sync]  [Settings]  ← Navigation Bar        │
└─────────────────────────────────────────────────────┘
```

### 1. POS Page (Point of Sale) - Main Screen

**URL:** `/pos`

**What You'll See:**
```
┌──────────────────────────────────────────────────────┐
│  Customer Lookup                 │  Shopping Cart    │
│  ───────────────────             │  ──────────────   │
│  [Search customer...]            │  Items: 0         │
│                                  │  Total: $0.00     │
│  Product Search                  │  [Checkout]       │
│  ───────────────                 │                   │
│  [Search products...]            │                   │
│                                  │                   │
│  Product Results:                │                   │
│  ┌─────────────┐ ┌─────────────┐│                   │
│  │ Product A   │ │ Product B   ││                   │
│  │ $10.00      │ │ $20.00      ││                   │
│  └─────────────┘ └─────────────┘│                   │
└──────────────────────────────────────────────────────┘
```

**How to Create a Sale:**

1. **Search for Products:**
   - Type product name, SKU, or barcode in search box
   - OR scan barcode with USB scanner

2. **Add to Cart:**
   - Click on product card
   - Product appears in right panel (Shopping Cart)

3. **Adjust Quantity:**
   - Click + or - buttons in cart
   - Or click remove (trash icon)

4. **Optional: Add Customer:**
   - Search customer in top-left
   - Select customer for loyalty points

5. **Checkout:**
   - Click **"Checkout"** button in cart
   - Payment modal opens

6. **Process Payment:**
   - Select payment method (Cash/Card/Gift Card)
   - Enter amount
   - Click **"Add Payment"**
   - When fully paid, click **"Complete Sale"**

7. **Done!**
   - Sale is saved locally
   - Fiscal receipt prints (if configured)
   - Cart clears automatically
   - Sale queued for sync to backend

### 2. Sync Page

**URL:** `/sync`

**What You'll See:**
- Connection status (Online/Offline)
- Last sync time
- Sync progress bars
- Queued sales count
- Manual sync button

**Purpose:**
- Monitor sync status
- Trigger manual sync
- View sync history
- See queued sales waiting to upload

### 3. Settings Page

**URL:** `/settings`

**What You'll See:**
- Connection status with sync button
- Data overview (products, sales, customers count)
- Device information (collapsible)
  - Device Name
  - Account ID
  - Branch ID
  - **API URL** ← Answer to question #2
  - Version
- Tools section
  - View Logs
  - Test Connection
  - Clear Cache
- Danger Zone
  - **Logout & Reset** ← Answer to question #1

---

## 🚀 First Time Setup Flow

### If App Shows Setup Page:

```
┌──────────────────────────────────────────────────┐
│                  Device Setup                     │
│  ────────────────────────────────────────────    │
│                                                   │
│  API Token:     [________________]                │
│  API URL:       [https://api.com]                │
│  Device Name:   [Kiosk-1       ]                 │
│                                                   │
│              [Register Device]                    │
└──────────────────────────────────────────────────┘
```

**Steps:**

1. **Get API Token from Laravel Admin:**
   ```bash
   # In Laravel project
   php artisan tinker
   >>> use App\Models\User;
   >>> $user = User::first();
   >>> $token = $user->createToken('kiosk')->plainTextToken;
   >>> echo $token;
   ```

2. **Enter Details in Setup Form:**
   - API Token: (paste token from step 1)
   - API URL: Your Laravel backend URL (e.g., `http://localhost:8000`)
   - Device Name: Any name (e.g., "Kiosk-1", "Store-Front")

3. **Click "Register Device":**
   - App will register with backend
   - Initial sync will run (products, customers)
   - You'll be redirected to POS page

4. **Start Selling!**

---

## 🛠️ Troubleshooting

### "Nothing happens when I click buttons"

**Cause:** React UI not built

**Fix:**
```bash
npm run build:renderer
npm start
```

### "Products don't appear in search"

**Causes:**
1. No products synced yet
2. Backend has no products
3. Sync failed

**Fix:**
1. Add products in Laravel admin
2. Trigger manual sync (Settings page)
3. Check sync status for errors

### "Payment modal won't open"

**Cause:** Cart is empty

**Fix:** Add at least one product to cart first

### "Fiscal printer error"

**Causes:**
1. No fiscal printer configured
2. Printer offline/disconnected
3. Wrong printer IP/settings

**Fix:**
- Configure fiscal printer in Laravel admin
- Sync to download config
- Test printer connection

### "Can't complete sale"

**Causes:**
1. Payment amount less than total
2. No internet (will queue for later)
3. App not registered

**Fix:**
1. Ensure full payment entered
2. Check if offline mode (sale will queue)
3. Complete device registration

---

## 📋 Development vs Production

### Development Mode:
```bash
npm run dev
# - Hot reload enabled
# - DevTools open automatically
# - Uses http://localhost:5173 for renderer
# - Console logs visible
```

### Production Build:
```bash
npm run build              # Build source
npm run electron:build     # Build installers

# Outputs:
# - dist-electron/XPOS Kiosk-1.0.0-arm64.dmg  (macOS ARM)
# - dist-electron/XPOS Kiosk-1.0.0-x64.dmg    (macOS Intel)
# - dist-electron/XPOS Kiosk Setup 1.0.0.exe  (Windows)
```

### Run Built App (Before Creating Installers):
```bash
npm run build    # Build source first
npm start        # Run the built app
```

---

## 🎯 Quick Reference

| Action | Location | Button/Field |
|--------|----------|--------------|
| Change API Key | Settings → Logout & Reset | "Logout & Reset" button |
| View API URL | Settings → Device Info | Expand "Device Information" |
| Create Sale | POS Page | Search product → Add to cart → Checkout |
| Manual Sync | Settings or Sync page | "Sync Now" button |
| Check Connection | Settings | Green/Red dot next to "Online/Offline" |
| View Queued Sales | Sync page | Sales Queue counter |
| Reset Device | Settings → Danger Zone | "Logout & Reset" button |

---

## 📞 Need Help?

**Common Issues:**
1. "Offline" status → Check backend is running
2. No products → Add products in Laravel + sync
3. UI not updating → Build renderer: `npm run build:renderer`
4. Can't change API → Reset device from Settings

**Check Logs:**
- Main process: Console where you ran `npm start`
- Renderer process: DevTools → Console (Cmd+Opt+I)

**Files to Check:**
- Config: `~/Library/Application Support/xpos-kiosk/config.json`
- Database: `~/Library/Application Support/xpos-kiosk/kiosk.db`
- Logs: Browser DevTools console
