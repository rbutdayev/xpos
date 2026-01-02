# Quick Start Guide - Sync Service

## Installation

```bash
cd kiosk-app
npm install
```

## Running the Test/Demo

```bash
# Set environment variables (optional)
export API_URL=https://api.yourxpos.com
export KIOSK_TOKEN=ksk_your_token_here

# Run the test
npx ts-node src/main/services/sync-service.test.ts
```

## Basic Usage

### 1. Initialize Sync Service

```typescript
import {
  createApiClient,
  createSyncService,
  createSyncDatabase
} from './services';

// Create components
const apiClient = createApiClient({
  baseURL: 'https://api.yourxpos.com',
  token: 'ksk_your_token_here',
});

const database = createSyncDatabase();

const syncService = createSyncService({
  apiClient,
  database,
});

// Setup event listeners
syncService.on('connection:online', (event) => {
  console.log('Online!', event);
});

syncService.on('sync:progress', (progress) => {
  console.log(`Syncing: ${progress.percentage}%`);
});

// Start sync
syncService.start();
```

### 2. Trigger Manual Sync

```typescript
// Trigger sync
await syncService.triggerFullSync();

// Check status
const status = syncService.getSyncStatus();
console.log('Online:', status.isOnline);
console.log('Syncing:', status.isSyncing);
console.log('Last sync:', status.lastSyncTime);
```

### 3. Check Connection

```typescript
const isOnline = syncService.getOnlineStatus();
console.log('Connection:', isOnline ? 'ONLINE' : 'OFFLINE');
```

### 4. Stop Sync

```typescript
syncService.stop();
```

## Event Handling

```typescript
// Connection events
syncService.on('connection:online', (event) => {
  // Update UI to show online badge
});

syncService.on('connection:offline', (event) => {
  // Update UI to show offline badge
});

// Sync events
syncService.on('sync:started', (event) => {
  // Show sync progress bar
});

syncService.on('sync:progress', (progress) => {
  // Update progress bar: progress.percentage
  // progress.type: 'products' | 'customers' | 'sales'
  // progress.current, progress.total
});

syncService.on('sync:completed', (event) => {
  // Hide progress bar
  // Show success notification
});

syncService.on('sync:failed', (event) => {
  // Show error message: event.data.error
});
```

## Working with Database

```typescript
// Search products
const products = database.searchProducts('test');

// Search customers
const customers = database.searchCustomers('john');

// Get statistics
const stats = database.getStatistics();
console.log('Products:', stats.productsCount);
console.log('Customers:', stats.customersCount);
console.log('Queued sales:', stats.queuedSalesCount);

// Add sale to queue (offline sale)
database.addSaleToQueue({
  local_id: 1,
  account_id: 1,
  branch_id: 1,
  customer_id: null,
  items: [
    {
      product_id: 1,
      variant_id: null,
      quantity: 2,
      unit_price: 29.99,
      discount_amount: 0,
    }
  ],
  payments: [{ method: 'cash', amount: 59.98 }],
  subtotal: 59.98,
  tax_amount: 0,
  discount_amount: 0,
  total: 59.98,
  payment_status: 'paid',
  created_at: new Date().toISOString(),
  sync_status: 'queued',
  retry_count: 0,
});
```

## Logging

```typescript
import { createLogger } from './services';

const logger = createLogger('my-service.log', 'debug');

logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', { context: 'additional data' });

// Get log file path
console.log('Logs:', logger.getLogFilePath());

// Read recent logs
const recentLogs = logger.readRecentLogs(100);
console.log(recentLogs);
```

## Configuration

### Environment Variables

```bash
# .env file
API_URL=https://api.yourxpos.com
KIOSK_TOKEN=ksk_abc123...
DEVICE_NAME=Kiosk-Store-1
APP_VERSION=1.0.0
```

### Sync Configuration

```typescript
const syncService = createSyncService({
  apiClient,
  database,
  syncIntervalSeconds: 300,       // 5 minutes
  heartbeatIntervalSeconds: 30,   // 30 seconds
  maxRetryAttempts: 3,
});
```

### API Client Configuration

```typescript
const apiClient = createApiClient({
  baseURL: 'https://api.yourxpos.com',
  token: 'ksk_your_token_here',
  timeout: 30000,        // 30 seconds
  retryAttempts: 3,      // 3 retries
  retryDelay: 1000,      // 1 second base delay
});
```

## Error Handling

```typescript
try {
  await syncService.triggerFullSync();
} catch (error) {
  if (error.response?.status === 401) {
    // Invalid token
    console.error('Authentication failed');
  } else if (error.response?.status === 429) {
    // Rate limited
    console.error('Too many requests');
  } else if (!error.response) {
    // Network error
    console.error('Network error');
  } else {
    // Other error
    console.error('Sync failed:', error.message);
  }
}
```

## Next Steps

1. **Implement SQLite Database**
   - Replace in-memory stub with better-sqlite3
   - See: `src/main/database/sync-database.ts`

2. **Integrate with Electron**
   - Setup IPC handlers
   - Forward events to renderer
   - See: `src/main/services/example-usage.ts`

3. **Build React UI**
   - Create sync status component
   - Show connection indicator
   - Display sync progress

## Troubleshooting

### Sync not working?

1. Check API URL and token
2. Check network connectivity
3. Check logs: `logs/sync-service.log`
4. Check error events

### Connection always offline?

1. Verify API URL is correct
2. Check CORS settings on backend
3. Check firewall settings
4. Test heartbeat endpoint manually

### Sales not uploading?

1. Check queued sales: `database.getQueuedSales()`
2. Check retry count (max 3 attempts)
3. Check sync errors: `syncService.getSyncStatus().errors`
4. Check backend logs

## Support

For detailed documentation, see `README.md`

For implementation details, see `IMPLEMENTATION_SUMMARY.md`

For backend API spec, see `KIOSK_IMPLEMENTATION.md`
