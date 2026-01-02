# Offline Kiosk POS - Implementation Plan

## Overview

This document outlines the complete implementation plan for an **offline-first Windows kiosk application** that works with the existing xPOS Laravel backend. The kiosk app will handle sales and customer operations with full offline capability and automatic synchronization when internet connectivity is restored.

**Key Features:**
- ✅ 100% offline sales capability with local SQLite database
- ✅ Automatic background synchronization
- ✅ Direct fiscal printer integration (no bridge agent needed)
- ✅ Multi-tenant isolation (account_id based)
- ✅ Separate authentication from web app
- ✅ **Zero modifications to existing codebase**

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    KIOSK WINDOWS APP                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   React UI   │  │ SQLite Local │  │  Sync Service   │   │
│  │   (POS)      │  │   Database   │  │  (Background)   │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘   │
│         │                  │                    │            │
│         └──────────────────┴────────────────────┘            │
│                            │                                 │
│                     ┌──────▼───────┐                        │
│                     │  API Client  │                        │
│                     │ (Bearer Auth)│                        │
│                     └──────┬───────┘                        │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTPS
                             │ Bearer Token
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              LARAVEL BACKEND (EXISTING + NEW)               │
│  ┌────────────────────────────────────────────────────┐    │
│  │           NEW: Kiosk API Routes (/api/kiosk/*)     │    │
│  │  - Auth & Registration                             │    │
│  │  - Sync (products, customers, config)              │    │
│  │  - Sales Upload (batch & real-time)                │    │
│  │  - Customer/Product Quick Actions                  │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │      EXISTING: Web POS, Fiscal Bridge, etc.        │    │
│  │  (COMPLETELY UNTOUCHED)                            │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Fiscal Printer Integration

**IMPORTANT: Kiosk accesses fiscal printer DIRECTLY (no bridge needed)**

```
Web App (Browser):
  └─> Backend → FiscalPrinterJob → Bridge Agent (polls) → Fiscal Printer
      (Indirect: Browser can't access local hardware)

Kiosk App (Windows Desktop):
  └─> GET /api/kiosk/fiscal-config → Direct HTTP to Fiscal Printer ✅
      (Direct: Desktop app has local network access)
```

**Flow:**
1. Kiosk fetches fiscal config: `GET /api/kiosk/fiscal-config`
   - Returns: `{provider: 'caspos', ip: '192.168.1.100', port: 8080, ...}`
2. Kiosk stores config locally (SQLite)
3. On sale creation → Kiosk sends directly to fiscal printer via HTTP
4. Fiscal printer returns fiscal number
5. Kiosk saves sale with fiscal number
6. When online → Sync sale to backend (fiscal number already set)

**No bridge agent running for kiosk! Bridge only needed for web app.**

---

## Security Model

### Token Separation

**Two separate token systems:**

```sql
-- EXISTING: Fiscal Printer Bridge Tokens (DON'T TOUCH)
fiscal_printer_bridge_tokens
  - account_id
  - name
  - token (bearer)
  - status (active/revoked)
  - last_heartbeat
  - Permissions: /api/bridge/* only

-- NEW: Kiosk Device Tokens
kiosk_device_tokens
  - account_id
  - branch_id (kiosk location)
  - device_name (e.g., "Kiosk-Store-1")
  - token (bearer)
  - status (active/revoked)
  - last_heartbeat
  - created_by (user_id)
  - Permissions: /api/kiosk/* only
```

**Why Separate?**
- ✅ Principle of least privilege (different scopes)
- ✅ Independent revocation (kiosk vs fiscal)
- ✅ Clear audit trails per device type
- ✅ Isolated security breach impact
- ✅ Multiple kiosks per account support

### Authentication Flow

```
1. Admin creates kiosk token:
   POST /kiosk-tokens/generate
   → Returns: {token: "ksk_abc123...", device_name: "Kiosk-1"}

2. Kiosk registration:
   POST /api/kiosk/register
   Headers: Authorization: Bearer ksk_abc123...
   Body: {device_name: "Kiosk-Store-1", version: "1.0.0"}
   → Returns: {account_id: 123, branch_id: 5, sync_config: {...}}

3. All subsequent requests:
   Headers: Authorization: Bearer ksk_abc123...
   Middleware validates token, sets account_id context
```

### Rate Limiting

```php
// Per-device rate limiting (not per IP, kiosks behind NAT)
- Sync endpoints: 10 requests/minute
- Sales upload: 50 requests/minute
- Search endpoints: 100 requests/minute
- Burst protection: Max 10 concurrent requests
```

---

## Database Schema

### New Tables (Backend)

#### 1. `kiosk_device_tokens`

```sql
CREATE TABLE kiosk_device_tokens (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    account_id BIGINT UNSIGNED NOT NULL,
    branch_id BIGINT UNSIGNED NULL,
    device_name VARCHAR(100) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    status ENUM('active', 'revoked', 'suspended') DEFAULT 'active',
    last_heartbeat TIMESTAMP NULL,
    device_info JSON NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_account_status (account_id, status),
    INDEX idx_token (token),
    INDEX idx_heartbeat (last_heartbeat)
);
```

#### 2. `kiosk_sync_logs`

```sql
CREATE TABLE kiosk_sync_logs (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    account_id BIGINT UNSIGNED NOT NULL,
    kiosk_device_token_id BIGINT UNSIGNED NOT NULL,
    sync_type ENUM('products', 'customers', 'sales_upload', 'config') NOT NULL,
    direction ENUM('upload', 'download') NOT NULL,
    records_count INT UNSIGNED DEFAULT 0,
    status ENUM('success', 'failed', 'partial') NOT NULL,
    error_message TEXT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,

    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (kiosk_device_token_id) REFERENCES kiosk_device_tokens(id) ON DELETE CASCADE,

    INDEX idx_account_device (account_id, kiosk_device_token_id),
    INDEX idx_sync_type_status (sync_type, status),
    INDEX idx_created_at (created_at)
);
```

### SQLite Schema (Kiosk Local Database)

```sql
-- Products cache
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    account_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    sku TEXT,
    barcode TEXT,
    sale_price REAL NOT NULL,
    purchase_price REAL,
    stock_quantity REAL DEFAULT 0,
    variant_id INTEGER,
    variant_name TEXT,
    category_name TEXT,
    is_active INTEGER DEFAULT 1,
    type TEXT DEFAULT 'product',
    last_synced_at TEXT,
    INDEX idx_barcode (barcode),
    INDEX idx_sku (sku),
    INDEX idx_name (name)
);

-- Customers cache
CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    account_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    loyalty_card_number TEXT,
    current_points INTEGER DEFAULT 0,
    customer_type TEXT DEFAULT 'regular',
    last_synced_at TEXT,
    INDEX idx_phone (phone),
    INDEX idx_loyalty_card (loyalty_card_number)
);

-- Offline sales queue
CREATE TABLE sales_queue (
    local_id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    customer_id INTEGER,
    items TEXT NOT NULL, -- JSON array
    payments TEXT NOT NULL, -- JSON array
    subtotal REAL NOT NULL,
    tax_amount REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    total REAL NOT NULL,
    payment_status TEXT DEFAULT 'paid',
    notes TEXT,
    fiscal_number TEXT,
    fiscal_document_id TEXT,
    created_at TEXT NOT NULL,
    sync_status TEXT DEFAULT 'queued', -- queued | uploading | synced | failed
    server_sale_id INTEGER,
    sync_attempted_at TEXT,
    sync_error TEXT,
    retry_count INTEGER DEFAULT 0
);

-- Fiscal printer config cache
CREATE TABLE fiscal_config (
    id INTEGER PRIMARY KEY,
    account_id INTEGER NOT NULL,
    provider TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    port INTEGER NOT NULL,
    operator_code TEXT,
    operator_password TEXT,
    is_active INTEGER DEFAULT 1,
    last_synced_at TEXT
);

-- App configuration
CREATE TABLE app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT
);

-- Sync metadata
CREATE TABLE sync_metadata (
    sync_type TEXT PRIMARY KEY, -- products | customers | config
    last_sync_at TEXT,
    last_sync_status TEXT, -- success | failed
    records_synced INTEGER DEFAULT 0
);
```

---

## API Endpoints

### New Backend Endpoints (`/routes/api.php`)

All routes under `/api/kiosk/*` prefix with `kiosk.auth` middleware.

#### Authentication & Registration

```php
POST   /api/kiosk/register
GET    /api/kiosk/heartbeat
POST   /api/kiosk/disconnect
```

**POST /api/kiosk/register**
```json
Request:
{
  "device_name": "Kiosk-Store-1",
  "version": "1.0.0",
  "platform": "windows"
}

Response:
{
  "success": true,
  "account_id": 123,
  "branch_id": 5,
  "device_name": "Kiosk-Store-1",
  "sync_config": {
    "sync_interval_seconds": 300,
    "heartbeat_interval_seconds": 30,
    "max_retry_attempts": 3
  }
}
```

#### Data Synchronization

```php
GET    /api/kiosk/sync/products/delta?since=2024-01-01T00:00:00Z
GET    /api/kiosk/sync/customers/delta?since=2024-01-01T00:00:00Z
GET    /api/kiosk/sync/config
GET    /api/kiosk/fiscal-config
```

**GET /api/kiosk/sync/products/delta**
```json
Response:
{
  "success": true,
  "products": [
    {
      "id": 123,
      "name": "Product A",
      "sku": "PROD-001",
      "barcode": "1234567890",
      "sale_price": 29.99,
      "stock_quantity": 100,
      "variant_id": null,
      "is_active": true,
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "deleted_ids": [45, 67],
  "sync_timestamp": "2024-01-15T12:00:00Z",
  "total_records": 150
}
```

**GET /api/kiosk/fiscal-config**
```json
Response:
{
  "success": true,
  "config": {
    "provider": "caspos",
    "ip_address": "192.168.1.100",
    "port": 8080,
    "operator_code": "1",
    "operator_password": "password",
    "is_active": true
  }
}
```

#### Sales Operations

```php
POST   /api/kiosk/sale                    // Single sale (real-time)
POST   /api/kiosk/sales/upload            // Batch upload (offline queue)
GET    /api/kiosk/sales/status/{localId}  // Check sync status
```

**POST /api/kiosk/sales/upload (Batch)**
```json
Request:
{
  "sales": [
    {
      "local_id": 1,
      "branch_id": 5,
      "customer_id": 789,
      "items": [
        {
          "product_id": 123,
          "variant_id": null,
          "quantity": 2,
          "unit_price": 29.99,
          "discount_amount": 0
        }
      ],
      "payments": [
        {
          "method": "cash",
          "amount": 59.98
        }
      ],
      "subtotal": 59.98,
      "tax_amount": 0,
      "discount_amount": 0,
      "total": 59.98,
      "payment_status": "paid",
      "fiscal_number": "FP123456",
      "fiscal_document_id": "DOC789",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}

Response:
{
  "success": true,
  "results": [
    {
      "local_id": 1,
      "server_sale_id": 9876,
      "sale_number": "SALE-2024-001",
      "status": "created"
    }
  ],
  "failed": []
}
```

#### Quick Actions

```php
GET    /api/kiosk/products/search?q={query}
GET    /api/kiosk/customers/search?q={query}
POST   /api/kiosk/customers/quick-store
POST   /api/kiosk/loyalty/validate
POST   /api/kiosk/gift-card/lookup
```

---

## Backend Implementation

### File Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Kiosk/
│   │       ├── KioskAuthController.php       (NEW)
│   │       ├── KioskSyncController.php       (NEW)
│   │       ├── KioskSalesController.php      (NEW)
│   │       └── KioskQuickActionsController.php (NEW)
│   │
│   └── Middleware/
│       ├── KioskAuthMiddleware.php           (NEW)
│       └── KioskRateLimitMiddleware.php      (NEW)
│
├── Models/
│   ├── KioskDeviceToken.php                  (NEW)
│   └── KioskSyncLog.php                      (NEW)
│
├── Services/
│   ├── KioskSyncService.php                  (NEW)
│   └── KioskSaleProcessor.php                (NEW)
│
└── Traits/
    └── BelongsToAccount.php                  (EXISTING - use this)

database/
└── migrations/
    ├── 2024_xx_xx_create_kiosk_device_tokens_table.php  (NEW)
    └── 2024_xx_xx_create_kiosk_sync_logs_table.php      (NEW)

routes/
└── api.php                                   (ADD kiosk routes)
```

### Key Implementation Details

#### KioskAuthMiddleware.php

```php
<?php

namespace App\Http\Middleware;

use App\Models\KioskDeviceToken;
use Closure;
use Illuminate\Http\Request;

class KioskAuthMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'success' => false,
                'error' => 'No bearer token provided'
            ], 401);
        }

        $kioskToken = KioskDeviceToken::where('token', $token)
            ->where('status', 'active')
            ->first();

        if (!$kioskToken) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or revoked token'
            ], 401);
        }

        // Set account context (similar to account.access middleware)
        $request->merge([
            'kiosk_account_id' => $kioskToken->account_id,
            'kiosk_branch_id' => $kioskToken->branch_id,
            'kiosk_device_id' => $kioskToken->id,
        ]);

        // Update heartbeat (throttled to avoid DB hits on every request)
        if (!$kioskToken->last_heartbeat ||
            $kioskToken->last_heartbeat->diffInSeconds(now()) > 30) {
            $kioskToken->updateHeartbeat();
        }

        return $next($request);
    }
}
```

#### KioskSyncService.php

```php
<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Customer;
use App\Models\FiscalPrinterConfig;
use Illuminate\Support\Carbon;

class KioskSyncService
{
    /**
     * Get products delta (changes since last sync)
     */
    public function getProductsDelta(int $accountId, ?string $since = null): array
    {
        $sinceDate = $since ? Carbon::parse($since) : Carbon::now()->subYears(10);

        $products = Product::where('account_id', $accountId)
            ->where('is_active', true)
            ->where('updated_at', '>', $sinceDate)
            ->with(['variants', 'productPrices'])
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'sale_price' => $product->sale_price,
                    'purchase_price' => $product->purchase_price,
                    'stock_quantity' => $product->stock_quantity ?? 0,
                    'variant_id' => null,
                    'variant_name' => null,
                    'category_name' => $product->category?->name,
                    'type' => $product->type,
                    'is_active' => $product->is_active,
                    'updated_at' => $product->updated_at->toIso8601String(),
                ];
            });

        // Get deleted product IDs (soft deletes)
        $deletedIds = Product::where('account_id', $accountId)
            ->onlyTrashed()
            ->where('deleted_at', '>', $sinceDate)
            ->pluck('id')
            ->toArray();

        return [
            'products' => $products,
            'deleted_ids' => $deletedIds,
            'sync_timestamp' => now()->toIso8601String(),
            'total_records' => $products->count(),
        ];
    }

    /**
     * Get customers delta
     */
    public function getCustomersDelta(int $accountId, ?string $since = null): array
    {
        $sinceDate = $since ? Carbon::parse($since) : Carbon::now()->subYears(10);

        $customers = Customer::where('account_id', $accountId)
            ->where('updated_at', '>', $sinceDate)
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'email' => $customer->email,
                    'loyalty_card_number' => $customer->loyalty_card_number,
                    'current_points' => $customer->current_points ?? 0,
                    'customer_type' => $customer->customer_type ?? 'regular',
                    'updated_at' => $customer->updated_at->toIso8601String(),
                ];
            });

        return [
            'customers' => $customers,
            'sync_timestamp' => now()->toIso8601String(),
            'total_records' => $customers->count(),
        ];
    }

    /**
     * Get fiscal printer config for kiosk
     */
    public function getFiscalConfig(int $accountId): ?array
    {
        $config = FiscalPrinterConfig::where('account_id', $accountId)
            ->where('is_active', true)
            ->first();

        if (!$config) {
            return null;
        }

        return [
            'provider' => $config->provider,
            'ip_address' => $config->ip_address,
            'port' => $config->port,
            'operator_code' => $config->operator_code,
            'operator_password' => $config->operator_password,
            'is_active' => $config->is_active,
        ];
    }
}
```

---

## Kiosk App Implementation

### Technology Stack

**Core Framework:**
- **Tauri** (Rust-based, lighter than Electron) OR **Electron** (Node.js-based, more mature)
- Recommended: **Tauri** for smaller bundle size and better performance

**Frontend:**
- **React 18** with TypeScript
- **React Router** for navigation
- **React Query** for data fetching and caching
- **Zustand** for state management (lightweight)

**Database:**
- **better-sqlite3** (synchronous SQLite for Node.js)
- **Kysely** (type-safe SQL query builder for TypeScript)

**HTTP Client:**
- **Axios** with retry logic and request/response interceptors

**Printer Integration:**
- **node-thermal-printer** for thermal receipt printing
- Direct HTTP requests for fiscal printer integration

### App Structure

```
kiosk-app/
├── src/
│   ├── main/                          # Tauri/Electron main process
│   │   ├── index.ts                  # App entry point
│   │   ├── database/
│   │   │   ├── schema.ts             # SQLite schema
│   │   │   ├── migrations.ts         # DB migrations
│   │   │   └── queries.ts            # Type-safe queries (Kysely)
│   │   ├── services/
│   │   │   ├── sync-service.ts       # Background sync
│   │   │   ├── api-client.ts         # HTTP client with retry
│   │   │   ├── fiscal-service.ts     # Fiscal printer integration
│   │   │   └── print-service.ts      # Thermal printer
│   │   └── config.ts                 # App configuration
│   │
│   ├── renderer/                      # React UI
│   │   ├── pages/
│   │   │   ├── Setup.tsx             # Initial setup (token entry)
│   │   │   ├── POS.tsx               # Main sales screen
│   │   │   ├── SyncStatus.tsx        # Sync dashboard
│   │   │   └── Settings.tsx          # App settings
│   │   │
│   │   ├── components/
│   │   │   ├── ProductSearch.tsx     # Barcode scanner + search
│   │   │   ├── ShoppingCart.tsx      # Cart with items
│   │   │   ├── CustomerLookup.tsx    # Customer search
│   │   │   ├── PaymentModal.tsx      # Payment methods
│   │   │   ├── ConnectionStatus.tsx  # Online/offline indicator
│   │   │   └── SyncProgress.tsx      # Sync progress bar
│   │   │
│   │   ├── hooks/
│   │   │   ├── useProducts.ts        # Product queries (SQLite)
│   │   │   ├── useCustomers.ts       # Customer queries
│   │   │   ├── useSales.ts           # Sales queue management
│   │   │   └── useSync.ts            # Sync state management
│   │   │
│   │   ├── stores/
│   │   │   ├── cart-store.ts         # Shopping cart state
│   │   │   ├── sync-store.ts         # Sync status state
│   │   │   └── config-store.ts       # App config state
│   │   │
│   │   └── utils/
│   │       ├── formatters.ts         # Currency, date formatters
│   │       └── validators.ts         # Input validation
│   │
│   └── shared/
│       ├── types.ts                   # Shared TypeScript types
│       └── constants.ts               # App constants
│
├── package.json
├── tauri.conf.json                    # Tauri config
└── electron-builder.json              # Electron builder config (if using Electron)
```

### Sync Service Implementation

**src/main/services/sync-service.ts**

```typescript
import axios from 'axios';
import { db } from '../database/queries';

