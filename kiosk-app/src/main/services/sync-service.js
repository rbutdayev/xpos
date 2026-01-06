"use strict";
/**
 * Background Sync Service
 * Handles automatic synchronization of products, customers, sales, and config
 * with retry logic, offline support, and event emission
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
exports.createSyncService = createSyncService;
const events_1 = require("events");
const logger_1 = require("./logger");
class SyncService extends events_1.EventEmitter {
    constructor(config) {
        super();
        // Connection state
        this.isOnline = false;
        this.wasOffline = true;
        // Timers
        this.heartbeatInterval = null;
        this.syncInterval = null;
        // Sync state
        this.isSyncing = false;
        this.lastSyncTime = null;
        this.syncErrors = [];
        this.apiClient = config.apiClient;
        this.database = config.database;
        this.logger = config.logger || logger_1.syncLogger;
        // Default sync config (can be overridden by server)
        this.syncIntervalSeconds = config.syncIntervalSeconds || 300; // 5 minutes
        this.heartbeatIntervalSeconds = config.heartbeatIntervalSeconds || 30; // 30 seconds
        this.maxRetryAttempts = config.maxRetryAttempts || 3;
        this.logger.info('SyncService initialized', {
            syncInterval: this.syncIntervalSeconds,
            heartbeatInterval: this.heartbeatIntervalSeconds,
            maxRetries: this.maxRetryAttempts,
        });
    }
    /**
     * Start background sync service
     */
    start() {
        this.logger.info('Starting sync service...');
        // Start heartbeat monitoring
        this.startHeartbeat();
        // Start periodic sync
        this.startPeriodicSync();
        this.logger.info('Sync service started');
    }
    /**
     * Stop sync service
     */
    stop() {
        this.logger.info('Stopping sync service...');
        // Clear intervals
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        this.isOnline = false;
        this.isSyncing = false;
        this.logger.info('Sync service stopped');
    }
    /**
     * Start heartbeat monitoring
     * Checks connectivity every N seconds
     */
    startHeartbeat() {
        this.logger.debug('Starting heartbeat monitoring');
        // Immediate heartbeat check
        this.checkHeartbeat();
        // Schedule periodic heartbeat checks
        this.heartbeatInterval = setInterval(() => {
            this.checkHeartbeat();
        }, this.heartbeatIntervalSeconds * 1000);
    }
    /**
     * Check heartbeat (connectivity)
     */
    async checkHeartbeat() {
        try {
            const online = await this.apiClient.heartbeat();
            if (online) {
                this.handleOnlineState();
            }
            else {
                this.handleOfflineState();
            }
        }
        catch (error) {
            this.handleOfflineState();
        }
    }
    /**
     * Handle transition to online state
     */
    handleOnlineState() {
        const wasOffline = !this.isOnline;
        this.isOnline = true;
        if (wasOffline) {
            this.logger.info('Connection restored - now ONLINE');
            this.emitEvent('connection:online', { timestamp: new Date().toISOString() });
            // Trigger full sync when connection is restored
            this.triggerFullSync().catch((error) => {
                this.logger.error('Failed to sync after connection restored', { error: error.message });
            });
        }
    }
    /**
     * Handle transition to offline state
     */
    handleOfflineState() {
        if (this.isOnline) {
            this.logger.warn('Connection lost - now OFFLINE');
            this.emitEvent('connection:offline', { timestamp: new Date().toISOString() });
        }
        this.isOnline = false;
    }
    /**
     * Start periodic sync
     * Syncs every N minutes when online
     */
    startPeriodicSync() {
        this.logger.debug('Starting periodic sync', { intervalSeconds: this.syncIntervalSeconds });
        // Schedule periodic sync
        this.syncInterval = setInterval(() => {
            if (this.isOnline && !this.isSyncing) {
                this.triggerFullSync().catch((error) => {
                    this.logger.error('Periodic sync failed', { error: error.message });
                });
            }
            else if (!this.isOnline) {
                this.logger.debug('Skipping periodic sync - offline');
            }
            else if (this.isSyncing) {
                this.logger.debug('Skipping periodic sync - sync already in progress');
            }
        }, this.syncIntervalSeconds * 1000);
    }
    /**
     * Trigger full sync manually
     * Public method to allow manual sync from UI
     */
    async triggerFullSync() {
        if (this.isSyncing) {
            this.logger.warn('Sync already in progress, skipping');
            return;
        }
        if (!this.isOnline) {
            this.logger.warn('Cannot sync - offline');
            throw new Error('Cannot sync while offline');
        }
        this.isSyncing = true;
        this.syncErrors = [];
        this.logger.info('Starting full sync...');
        this.emitEvent('sync:started', { timestamp: new Date().toISOString() });
        try {
            // 1. Upload queued sales (highest priority)
            await this.uploadQueuedSales();
            // 2. Download product updates
            await this.syncProducts();
            // 3. Download customer updates
            await this.syncCustomers();
            // 4. Download fiscal config
            await this.syncFiscalConfig();
            this.lastSyncTime = new Date();
            this.logger.info('Full sync completed successfully', {
                duration: this.getLastSyncDuration(),
            });
            this.emitEvent('sync:completed', {
                timestamp: new Date().toISOString(),
                errors: this.syncErrors,
            });
        }
        catch (error) {
            this.logger.error('Full sync failed', { error: error.message });
            this.emitEvent('sync:failed', {
                timestamp: new Date().toISOString(),
                error: error.message,
                errors: this.syncErrors,
            });
            throw error;
        }
        finally {
            this.isSyncing = false;
        }
    }
    /**
     * Upload queued sales to backend
     */
    async uploadQueuedSales() {
        this.logger.info('Starting sales upload...');
        try {
            const queuedSales = this.database.getQueuedSales();
            if (queuedSales.length === 0) {
                this.logger.debug('No queued sales to upload');
                return;
            }
            this.logger.info(`Uploading ${queuedSales.length} queued sales...`);
            this.emitProgress('sales', 0, queuedSales.length);
            // Filter out sales that exceeded max retry attempts
            const validSales = queuedSales.filter((sale) => sale.retry_count < this.maxRetryAttempts);
            if (validSales.length === 0) {
                this.logger.warn('All queued sales exceeded max retry attempts');
                return;
            }
            if (validSales.length < queuedSales.length) {
                this.logger.warn(`${queuedSales.length - validSales.length} sales exceeded max retries and will be skipped`);
            }
            // Upload in batches
            const response = await this.apiClient.uploadSales(validSales);
            // Process results
            if (response.success && response.results) {
                let successCount = 0;
                for (const result of response.results) {
                    try {
                        this.database.markSaleAsSynced(result.local_id, result.server_sale_id);
                        successCount++;
                    }
                    catch (error) {
                        this.logger.error('Failed to mark sale as synced', {
                            localId: result.local_id,
                            error: error.message,
                        });
                    }
                }
                this.logger.info(`Successfully uploaded ${successCount} sales`);
                this.emitProgress('sales', successCount, queuedSales.length);
            }
            // Process failed sales
            if (response.failed && response.failed.length > 0) {
                for (const failed of response.failed) {
                    try {
                        this.database.markSaleAsFailed(failed.local_id, failed.error);
                        this.database.updateSaleRetryCount(failed.local_id);
                        this.syncErrors.push(`Sale ${failed.local_id}: ${failed.error}`);
                    }
                    catch (error) {
                        this.logger.error('Failed to mark sale as failed', {
                            localId: failed.local_id,
                            error: error.message,
                        });
                    }
                }
                this.logger.warn(`${response.failed.length} sales failed to upload`);
            }
        }
        catch (error) {
            this.logger.error('Sales upload failed', { error: error.message });
            // Update retry counts for all queued sales
            const queuedSales = this.database.getQueuedSales();
            for (const sale of queuedSales) {
                this.database.updateSaleRetryCount(sale.local_id);
            }
            this.syncErrors.push(`Sales upload: ${error.message}`);
            throw error;
        }
    }
    /**
     * Sync products (delta sync)
     */
    async syncProducts() {
        this.logger.info('Starting products sync...');
        try {
            const lastSync = this.database.getLastSyncTime('products');
            this.logger.debug('Fetching products delta', { since: lastSync || 'initial' });
            const delta = await this.apiClient.getProductsDelta(lastSync || undefined);
            const totalChanges = delta.products.length + delta.deleted_ids.length;
            if (totalChanges === 0) {
                this.logger.debug('No product changes');
                return;
            }
            this.logger.info(`Syncing ${delta.products.length} products, deleting ${delta.deleted_ids.length}`);
            this.emitProgress('products', 0, totalChanges);
            // Update products
            if (delta.products.length > 0) {
                this.database.upsertProducts(delta.products);
                this.logger.debug(`Upserted ${delta.products.length} products`);
            }
            // Delete products
            if (delta.deleted_ids.length > 0) {
                this.database.deleteProducts(delta.deleted_ids);
                this.logger.debug(`Deleted ${delta.deleted_ids.length} products`);
            }
            // Update sync metadata
            this.database.updateSyncMetadata('products', delta.sync_timestamp);
            this.logger.info('Products sync completed', { totalChanges });
            this.emitProgress('products', totalChanges, totalChanges);
        }
        catch (error) {
            this.logger.error('Products sync failed', { error: error.message });
            this.syncErrors.push(`Products sync: ${error.message}`);
            throw error;
        }
    }
    /**
     * Sync customers (delta sync)
     */
    async syncCustomers() {
        this.logger.info('Starting customers sync...');
        try {
            const lastSync = this.database.getLastSyncTime('customers');
            this.logger.debug('Fetching customers delta', { since: lastSync || 'initial' });
            const delta = await this.apiClient.getCustomersDelta(lastSync || undefined);
            if (delta.customers.length === 0) {
                this.logger.debug('No customer changes');
                return;
            }
            this.logger.info(`Syncing ${delta.customers.length} customers`);
            this.emitProgress('customers', 0, delta.customers.length);
            // Update customers
            this.database.upsertCustomers(delta.customers);
            // Update sync metadata
            this.database.updateSyncMetadata('customers', delta.sync_timestamp);
            this.logger.info('Customers sync completed', { count: delta.customers.length });
            this.emitProgress('customers', delta.customers.length, delta.customers.length);
        }
        catch (error) {
            this.logger.error('Customers sync failed', { error: error.message });
            this.syncErrors.push(`Customers sync: ${error.message}`);
            throw error;
        }
    }
    /**
     * Sync fiscal printer configuration
     */
    async syncFiscalConfig() {
        this.logger.info('Starting fiscal config sync...');
        try {
            const response = await this.apiClient.getFiscalConfig();
            if (!response.success || !response.config) {
                this.logger.warn('No fiscal config available');
                return;
            }
            this.logger.info('Updating fiscal config', {
                provider: response.config.provider,
                ip: response.config.ip_address,
            });
            // Update fiscal config
            this.database.updateFiscalConfig(response.config);
            // Update sync metadata
            this.database.updateSyncMetadata('config', new Date().toISOString());
            this.logger.info('Fiscal config sync completed');
        }
        catch (error) {
            this.logger.error('Fiscal config sync failed', { error: error.message });
            this.syncErrors.push(`Fiscal config sync: ${error.message}`);
            // Don't throw - fiscal config is not critical
        }
    }
    /**
     * Get online status
     */
    getOnlineStatus() {
        return this.isOnline;
    }
    /**
     * Get sync status
     */
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            isSyncing: this.isSyncing,
            lastSyncTime: this.lastSyncTime,
            errors: this.syncErrors,
        };
    }
    /**
     * Update sync configuration from server
     */
    updateSyncConfig(config) {
        this.logger.info('Updating sync configuration', config);
        const restartNeeded = this.syncIntervalSeconds !== config.sync_interval_seconds ||
            this.heartbeatIntervalSeconds !== config.heartbeat_interval_seconds;
        this.syncIntervalSeconds = config.sync_interval_seconds;
        this.heartbeatIntervalSeconds = config.heartbeat_interval_seconds;
        this.maxRetryAttempts = config.max_retry_attempts;
        if (restartNeeded) {
            this.logger.info('Restarting sync service with new configuration');
            this.stop();
            this.start();
        }
    }
    /**
     * Emit sync event
     */
    emitEvent(type, data) {
        const event = {
            type,
            timestamp: new Date().toISOString(),
            data,
        };
        this.emit(type, event);
    }
    /**
     * Emit progress event
     */
    emitProgress(type, current, total) {
        const percentage = total > 0 ? Math.round((current / total) * 100) : 100;
        const progressEvent = {
            type,
            current,
            total,
            percentage,
        };
        this.emit('sync:progress', progressEvent);
    }
    /**
     * Get last sync duration
     */
    getLastSyncDuration() {
        if (!this.lastSyncTime) {
            return 'N/A';
        }
        const duration = Date.now() - this.lastSyncTime.getTime();
        return `${Math.round(duration / 1000)}s`;
    }
}
exports.SyncService = SyncService;
/**
 * Create sync service instance
 */
function createSyncService(config) {
    return new SyncService(config);
}
//# sourceMappingURL=sync-service.js.map