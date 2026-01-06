/**
 * Preload Script
 *
 * Exposes safe IPC API to renderer process via contextBridge
 * Implements type-safe window.ipc interface from types/index.ts
 *
 * Security:
 * - contextIsolation: true
 * - nodeIntegration: false
 * - Only whitelisted IPC channels exposed
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { IPCApi, AppConfig, Product, Customer, Sale, SyncStatus, SyncMetadata, FiscalConfig } from '../src/types/index';

// ============================================================================
// IPC API Implementation
// ============================================================================

const ipcApi: IPCApi = {
  // ==========================================================================
  // Config Methods
  // ==========================================================================

  getConfig: (): Promise<AppConfig | null> => {
    return ipcRenderer.invoke('config:get');
  },

  saveConfig: (config: AppConfig): Promise<void> => {
    return ipcRenderer.invoke('config:save', config);
  },

  clearConfig: (): Promise<void> => {
    return ipcRenderer.invoke('config:clear');
  },

  uploadLogo: (): Promise<string | null> => {
    return ipcRenderer.invoke('config:uploadLogo');
  },

  // ==========================================================================
  // Authentication Methods
  // ==========================================================================

  loginWithPin: (userId: number, pin: string): Promise<{user_id: number; user_name: string; branch_id: number}> => {
    return ipcRenderer.invoke('auth:loginWithPin', userId, pin);
  },

  verifyKioskPin: (params: {user_id: number; pin: string}): Promise<{success: boolean}> => {
    return ipcRenderer.invoke('auth:verifyKioskPin', params);
  },

  logout: (): Promise<void> => {
    return ipcRenderer.invoke('auth:logout');
  },

  // ==========================================================================
  // Products Methods
  // ==========================================================================

  searchProducts: (query: string): Promise<Product[]> => {
    return ipcRenderer.invoke('products:search', query);
  },

  getProductByBarcode: (barcode: string): Promise<Product | null> => {
    return ipcRenderer.invoke('products:getByBarcode', barcode);
  },

  getAllProducts: (): Promise<Product[]> => {
    return ipcRenderer.invoke('products:getAll');
  },

  // ==========================================================================
  // Customers Methods
  // ==========================================================================

  searchCustomers: (query: string): Promise<Customer[]> => {
    return ipcRenderer.invoke('customers:search', query);
  },

  getCustomerById: (id: number): Promise<Customer | null> => {
    return ipcRenderer.invoke('customers:getById', id);
  },

  // ==========================================================================
  // Sales Methods
  // ==========================================================================

  createSale: (sale: Sale): Promise<number> => {
    return ipcRenderer.invoke('sales:create', sale);
  },

  getQueuedSales: (): Promise<Sale[]> => {
    return ipcRenderer.invoke('sales:getQueued');
  },

  getSaleById: (localId: number): Promise<Sale | null> => {
    return ipcRenderer.invoke('sales:getById', localId);
  },

  // ==========================================================================
  // Sync Methods
  // ==========================================================================

  getSyncStatus: (): Promise<SyncStatus> => {
    return ipcRenderer.invoke('sync:getStatus');
  },

  triggerSync: (): Promise<void> => {
    return ipcRenderer.invoke('sync:trigger');
  },

  getSyncMetadata: (syncType: string): Promise<SyncMetadata | null> => {
    return ipcRenderer.invoke('sync:getMetadata', syncType);
  },

  // ==========================================================================
  // Fiscal Methods
  // ==========================================================================

  getFiscalConfig: (): Promise<FiscalConfig | null> => {
    return ipcRenderer.invoke('fiscal:getConfig');
  },

  printFiscalReceipt: (sale: Sale): Promise<{ fiscalNumber: string; fiscalDocumentId: string }> => {
    return ipcRenderer.invoke('fiscal:printReceipt', sale);
  },

  // ==========================================================================
  // Registration Method
  // ==========================================================================

  registerDevice: (token: string, apiUrl: string, deviceName: string): Promise<AppConfig> => {
    return ipcRenderer.invoke('device:register', token, apiUrl, deviceName);
  },
};

// ============================================================================
// Event Listeners API (for receiving events from main process)
// ============================================================================

const eventListeners = {
  /**
   * Listen to sync connection changes
   */
  onSyncConnectionChanged: (callback: (isOnline: boolean) => void): (() => void) => {
    const listener = (event: IpcRendererEvent, data: { isOnline: boolean }) => {
      callback(data.isOnline);
    };

    ipcRenderer.on('sync:connection-changed', listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('sync:connection-changed', listener);
    };
  },

  /**
   * Listen to sync status changes
   */
  onSyncStatusChanged: (callback: (status: any) => void): (() => void) => {
    const listener = (event: IpcRendererEvent, status: any) => {
      callback(status);
    };

    ipcRenderer.on('sync:status-changed', listener);

    return () => {
      ipcRenderer.removeListener('sync:status-changed', listener);
    };
  },

  /**
   * Listen to sync progress updates
   */
  onSyncProgress: (callback: (progress: any) => void): (() => void) => {
    const listener = (event: IpcRendererEvent, progress: any) => {
      callback(progress);
    };

    ipcRenderer.on('sync:progress', listener);

    return () => {
      ipcRenderer.removeListener('sync:progress', listener);
    };
  },

  /**
   * Listen to app errors
   */
  onAppError: (callback: (error: any) => void): (() => void) => {
    const listener = (event: IpcRendererEvent, error: any) => {
      callback(error);
    };

    ipcRenderer.on('app:error', listener);

    return () => {
      ipcRenderer.removeListener('app:error', listener);
    };
  },
};

// ============================================================================
// Utility API (for additional functionality)
// ============================================================================

const utilityApi = {
  /**
   * Get database statistics
   */
  getStatistics: (): Promise<any> => {
    return ipcRenderer.invoke('db:getStatistics');
  },

  /**
   * Test fiscal printer connection
   */
  testFiscalConnection: (): Promise<{ success: boolean; error?: string; responseTime?: number }> => {
    return ipcRenderer.invoke('fiscal:testConnection');
  },

  /**
   * Get app version
   */
  getVersion: (): string => {
    return process.versions.electron || 'unknown';
  },

  /**
   * Get platform
   */
  getPlatform: (): string => {
    return process.platform;
  },

  /**
   * Check if running in development mode
   */
  isDevelopment: (): boolean => {
    return process.env.NODE_ENV === 'development';
  },
};

// ============================================================================
// Expose APIs to Renderer
// ============================================================================

// Expose main IPC API
contextBridge.exposeInMainWorld('ipc', ipcApi);

// Expose event listeners
contextBridge.exposeInMainWorld('ipcEvents', eventListeners);

// Expose utility API
contextBridge.exposeInMainWorld('ipcUtils', utilityApi);

// ============================================================================
// Type Declarations (for TypeScript in renderer)
// ============================================================================

declare global {
  interface Window {
    ipc: IPCApi;
    ipcEvents: typeof eventListeners;
    ipcUtils: typeof utilityApi;
  }
}

// Log successful initialization
console.log('Preload script initialized');
console.log('Platform:', process.platform);
console.log('Electron version:', process.versions.electron);
console.log('Node version:', process.versions.node);
console.log('Chrome version:', process.versions.chrome);