export class SyncService {
  private token: string;
  private apiUrl: string;
  private isOnline: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(token: string, apiUrl: string) {
    this.token = token;
    this.apiUrl = apiUrl;
  }

  /**
   * Start background sync service
   */
  start() {
    this.startHeartbeat();
    this.startPeriodicSync();
  }

  /**
   * Heartbeat: Check connectivity every 30 seconds
   */
  private startHeartbeat() {
    setInterval(async () => {
      try {
        await axios.get(`${this.apiUrl}/api/kiosk/heartbeat`, {
          headers: { Authorization: `Bearer ${this.token}` },
          timeout: 5000
        });

        const wasOffline = !this.isOnline;
        this.isOnline = true;

        // Trigger sync when connection restored
        if (wasOffline) {
          console.log('Connection restored, triggering sync...');
          await this.triggerFullSync();
        }
      } catch (error) {
        this.isOnline = false;
        console.log('Offline mode');
      }
    }, 30000); // 30 seconds
  }

  /**
   * Periodic sync: Every 5 minutes when online
   */
  private startPeriodicSync() {
    this.syncInterval = setInterval(async () => {
      if (this.isOnline) {
        await this.triggerFullSync();
      }
    }, 300000); // 5 minutes
  }

  /**
   * Full sync: Upload queued sales + download updates
   */
  async triggerFullSync() {
    console.log('Starting full sync...');

    try {
      // 1. Upload queued sales (highest priority)
      await this.uploadQueuedSales();

      // 2. Download product updates
      await this.syncProducts();

      // 3. Download customer updates
      await this.syncCustomers();

      // 4. Download fiscal config
      await this.syncFiscalConfig();

      console.log('Full sync completed successfully');
    } catch (error) {
      console.error('Full sync failed:', error);
    }
  }

