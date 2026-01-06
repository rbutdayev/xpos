/**
 * Example usage of Sync Service
 * This demonstrates how to initialize and use the sync service
 */
/**
 * Example: Initialize and start sync service
 */
export declare function initializeSyncService(apiUrl: string, token: string): {
    syncService: import("./sync-service").SyncService;
    apiClient: import("./api-client").ApiClient;
    database: import("../database/sync-database").SyncDatabase;
    logger: import("./logger").Logger;
};
/**
 * Example: Manual sync trigger
 */
export declare function triggerManualSync(syncService: any): Promise<void>;
/**
 * Example: Check connection status
 */
export declare function checkConnectionStatus(syncService: any): any;
/**
 * Example: Stop sync service
 */
export declare function stopSyncService(syncService: any): void;
/**
 * Example: Complete initialization flow
 */
export declare function initializeKioskApp(): Promise<{
    syncService: import("./sync-service").SyncService;
    apiClient: import("./api-client").ApiClient;
    database: import("../database/sync-database").SyncDatabase;
}>;
/**
 * Example: Electron/Main process integration
 */
export declare function setupElectronIntegration(syncService: any, mainWindow: any): void;
/**
 * Example: IPC handlers for renderer process (React UI)
 */
export declare function setupIPCHandlers(ipcMain: any, syncService: any, database: any): void;
//# sourceMappingURL=example-usage.d.ts.map