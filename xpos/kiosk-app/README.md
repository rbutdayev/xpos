# xPOS Kiosk - Offline-First POS Application

Background sync service implementation for the xPOS Kiosk Electron application.

## Overview

This is the **background sync service** for the xPOS offline-first kiosk application. It handles automatic synchronization of products, customers, sales data, and fiscal printer configuration between the local SQLite database and the xPOS Laravel backend.

### Key Features

- **Offline-First Architecture**: Works 100% offline with local SQLite database
- **Automatic Background Sync**: Syncs every 5 minutes when online
- **Heartbeat Monitoring**: Checks connectivity every 30 seconds
- **Delta Sync**: Only syncs changes since last sync (efficient)
- **Retry Logic**: Exponential backoff with 3 retry attempts
- **Event Emitters**: Real-time UI updates for sync progress
- **Error Handling**: Graceful handling of network, API, and database errors
- **File Logging**: Detailed logs saved to `logs/sync-service.log`

## Project Structure

```
kiosk-app/
├── src/
│   ├── main/                      # Electron main process
│   │   ├── database/
│   │   │   └── sync-database.ts   # Database interface (stub)
│   │   └── services/
│   │       ├── api-client.ts      # API client with retry logic
│   │       ├── sync-service.ts    # Background sync service
│   │       ├── logger.ts          # File & console logger
│   │       └── example-usage.ts   # Usage examples
│   │
│   ├── renderer/                  # React UI (to be implemented)
│   │
│   └── shared/
│       └── types.ts               # TypeScript type definitions
│
├── logs/                          # Log files
│   └── sync-service.log
│
└── package.json
```

## Services Implemented

### 1. API Client (`api-client.ts`)

HTTP client with retry logic and authentication.

**Features:**
- Bearer token authentication
- Retry logic with exponential backoff
- Request/response interceptors
- Configurable timeouts (5s heartbeat, 30s sync)
- Error handling for 401, 429, 500 errors
- Automatic jitter to prevent thundering herd

**API Methods:**
- `register()` - Register device
- `heartbeat()` - Check connectivity
- `getProductsDelta()` - Sync products
- `getCustomersDelta()` - Sync customers
- `getFiscalConfig()` - Get fiscal printer config
- `uploadSales()` - Batch upload queued sales
- `searchProducts()` - Search products
- `searchCustomers()` - Search customers

### 2. Sync Service (`sync-service.ts`)

Core background synchronization service.

**Features:**
- Automatic background sync (5 min interval)
- Heartbeat monitoring (30 sec interval)
- Delta sync for products & customers
- Batch upload for queued sales
- Online/offline state management
- Event emission for UI updates

**Methods:**
- `start()` - Start sync service
- `stop()` - Stop sync service
- `triggerFullSync()` - Manual sync trigger
- `getOnlineStatus()` - Get connection status
- `getSyncStatus()` - Get detailed sync status

**Events Emitted:**
- `connection:online` - Connection restored
- `connection:offline` - Connection lost
- `sync:started` - Sync started
- `sync:progress` - Sync progress update
- `sync:completed` - Sync completed successfully
- `sync:failed` - Sync failed with errors

### 3. Logger (`logger.ts`)

File and console logging utility.

**Features:**
- Logs to both console and file
- Log levels: debug, info, warn, error
- Automatic log rotation (10MB max, 5 backups)
- Platform-specific log directories
- Recent logs retrieval

**Log Locations:**
- **Development**: `./logs/sync-service.log`
- **Windows**: `%APPDATA%\kiosk-pos\logs\`
- **macOS**: `~/Library/Application Support/kiosk-pos/logs/`
- **Linux**: `~/.config/kiosk-pos/logs/`

### 4. Database Interface (`sync-database.ts`)

In-memory stub implementation (replace with SQLite).

**Features:**
- CRUD operations for products, customers, sales
- Sync metadata tracking
- Sales queue management
- Database statistics

**Methods:**
- `getQueuedSales()` - Get unsynchronized sales
- `markSaleAsSynced()` - Mark sale as synced
- `upsertProducts()` - Insert/update products
- `deleteProducts()` - Delete products
- `upsertCustomers()` - Insert/update customers
- `updateFiscalConfig()` - Update fiscal config
- `getLastSyncTime()` - Get last sync timestamp
- `updateSyncMetadata()` - Update sync metadata

## Usage Examples

### Initialize Sync Service

```typescript
import { createApiClient } from './services/api-client';
import { createSyncService } from './services/sync-service';
import { createSyncDatabase } from './database/sync-database';