  /**
   * Upload queued sales to backend
   */
  private async uploadQueuedSales() {
    const queuedSales = db.getQueuedSales(); // status = 'queued'

    if (queuedSales.length === 0) {
      return;
    }

    console.log(`Uploading ${queuedSales.length} queued sales...`);

    try {
      const response = await axios.post(
        `${this.apiUrl}/api/kiosk/sales/upload`,
        { sales: queuedSales },
        {
          headers: { Authorization: `Bearer ${this.token}` },
          timeout: 30000
        }
      );

      // Mark sales as synced
      const results = response.data.results;
      for (const result of results) {
        db.markSaleAsSynced(result.local_id, result.server_sale_id);
      }

      console.log(`Uploaded ${results.length} sales successfully`);
    } catch (error) {
      console.error('Failed to upload sales:', error);
      // Sales remain queued, will retry on next sync
    }
  }

  /**
   * Sync products (delta sync)
   */
  private async syncProducts() {
    const lastSync = db.getLastSyncTime('products');

    const response = await axios.get(
      `${this.apiUrl}/api/kiosk/sync/products/delta`,
      {
        params: { since: lastSync },
        headers: { Authorization: `Bearer ${this.token}` }
      }
    );

    const { products, deleted_ids } = response.data;

    // Update local database
    db.upsertProducts(products);
    db.deleteProducts(deleted_ids);
    db.updateSyncMetadata('products', response.data.sync_timestamp);

    console.log(`Synced ${products.length} products`);
  }

