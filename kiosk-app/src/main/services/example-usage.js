"use strict";
/**
 * Example usage of Sync Service
 * This demonstrates how to initialize and use the sync service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSyncService = initializeSyncService;
exports.triggerManualSync = triggerManualSync;
exports.checkConnectionStatus = checkConnectionStatus;
exports.stopSyncService = stopSyncService;
exports.initializeKioskApp = initializeKioskApp;
exports.setupElectronIntegration = setupElectronIntegration;
exports.setupIPCHandlers = setupIPCHandlers;
const api_client_1 = require("./api-client");
const sync_service_1 = require("./sync-service");
const sync_database_1 = require("../database/sync-database");
const logger_1 = require("./logger");
/**
 * Example: Initialize and start sync service
 */
function initializeSyncService(apiUrl, token) {
    // 1. Create API client
    const apiClient = (0, api_client_1.createApiClient)({
        baseURL: apiUrl,
        token: token,
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
    });
    // 2. Create database instance
    const database = (0, sync_database_1.createSyncDatabase)();
    // 3. Create logger
    const logger = (0, logger_1.createLogger)('sync-service.log', 'info');
    // 4. Create sync service
    const syncService = (0, sync_service_1.createSyncService)({
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
function setupEventListeners(syncService) {
    // Connection events
    syncService.on('connection:online', (event) => {
        console.log('ONLINE:', event);
        // Update UI to show online status
    });
    syncService.on('connection:offline', (event) => {
        console.log('OFFLINE:', event);
        // Update UI to show offline status
    });
    // Sync events
    syncService.on('sync:started', (event) => {
        console.log('SYNC STARTED:', event);
        // Show sync progress bar in UI
    });
    syncService.on('sync:progress', (progress) => {
        console.log('SYNC PROGRESS:', progress);
        // Update progress bar: progress.percentage
    });
    syncService.on('sync:completed', (event) => {
        console.log('SYNC COMPLETED:', event);
        // Hide progress bar, show success message
    });
    syncService.on('sync:failed', (event) => {
        console.error('SYNC FAILED:', event);
        // Show error message in UI
    });
}
/**
 * Example: Manual sync trigger
 */
async function triggerManualSync(syncService) {
    try {
        console.log('Triggering manual sync...');
        await syncService.triggerFullSync();
        console.log('Manual sync completed');
    }
    catch (error) {
        console.error('Manual sync failed:', error.message);
        throw error;
    }
}
/**
 * Example: Check connection status
 */
function checkConnectionStatus(syncService) {
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
function stopSyncService(syncService) {
    console.log('Stopping sync service...');
    syncService.stop();
    console.log('Sync service stopped');
}
/**
 * Example: Complete initialization flow
 */
async function initializeKioskApp() {
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
        const apiClient = (0, api_client_1.createApiClient)({
            baseURL: config.apiUrl,
            token: config.token,
        });
        // 2. Register device (if first time)
        try {
            const registrationResponse = await apiClient.register(config.deviceName, config.version, 'windows');
            console.log('Device registered:', registrationResponse);
            // Update sync config from server
            const syncConfig = registrationResponse.sync_config;
            console.log('Sync config:', syncConfig);
        }
        catch (error) {
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
    }
    catch (error) {
        console.error('Failed to initialize kiosk app:', error.message);
        throw error;
    }
}
/**
 * Example: Electron/Main process integration
 */
function setupElectronIntegration(syncService, mainWindow) {
    // Forward sync events to renderer process (React UI)
    syncService.on('connection:online', (event) => {
        mainWindow.webContents.send('sync-event', { type: 'connection:online', data: event });
    });
    syncService.on('connection:offline', (event) => {
        mainWindow.webContents.send('sync-event', { type: 'connection:offline', data: event });
    });
    syncService.on('sync:started', (event) => {
        mainWindow.webContents.send('sync-event', { type: 'sync:started', data: event });
    });
    syncService.on('sync:progress', (progress) => {
        mainWindow.webContents.send('sync-event', { type: 'sync:progress', data: progress });
    });
    syncService.on('sync:completed', (event) => {
        mainWindow.webContents.send('sync-event', { type: 'sync:completed', data: event });
    });
    syncService.on('sync:failed', (event) => {
        mainWindow.webContents.send('sync-event', { type: 'sync:failed', data: event });
    });
}
/**
 * Example: IPC handlers for renderer process (React UI)
 */
function setupIPCHandlers(ipcMain, syncService, database) {
    // Get sync status
    ipcMain.handle('get-sync-status', () => {
        return syncService.getSyncStatus();
    });
    // Trigger manual sync
    ipcMain.handle('trigger-sync', async () => {
        try {
            await syncService.triggerFullSync();
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    // Get database statistics
    ipcMain.handle('get-db-stats', () => {
        return database.getStatistics();
    });
    // Search products
    ipcMain.handle('search-products', (_event, query) => {
        return database.searchProducts(query);
    });
    // Search customers
    ipcMain.handle('search-customers', (_event, query) => {
        return database.searchCustomers(query);
    });
    // Get online status
    ipcMain.handle('get-online-status', () => {
        return syncService.getOnlineStatus();
    });
}
//# sourceMappingURL=example-usage.js.map