// 1. Create API client
const apiClient = createApiClient({
  baseURL: 'https://api.yourxpos.com',
  token: 'ksk_your_token_here',
  timeout: 30000,
  retryAttempts: 3,
});

// 2. Create database
const database = createSyncDatabase();

// 3. Create sync service
const syncService = createSyncService({
  apiClient,
  database,
  syncIntervalSeconds: 300,      // 5 minutes
  heartbeatIntervalSeconds: 30,  // 30 seconds
  maxRetryAttempts: 3,
});

// 4. Setup event listeners
syncService.on('connection:online', (event) => {
  console.log('ONLINE:', event);
});

syncService.on('sync:progress', (progress) => {
  console.log(`Sync progress: ${progress.percentage}%`);
});

// 5. Start sync service
syncService.start();
```

### Manual Sync Trigger

```typescript
// Trigger full sync manually
try {
  await syncService.triggerFullSync();
  console.log('Sync completed');
} catch (error) {
  console.error('Sync failed:', error);
}
```

### Check Connection Status

```typescript
const status = syncService.getSyncStatus();

console.log('Connection:', status.isOnline ? 'ONLINE' : 'OFFLINE');
console.log('Syncing:', status.isSyncing);
console.log('Last sync:', status.lastSyncTime);
console.log('Errors:', status.errors);
```

### Electron IPC Integration

```typescript
// In main process
import { ipcMain } from 'electron';

ipcMain.handle('get-sync-status', () => {
  return syncService.getSyncStatus();
});