  /**
   * Sync customers (delta sync)
   */
  private async syncCustomers() {
    const lastSync = db.getLastSyncTime('customers');

    const response = await axios.get(
      `${this.apiUrl}/api/kiosk/sync/customers/delta`,
      {
        params: { since: lastSync },
        headers: { Authorization: `Bearer ${this.token}` }
      }
    );

    const { customers } = response.data;

    db.upsertCustomers(customers);
    db.updateSyncMetadata('customers', response.data.sync_timestamp);

    console.log(`Synced ${customers.length} customers`);
  }

  /**
   * Sync fiscal printer config
   */
  private async syncFiscalConfig() {
    const response = await axios.get(
      `${this.apiUrl}/api/kiosk/fiscal-config`,
      {
        headers: { Authorization: `Bearer ${this.token}` }
      }
    );

    if (response.data.config) {
      db.updateFiscalConfig(response.data.config);
      console.log('Fiscal config synced');
    }
  }

  /**
   * Get online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Stop sync service
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}
```

### Fiscal Printer Integration

**src/main/services/fiscal-service.ts**

```typescript
import axios from 'axios';
import { db } from '../database/queries';

export class FiscalPrinterService {
  private config: any = null;

  /**
   * Initialize fiscal printer config from local database
   */
  async initialize() {
    this.config = db.getFiscalConfig();

    if (!this.config) {
      throw new Error('Fiscal printer not configured');
    }
  }

