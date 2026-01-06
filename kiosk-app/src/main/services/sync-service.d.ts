/**
 * Background Sync Service
 * Handles automatic synchronization of products, customers, sales, and config
 * with retry logic, offline support, and event emission
 */
import { EventEmitter } from 'events';
import { ApiClient } from './api-client';
import { Logger } from './logger';
import { QueuedSale, SyncConfig } from '../../shared/types';
/**
 * Database interface - will be implemented by database layer
 * For now, we define the interface that sync service expects
 */
export interface ISyncDatabase {
    getQueuedSales(): QueuedSale[];
    markSaleAsSynced(localId: number, serverSaleId: number): void;
    markSaleAsFailed(localId: number, error: string): void;
    updateSaleRetryCount(localId: number): void;
    upsertProducts(products: any[]): void;
    deleteProducts(productIds: number[]): void;
    upsertCustomers(customers: any[]): void;
    updateFiscalConfig(config: any): void;
    getFiscalConfig(): any;
    getLastSyncTime(syncType: 'products' | 'customers' | 'config'): string | null;
    updateSyncMetadata(syncType: 'products' | 'customers' | 'config', timestamp: string): void;
}
export interface SyncServiceConfig {
    apiClient: ApiClient;
    database: ISyncDatabase;
    logger?: Logger;
    syncIntervalSeconds?: number;
    heartbeatIntervalSeconds?: number;
    maxRetryAttempts?: number;
}
export declare class SyncService extends EventEmitter {
    private apiClient;
    private database;
    private logger;
    private syncIntervalSeconds;
    private heartbeatIntervalSeconds;
    private maxRetryAttempts;
    private isOnline;
    private wasOffline;
    private heartbeatInterval;
    private syncInterval;
    private isSyncing;
    private lastSyncTime;
    private syncErrors;
    constructor(config: SyncServiceConfig);
    /**
     * Start background sync service
     */
    start(): void;
    /**
     * Stop sync service
     */
    stop(): void;
    /**
     * Start heartbeat monitoring
     * Checks connectivity every N seconds
     */
    private startHeartbeat;
    /**
     * Check heartbeat (connectivity)
     */
    private checkHeartbeat;
    /**
     * Handle transition to online state
     */
    private handleOnlineState;
    /**
     * Handle transition to offline state
     */
    private handleOfflineState;
    /**
     * Start periodic sync
     * Syncs every N minutes when online
     */
    private startPeriodicSync;
    /**
     * Trigger full sync manually
     * Public method to allow manual sync from UI
     */
    triggerFullSync(): Promise<void>;
    /**
     * Upload queued sales to backend
     */
    uploadQueuedSales(): Promise<void>;
    /**
     * Sync products (delta sync)
     */
    syncProducts(): Promise<void>;
    /**
     * Sync customers (delta sync)
     */
    syncCustomers(): Promise<void>;
    /**
     * Sync fiscal printer configuration
     */
    syncFiscalConfig(): Promise<void>;
    /**
     * Get online status
     */
    getOnlineStatus(): boolean;
    /**
     * Get sync status
     */
    getSyncStatus(): {
        isOnline: boolean;
        isSyncing: boolean;
        lastSyncTime: Date | null;
        errors: string[];
    };
    /**
     * Update sync configuration from server
     */
    updateSyncConfig(config: SyncConfig): void;
    /**
     * Emit sync event
     */
    private emitEvent;
    /**
     * Emit progress event
     */
    private emitProgress;
    /**
     * Get last sync duration
     */
    private getLastSyncDuration;
}
/**
 * Create sync service instance
 */
export declare function createSyncService(config: SyncServiceConfig): SyncService;
//# sourceMappingURL=sync-service.d.ts.map