ipcMain.handle('trigger-sync', async () => {
  try {
    await syncService.triggerFullSync();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Forward events to renderer
syncService.on('sync:progress', (progress) => {
  mainWindow.webContents.send('sync-event', {
    type: 'sync:progress',
    data: progress,
  });
});
```

### React UI Integration

```tsx
// In React component
import { useEffect, useState } from 'react';

function SyncStatus() {
  const [status, setStatus] = useState({ isOnline: false, isSyncing: false });

  useEffect(() => {
    // Listen for sync events from main process
    window.electron.on('sync-event', (event) => {
      if (event.type === 'connection:online') {
        setStatus(prev => ({ ...prev, isOnline: true }));
      } else if (event.type === 'sync:progress') {
        console.log('Sync progress:', event.data.percentage);
      }
    });

    // Get initial status
    window.electron.invoke('get-sync-status').then(setStatus);
  }, []);

  return (
    <div>
      <div>Status: {status.isOnline ? '🟢 Online' : '🔴 Offline'}</div>
      <div>Syncing: {status.isSyncing ? 'Yes' : 'No'}</div>
      <button onClick={() => window.electron.invoke('trigger-sync')}>
        Sync Now
      </button>
    </div>
  );
}
```

## Configuration

### Environment Variables

```bash
# API Configuration
API_URL=https://api.yourxpos.com
KIOSK_TOKEN=ksk_your_token_here

# Device Configuration
DEVICE_NAME=Kiosk-Store-1
APP_VERSION=1.0.0

# Sync Configuration (optional, server provides defaults)
SYNC_INTERVAL_SECONDS=300
HEARTBEAT_INTERVAL_SECONDS=30
MAX_RETRY_ATTEMPTS=3
```

### Sync Configuration

Default sync configuration (can be overridden by server):

```typescript
{
  syncIntervalSeconds: 300,       // 5 minutes
  heartbeatIntervalSeconds: 30,   // 30 seconds
  maxRetryAttempts: 3,            // 3 retries with exponential backoff
}
```

## API Endpoints Used

All endpoints require `Authorization: Bearer <token>` header.

### Authentication
- `POST /api/kiosk/register` - Register device
- `GET /api/kiosk/heartbeat` - Check connectivity

### Sync
- `GET /api/kiosk/sync/products/delta?since={timestamp}` - Get product changes
- `GET /api/kiosk/sync/customers/delta?since={timestamp}` - Get customer changes
- `GET /api/kiosk/fiscal-config` - Get fiscal printer config

### Sales
- `POST /api/kiosk/sales/upload` - Batch upload queued sales

## Error Handling

### Network Errors
- Automatic retry with exponential backoff
- Max 3 retry attempts
- Offline queue for failed sales

### API Errors
- **401 Unauthorized**: Token invalid/revoked (no retry)
- **429 Rate Limited**: Retry with exponential backoff
- **500 Server Error**: Retry with exponential backoff

### Database Errors
- Graceful error logging
- Transaction rollback on failures
- Retry on next sync cycle

## Logging

### Log Levels
- `debug` - Detailed debugging information
- `info` - General information messages
- `warn` - Warning messages
- `error` - Error messages

### Log Rotation
- Max file size: 10MB
- Max backups: 5
- Automatic rotation when limit reached

### Reading Logs

```typescript
import { syncLogger } from './services/logger';

// Read recent logs (last 100 lines)
const recentLogs = syncLogger.readRecentLogs(100);

// Get log file path
const logPath = syncLogger.getLogFilePath();
console.log('Logs saved to:', logPath);
```

## TypeScript Types

All types are defined in `src/shared/types.ts`:

- `ApiClientConfig` - API client configuration
- `Product` - Product data structure
- `Customer` - Customer data structure
- `FiscalConfig` - Fiscal printer configuration
- `Sale` - Sale data structure
- `QueuedSale` - Queued sale with sync status
- `SyncEvent` - Sync event structure
- `SyncProgressEvent` - Sync progress event

## Next Steps

### Required Implementations

1. **SQLite Database Layer**
   - Replace in-memory stub with actual SQLite (better-sqlite3)
   - Implement schema migrations
   - Use Kysely for type-safe queries

2. **React UI**
   - Setup screen (token entry)
   - POS screen (sales interface)
   - Sync status dashboard
   - Settings screen

3. **Fiscal Printer Service**
   - Direct HTTP integration with fiscal printers
   - Support for multiple providers (Caspos, Datecs, etc.)
   - Print receipt and get fiscal number

4. **Electron Main Process**
   - Window management
   - IPC handlers
   - Auto-updater
   - System tray integration

## Testing

### Manual Testing

1. **Offline Sales Flow**
   ```bash
   # Disconnect internet
   # Create sales in app
   # Sales queued locally
   # Reconnect internet
   # Verify sales auto-upload
   ```

2. **Sync Flow**
   ```bash
   # Start app
   # Wait for initial sync
   # Verify products/customers loaded
   # Add products in backend
   # Wait for periodic sync
   # Verify new products appear
   ```

3. **Error Handling**
   ```bash
   # Disconnect during sync
   # Verify graceful offline transition
   # Invalid token test
   # Rate limiting test
   ```

## Build & Deploy

### Development

```bash
npm install
npm run dev
```

### Production Build

```bash
npm run build
npm run package:win   # Windows installer
```

### Output

- **Windows**: `dist-electron/xPOS Kiosk Setup 1.0.0.exe`
- **Portable**: `dist-electron/xPOS Kiosk 1.0.0.exe`

## Dependencies

### Core
- **axios** - HTTP client
- **better-sqlite3** - SQLite database
- **kysely** - Type-safe SQL query builder
- **electron** - Desktop app framework

### UI
- **react** - UI framework
- **zustand** - State management
- **react-query** - Data fetching & caching

## License

MIT

## Support

For issues or questions, contact the xPOS development team.

---

**Document Version**: 1.0
**Last Updated**: 2026-01-03
**Status**: Sync Service Implemented ✅