  /**
   * Print sale receipt to fiscal printer (direct HTTP)
   */
  async printSaleReceipt(sale: any): Promise<{fiscalNumber: string, fiscalDocumentId: string}> {
    if (!this.config) {
      await this.initialize();
    }

    // Format request based on provider (e.g., Caspos)
    const requestData = this.formatSaleRequest(sale);

    try {
      // Direct HTTP request to fiscal printer (local network)
      const response = await axios.post(
        `http://${this.config.ip_address}:${this.config.port}/api/sale`,
        requestData,
        { timeout: 10000 }
      );

      return {
        fiscalNumber: response.data.fiscal_number,
        fiscalDocumentId: response.data.document_id
      };
    } catch (error) {
      console.error('Fiscal printer error:', error);
      throw new Error('Failed to print fiscal receipt');
    }
  }

  /**
   * Format sale request for fiscal printer
   */
  private formatSaleRequest(sale: any) {
    // Format based on provider (Caspos, Datecs, etc.)
    // This logic can be copied from FiscalPrinterService.php

    return {
      operator: this.config.operator_code,
      password: this.config.operator_password,
      items: sale.items.map((item: any) => ({
        name: item.product_name,
        price: item.unit_price,
        quantity: item.quantity,
        department: 1
      })),
      payments: sale.payments.map((payment: any) => ({
        type: payment.method === 'cash' ? 0 : 1,
        amount: payment.amount
      }))
    };
  }
}
```

---

## Implementation Timeline

### Phase 1: Backend Foundation (Week 1)

**Day 1-2: Database & Models**
- [ ] Create migrations for `kiosk_device_tokens` and `kiosk_sync_logs`
- [ ] Create Eloquent models with `BelongsToAccount` trait
- [ ] Add model relationships and scopes
- [ ] Create seeders for testing

**Day 3-4: Authentication & Middleware**
- [ ] Implement `KioskAuthMiddleware`
- [ ] Implement `KioskRateLimitMiddleware`
- [ ] Create `KioskAuthController` (register, heartbeat)
- [ ] Add artisan command: `php artisan kiosk:generate-token`
- [ ] Write tests for auth flow

**Day 5-7: Sync & Sales APIs**
- [ ] Implement `KioskSyncService` (delta sync logic)
- [ ] Create `KioskSyncController` (products, customers, config endpoints)
- [ ] Create `KioskSalesController` (sale creation, batch upload)
- [ ] Implement cache invalidation hooks
- [ ] Write API tests

**Deliverables:**
- ✅ 2 new database tables
- ✅ 2 new models
- ✅ 4 new controllers
- ✅ 2 new middleware
- ✅ 12+ API endpoints
- ✅ Postman collection

---

### Phase 2: Kiosk App Development (Week 2-3)

**Week 2: App Foundation**
- [ ] Initialize Tauri project (or Electron)
- [ ] Setup React + TypeScript + Vite
- [ ] Implement SQLite database layer (better-sqlite3 + Kysely)
- [ ] Create database migrations
- [ ] Implement API client with retry logic
- [ ] Create sync service (background)
- [ ] Build setup screen (token entry)

**Week 3: POS Features**
- [ ] Build product search component (barcode scanner support)
- [ ] Implement shopping cart
- [ ] Create customer lookup
- [ ] Build payment modal (cash, card, gift card)
- [ ] Integrate fiscal printer service (direct HTTP)
- [ ] Implement offline sales queueing
- [ ] Add thermal receipt printing

**Deliverables:**
- ✅ Windows desktop app (.exe)
- ✅ SQLite local database
- ✅ Complete POS flow (offline-capable)
- ✅ Sync service working
- ✅ Fiscal printer integration

---

### Phase 3: Testing & Deployment (Week 4)

**Testing:**
- [ ] Unit tests (backend services)
- [ ] Integration tests (API endpoints)
- [ ] E2E tests (kiosk app flow)
- [ ] Offline → online → offline transition tests
- [ ] Load testing (100+ queued sales)
- [ ] Multi-tenant isolation tests
- [ ] Security audit

**Deployment:**
- [ ] Create Windows installer (.exe)
- [ ] Setup auto-updater
- [ ] Write admin documentation (token management)
- [ ] Write user manual (kiosk operation)
- [ ] Create troubleshooting guide

**Deliverables:**
- ✅ Production-ready kiosk app
- ✅ API documentation
- ✅ Admin & user manuals
- ✅ Deployment guide

---

## Testing Strategy

### Backend Testing

```bash
# Unit tests
php artisan test --filter KioskAuthTest
php artisan test --filter KioskSyncServiceTest

