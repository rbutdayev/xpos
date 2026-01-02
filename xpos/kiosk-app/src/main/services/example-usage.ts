/**
 * Example usage of Sync Service
 * This demonstrates how to initialize and use the sync service
 */

import { createApiClient } from './api-client';
import { createSyncService } from './sync-service';
import { createSyncDatabase } from '../database/sync-database';
import { createLogger } from './logger';

/**
 * Example: Initialize and start sync service
 */
export function initializeSyncService(apiUrl: string, token: string) {
  // 1. Create API client
  const apiClient = createApiClient({
    baseURL: apiUrl,
    token: token,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  });

  // 2. Create database instance
  const database = createSyncDatabase();

  // 3. Create logger
  const logger = createLogger('sync-service.log', 'info');

  // 4. Create sync service
  const syncService = createSyncService({
    apiClient,
    database,
    logger,
    syncIntervalSeconds: 300, // 5 minutes
    heartbeatIntervalSeconds: 30, // 30 seconds
    maxRetryAttempts: 3,
  });

  // 5. Setup event listeners
  setupEventListeners(syncService);

  // 6. Start sync service
  syncService.start();

  return { syncService, apiClient, database, logger };
}

/**
 * Setup event listeners for sync service
 */
function setupEventListeners(syncService: any) {
  // Connection events
  syncService.on('connection:online', (event: any) => {
    console.log('ONLINE:', event);
    // Update UI to show online status
  });

  syncService.on('connection:offline', (event: any) => {
    console.log('OFFLINE:', event);
    // Update UI to show offline status
  });

  // Sync events
  syncService.on('sync:started', (event: any) => {
    console.log('SYNC STARTED:', event);
    // Show sync progress bar in UI
  });

  syncService.on('sync:progress', (progress: any) => {
    console.log('SYNC PROGRESS:', progress);
    // Update progress bar: progress.percentage
  });

  syncService.on('sync:completed', (event: any) => {
    console.log('SYNC COMPLETED:', event);
    // Hide progress bar, show success message
  });

  syncService.on('sync:failed', (event: any) => {
    console.error('SYNC FAILED:', event);
    // Show error message in UI
  });
}

/**
 * Example: Manual sync trigger
 */
export async function triggerManualSync(syncService: any) {
  try {
    console.log('Triggering manual sync...');
    await syncService.triggerFullSync();
    console.log('Manual sync completed');
  } catch (error: any) {
    console.error('Manual sync failed:', error.message);
    throw error;
  }
}

/**
 * Example: Check connection status
 */
export function checkConnectionStatus(syncService: any) {
  const status = syncService.getSyncStatus();

  console.log('Connection Status:', {
    isOnline: status.isOnline,
    isSyncing: status.isSyncing,
    lastSyncTime: status.lastSyncTime,
    errors: status.errors,
  });

  return status;
}

/**
 * Example: Stop sync service
 */
export function stopSyncService(syncService: any) {
  console.log('Stopping sync service...');
  syncService.stop();
  console.log('Sync service stopped');
}

/**
 * Example: Complete initialization flow
 */
export async function initializeKioskApp() {
  try {
    // Configuration (normally loaded from config file or env)
    const config = {
      apiUrl: process.env.API_URL || 'https://api.yourxpos.com',
      token: process.env.KIOSK_TOKEN || 'ksk_your_token_here',
      deviceName: process.env.DEVICE_NAME || 'Kiosk-1',
      version: process.env.APP_VERSION || '1.0.0',
    };

    console.log('Initializing kiosk app...');

    // 1. Create API client
    const apiClient = createApiClient({
      baseURL: config.apiUrl,
      token: config.token,
    });

    // 2. Register device (if first time)
    try {
      const registrationResponse = await apiClient.register(
        config.deviceName,
        config.version,
        'windows'
      );

      console.log('Device registered:', registrationResponse);

      // Update sync config from server
      const syncConfig = registrationResponse.sync_config;
      console.log('Sync config:', syncConfig);
    } catch (error: any) {
      console.warn('Registration failed (may already be registered):', error.message);
    }

    // 3. Initialize sync service
    const { syncService, database } = initializeSyncService(config.apiUrl, config.token);

    // 4. Wait for initial sync
    console.log('Waiting for initial sync...');
    await syncService.triggerFullSync();

    console.log('Kiosk app initialized successfully');

    // 5. Return instances for use in app
    return {
      syncService,
      apiClient,
      database,
    };
  } catch (error: any) {
    console.error('Failed to initialize kiosk app:', error.message);
    throw error;
  }
}

/**
 * Example: Electron/Main process integration
 */
export function setupElectronIntegration(syncService: any, mainWindow: any) {
  // Forward sync events to renderer process (React UI)
  syncService.on('connection:online', (event: any) => {
    mainWindow.webContents.send('sync-event', { type: 'connection:online', data: event });
  });

  syncService.on('connection:offline', (event: any) => {
    mainWindow.webContents.send('sync-event', { type: 'connection:offline', data: event });
  });

  syncService.on('sync:started', (event: any) => {
    mainWindow.webContents.send('sync-event', { type: 'sync:started', data: event });
  });

  syncService.on('sync:progress', (progress: any) => {
    mainWindow.webContents.send('sync-event', { type: 'sync:progress', data: progress });
  });

  syncService.on('sync:completed', (event: any) => {
    mainWindow.webContents.send('sync-event', { type: 'sync:completed', data: event });
  });

  syncService.on('sync:failed', (event: any) => {
    mainWindow.webContents.send('sync-event', { type: 'sync:failed', data: event });
  });
}

/**
 * Example: IPC handlers for renderer process (React UI)
 */
export function setupIPCHandlers(ipcMain: any, syncService: any, database: any) {
  // Get sync status
  ipcMain.handle('get-sync-status', () => {
    return syncService.getSyncStatus();
  });

  // Trigger manual sync
  ipcMain.handle('trigger-sync', async () => {
    try {
      await syncService.triggerFullSync();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Get database statistics
  ipcMain.handle('get-db-stats', () => {
    return database.getStatistics();
  });

  // Search products
  ipcMain.handle('search-products', (_event: any, query: string) => {
    return database.searchProducts(query);
  });

  // Search customers
  ipcMain.handle('search-customers', (_event: any, query: string) => {
    return database.searchCustomers(query);
  });

  // Get online status
  ipcMain.handle('get-online-status', () => {
    return syncService.getOnlineStatus();
  });
}