# Feature tests
php artisan test --filter KioskSalesUploadTest

# Load tests
php artisan test --filter KioskLoadTest
```

### Kiosk App Testing

**Manual Test Scenarios:**

1. **Initial Setup**
   - [ ] Enter token → Register device → Download initial data

2. **Offline Sales**
   - [ ] Disconnect internet → Create sale → Sale queued locally
   - [ ] Reconnect internet → Sale uploaded automatically

3. **Sync Flow**
   - [ ] Products synced correctly
   - [ ] Customers synced correctly
   - [ ] Queued sales uploaded in batch

4. **Fiscal Printer**
   - [ ] Sale created → Fiscal receipt printed → Fiscal number saved

5. **Edge Cases**
   - [ ] Internet drops during sale creation
   - [ ] Fiscal printer offline
   - [ ] 100+ queued sales uploaded
   - [ ] Duplicate sale prevention

---

## Security Considerations

### Multi-Tenant Isolation

**Critical: All queries MUST be scoped by account_id**

```php
// WRONG (security breach!)
Product::where('sku', $sku)->first();

// CORRECT (account-scoped)
Product::where('account_id', $accountId)
    ->where('sku', $sku)
    ->first();

// BEST (use BelongsToAccount trait)
Product::byAccount($accountId)
    ->where('sku', $sku)
    ->first();
```

### Token Security

- ✅ Tokens are cryptographically random (64 chars)
- ✅ Stored encrypted in kiosk app config
- ✅ Can be revoked from admin dashboard
- ✅ Expire after 30 days of inactivity (configurable)
- ✅ Rate limited per device

### Data Privacy

- ✅ Kiosk only downloads its account's data
- ✅ SQLite database encrypted at rest (optional)
- ✅ All API requests over HTTPS
- ✅ No sensitive data in logs

---

## Deployment

### Backend Deployment

```bash
# Run migrations
php artisan migrate

# Generate kiosk token
php artisan kiosk:generate-token "Kiosk-Store-1" --account-id=123 --branch-id=5

# Clear cache
php artisan cache:clear
php artisan config:clear
```

### Kiosk App Deployment

**Build Windows Installer:**

```bash
# Build Tauri app
npm run build
npm run tauri build

# Output: src-tauri/target/release/bundle/msi/kiosk-pos_1.0.0_x64_en-US.msi
```

**Installation Steps:**
1. Install kiosk-pos.msi on Windows PC
2. Launch app → Setup screen
3. Enter kiosk token (from admin dashboard)
4. Click "Register Device"
5. Wait for initial sync (products, customers)
6. Start selling!

---

## Monitoring & Maintenance

### Admin Dashboard Features

**Kiosk Token Management:**
- View all kiosk devices
- Generate new tokens
- Revoke tokens
- View last heartbeat (online/offline status)
- View sync logs

**Sync Monitoring:**
- Last sync timestamp per device
- Sync errors and failures
- Queued sales count per device
- Network status per device

### Logs & Debugging

**Backend Logs:**
```bash
# Kiosk API logs
tail -f storage/logs/kiosk-api.log

# Sync errors
tail -f storage/logs/kiosk-sync-errors.log
```

**Kiosk App Logs:**
```
# Windows: C:\Users\{username}\AppData\Roaming\kiosk-pos\logs\
kiosk-app.log       # General app logs
sync-service.log    # Sync operations
fiscal-printer.log  # Fiscal printer communication
```

---

## Future Enhancements

### Phase 2 Features (Post-MVP)

- [ ] Real-time sync (WebSockets instead of polling)
- [ ] Multi-warehouse support (select warehouse in kiosk)
- [ ] Offline product import (USB drive)
- [ ] Loyalty card barcode scanning
- [ ] Customer display integration (second screen)
- [ ] Kitchen printer integration
- [ ] Mobile app version (iOS/Android)
- [ ] Cloud backup (encrypted SQLite backups)

---

## Appendix

### Glossary

- **Kiosk Device**: Windows PC running the kiosk app
- **Bearer Token**: Authentication token for API access
- **Delta Sync**: Syncing only changes since last sync
- **Offline Queue**: Local database of unsynchronized sales
- **Fiscal Printer**: Hardware device for tax-compliant receipts
- **Thermal Printer**: Receipt printer (non-fiscal)

### References

- Laravel Gates: `/app/Providers/AuthServiceProvider.php`
- Existing Fiscal Bridge: `/app/Http/Controllers/Api/FiscalPrinterBridgeController.php`
- POSController: `/app/Http/Controllers/POSController.php`
- Multi-tenant pattern: `BelongsToAccount` trait

---

## Support & Troubleshooting

### Common Issues

**1. Kiosk can't connect to backend**
- Check token validity: `php artisan kiosk:check-token {token}`
- Verify network connectivity
- Check API URL in kiosk config

**2. Fiscal printer not printing**
- Verify fiscal config in database
- Check IP address reachable: `ping 192.168.1.100`
- Check fiscal printer logs

**3. Sales not syncing**
- Check kiosk online status
- Verify queued sales: `SELECT * FROM sales_queue WHERE sync_status = 'queued'`
- Check sync logs in backend

**4. Products not updating**
- Force sync from kiosk app
- Check last sync timestamp
- Verify products exist in backend

---

**Document Version:** 1.0
**Last Updated:** 2024-01-15
**Author:** Claude
**Status:** Ready for Implementation
