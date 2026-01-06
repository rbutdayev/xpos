/**
 * IPC Handlers
 *
 * Implements all 13 IPC methods from types/index.ts:
 * - Config (3 methods)
 * - Products (3 methods)
 * - Customers (2 methods)
 * - Sales (3 methods)
 * - Sync (3 methods)
 * - Fiscal (2 methods)
 * - Registration (1 method)
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { Database } from './database';
import type {
  AppConfig,
  Product,
  Customer,
  Sale,
  SyncStatus,
  SyncMetadata,
  FiscalConfig,
} from '../src/types/index';

export interface IPCHandlerContext {
  database: Database;
  configStore: any; // electron-store
  getApiClient: () => any;
  getSyncService: () => any;
  getFiscalService: () => any;
  restartServices: () => Promise<void>;
}

/**
 * Register all IPC handlers
 */
export function registerIPCHandlers(context: IPCHandlerContext): void {
  const { database, configStore, getApiClient, getSyncService, getFiscalService, restartServices } = context;

  console.log('Registering IPC handlers...');

  // ============================================================================
  // CONFIG HANDLERS
  // ============================================================================

  /**
   * Get app configuration
   */
  ipcMain.handle('config:get', async (): Promise<AppConfig | null> => {
    try {
      const config = configStore.store;

      if (!config.is_registered) {
        return null;
      }

      return {
        token: config.token,
        api_url: config.api_url,
        account_id: config.account_id,
        branch_id: config.branch_id,
        device_name: config.device_name,
        is_registered: config.is_registered,
        logo_path: config.logo_path,
        user_id: config.user_id,
        user_name: config.user_name,
        is_logged_in: config.is_logged_in,
      };
    } catch (error) {
      console.error('Error getting config:', error);
      throw error;
    }
  });

  /**
   * Save app configuration
   */
  ipcMain.handle('config:save', async (event: IpcMainInvokeEvent, config: AppConfig): Promise<void> => {
    try {
      configStore.set('token', config.token);
      configStore.set('api_url', config.api_url);
      configStore.set('account_id', config.account_id);
      configStore.set('branch_id', config.branch_id);
      configStore.set('device_name', config.device_name);
      configStore.set('is_registered', config.is_registered);

      // Save optional fields if provided
      if (config.logo_path !== undefined) {
        configStore.set('logo_path', config.logo_path);
      }
      if (config.user_id !== undefined) {
        configStore.set('user_id', config.user_id);
      }
      if (config.user_name !== undefined) {
        configStore.set('user_name', config.user_name);
      }
      if (config.is_logged_in !== undefined) {
        configStore.set('is_logged_in', config.is_logged_in);
      }

      console.log('Config saved successfully');
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  });

  /**
   * Clear app configuration (logout/reset)
   */
  ipcMain.handle('config:clear', async (): Promise<void> => {
    try {
      configStore.clear();

      // Clear database data
      database.clearAllData();

      console.log('Config cleared successfully');
    } catch (error) {
      console.error('Error clearing config:', error);
      throw error;
    }
  });

  /**
   * Upload logo image (opens file dialog)
   */
  ipcMain.handle('config:uploadLogo', async (): Promise<string | null> => {
    try {
      const { dialog, app: electronApp } = await import('electron');

      // Open file dialog
      const result = await dialog.showOpenDialog({
        title: 'Select Logo/Background Image',
        properties: ['openFile'],
        filters: [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
        ]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const selectedPath = result.filePaths[0];
      const fs = await import('fs');
      const path = await import('path');

      // Create user data directory for assets if it doesn't exist
      const assetsDir = path.join(electronApp.getPath('userData'), 'assets');
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      // Copy file to assets directory with unique name
      const ext = path.extname(selectedPath);
      const fileName = `logo_${Date.now()}${ext}`;
      const destPath = path.join(assetsDir, fileName);

      fs.copyFileSync(selectedPath, destPath);

      // Return as local:// URL with properly encoded path
      const urlPath = `local://${destPath}`;
      console.log('Logo uploaded successfully:', destPath);
      console.log('Returning URL:', urlPath);

      return urlPath;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  });

  // ============================================================================
  // AUTHENTICATION HANDLERS
  // ============================================================================

  /**
   * Login user with PIN
   */
  ipcMain.handle('auth:loginWithPin', async (event: IpcMainInvokeEvent, userId: number, pin: string): Promise<{user_id: number; user_name: string; branch_id: number}> => {
    try {
      const apiClient = getApiClient();

      if (!apiClient) {
        throw new Error('Device not registered. Please contact administrator.');
      }

      console.log('Attempting kiosk login for user:', userId);

      // Call backend API to verify PIN and user
      const response = await apiClient.post('/api/kiosk/login', {
        user_id: userId,
        pin: pin,
      });

      if (!response.success) {
        throw new Error(response.error || 'Login failed');
      }

      const userData = response;

      // Update config with user info
      configStore.set('user_id', userData.user_id);
      configStore.set('user_name', userData.user_name);
      configStore.set('is_logged_in', true);

      // Fix old sales in queue that have user_id = 0
      database.fixOldSalesUserId(userData.user_id);

      console.log('User logged in successfully:', userData.user_name);

      return {
        user_id: userData.user_id,
        user_name: userData.user_name,
        branch_id: userData.branch_id,
      };
    } catch (error: any) {
      console.error('Login failed:', error);

      // Provide user-friendly error messages based on status code
      let userMessage = 'Login failed. Please try again.';

      if (error.response) {
        const status = error.response.status;
        const backendError = error.response.data?.error || error.response.data?.message;

        switch (status) {
          case 401:
            userMessage = backendError || 'Invalid User ID or PIN. Please check and try again.';
            break;
          case 403:
            userMessage = 'Access denied. This user is not authorized for kiosk access.';
            break;
          case 404:
            userMessage = 'User not found. Please check the User ID.';
            break;
          case 419:
            userMessage = 'Session expired. Please restart the application.';
            break;
          case 422:
            userMessage = backendError || 'Invalid login details. Please check your User ID and PIN.';
            break;
          case 500:
          case 502:
          case 503:
            userMessage = 'Server error. Please contact administrator or try again later.';
            break;
          default:
            if (backendError) {
              userMessage = backendError;
            } else if (error.message) {
              // Only include error.message if it's user-friendly
              if (!error.message.includes('status code') && !error.message.includes('ECONNREFUSED')) {
                userMessage = error.message;
              }
            }
        }
      } else if (error.request) {
        // Network error - Try offline login fallback
        console.log('Network error detected, attempting offline login...');

        try {
          const accountId = configStore.get('account_id') as number;
          const branchId = configStore.get('branch_id') as number;

          if (!accountId || !branchId) {
            throw new Error('Cannot login offline: Device configuration missing');
          }

          const offlineUserData = database.verifyUserPinOffline(userId, pin, accountId, branchId);

          if (!offlineUserData) {
            throw new Error('Invalid User ID or PIN. Cannot verify offline.');
          }

          // Update config with user info
          configStore.set('user_id', offlineUserData.user_id);
          configStore.set('user_name', offlineUserData.user_name);
          configStore.set('is_logged_in', true);

          // Fix old sales in queue that have user_id = 0
          database.fixOldSalesUserId(offlineUserData.user_id);

          console.log('Offline login successful:', offlineUserData.user_name);

          return {
            user_id: offlineUserData.user_id,
            user_name: offlineUserData.user_name,
            branch_id: offlineUserData.branch_id,
          };
        } catch (offlineError: any) {
          console.error('Offline login failed:', offlineError.message);
          userMessage = `Cannot connect to server. ${offlineError.message}`;
        }
      } else if (error.message && !error.message.includes('status code')) {
        userMessage = error.message;
      }

      throw new Error(userMessage);
    }
  });

  /**
   * Logout user
   */
  ipcMain.handle('auth:logout', async (): Promise<void> => {
    try {
      configStore.delete('user_id');
      configStore.delete('user_name');
      configStore.set('is_logged_in', false);

      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  });

  // ============================================================================
  // PRODUCTS HANDLERS
  // ============================================================================

  /**
   * Search products by query
   */
  ipcMain.handle('products:search', async (event: IpcMainInvokeEvent, query: string): Promise<Product[]> => {
    try {
      return database.searchProducts(query);
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  });

  /**
   * Get product by barcode
   */
  ipcMain.handle('products:getByBarcode', async (event: IpcMainInvokeEvent, barcode: string): Promise<Product | null> => {
    try {
      return database.getProductByBarcode(barcode);
    } catch (error) {
      console.error('Error getting product by barcode:', error);
      throw error;
    }
  });

  /**
   * Get all products
   */
  ipcMain.handle('products:getAll', async (): Promise<Product[]> => {
    try {
      return database.getAllProducts();
    } catch (error) {
      console.error('Error getting all products:', error);
      throw error;
    }
  });

  // ============================================================================
  // CUSTOMERS HANDLERS
  // ============================================================================

  /**
   * Search customers by query
   */
  ipcMain.handle('customers:search', async (event: IpcMainInvokeEvent, query: string): Promise<Customer[]> => {
    try {
      return database.searchCustomers(query);
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  });

  /**
   * Get customer by ID
   */
  ipcMain.handle('customers:getById', async (event: IpcMainInvokeEvent, id: number): Promise<Customer | null> => {
    try {
      return database.getCustomerById(id);
    } catch (error) {
      console.error('Error getting customer by ID:', error);
      throw error;
    }
  });

  // ============================================================================
  // SALES HANDLERS
  // ============================================================================

  /**
   * Create sale (add to queue, print fiscal receipt)
   */
  ipcMain.handle('sales:create', async (event: IpcMainInvokeEvent, sale: Sale): Promise<number> => {
    try {
      console.log('Creating sale...', { total: sale.total, items: sale.items.length, fiscalPrintEnabled: sale.enable_fiscal_print });

      // Get fiscal service
      const fiscalService = getFiscalService();

      // Try to print fiscal receipt (only if enabled)
      let fiscalNumber: string | undefined;
      let fiscalDocumentId: string | undefined;

      if (sale.enable_fiscal_print && fiscalService && fiscalService.isInitialized()) {
        try {
          console.log('Printing fiscal receipt...');
          const result = await fiscalService.printSaleReceipt(sale);

          if (result.success) {
            fiscalNumber = result.fiscalNumber;
            fiscalDocumentId = result.fiscalDocumentId;
            console.log('Fiscal receipt printed successfully', { fiscalNumber, fiscalDocumentId });
          } else {
            console.warn('Fiscal receipt printing failed:', result.error);
            // Continue without fiscal number (will be handled in backend)
          }
        } catch (fiscalError) {
          console.error('Fiscal printer error:', fiscalError);
          // Continue without fiscal number
        }
      } else {
        console.log('Fiscal printing disabled or service not initialized, skipping fiscal printing');
      }

      // Add fiscal data to sale
      const saleWithFiscal: Sale = {
        ...sale,
        fiscal_number: fiscalNumber,
        fiscal_document_id: fiscalDocumentId,
        created_at: sale.created_at || new Date().toISOString(),
      };

      // Save to database (queue for sync)
      const localId = database.createSale(saleWithFiscal);

      console.log('Sale created successfully', { localId });

      // Trigger sync if online
      const syncService = getSyncService();
      if (syncService && syncService.getOnlineStatus()) {
        console.log('Triggering sync...');
        syncService.triggerFullSync().catch((error: any) => {
          console.error('Sync failed:', error);
        });
      }

      return localId;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  });

  /**
   * Get queued sales
   */
  ipcMain.handle('sales:getQueued', async (): Promise<Sale[]> => {
    try {
      return database.getQueuedSales() as any;
    } catch (error) {
      console.error('Error getting queued sales:', error);
      throw error;
    }
  });

  /**
   * Get sale by local ID
   */
  ipcMain.handle('sales:getById', async (event: IpcMainInvokeEvent, localId: number): Promise<Sale | null> => {
    try {
      return database.getSaleById(localId) as any;
    } catch (error) {
      console.error('Error getting sale by ID:', error);
      throw error;
    }
  });

  // ============================================================================
  // SYNC HANDLERS
  // ============================================================================

  /**
   * Get sync status
   */
  ipcMain.handle('sync:getStatus', async (): Promise<SyncStatus> => {
    try {
      const syncService = getSyncService();

      if (!syncService) {
        return {
          is_online: false,
          last_sync_at: null,
          queued_sales_count: database.getQueuedSalesCount(),
          is_syncing: false,
          sync_error: 'Sync service not initialized',
        };
      }

      const status = syncService.getSyncStatus();

      return {
        is_online: status.isOnline,
        last_sync_at: status.lastSyncTime ? status.lastSyncTime.toISOString() : null,
        queued_sales_count: database.getQueuedSalesCount(),
        is_syncing: status.isSyncing,
        sync_error: status.errors.length > 0 ? status.errors.join(', ') : null,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw error;
    }
  });

  /**
   * Trigger manual sync
   */
  ipcMain.handle('sync:trigger', async (): Promise<void> => {
    try {
      const syncService = getSyncService();

      if (!syncService) {
        throw new Error('Sync service not initialized');
      }

      console.log('Manual sync triggered from UI');
      await syncService.triggerFullSync();
    } catch (error) {
      console.error('Error triggering sync:', error);
      throw error;
    }
  });

  /**
   * Get sync metadata
   */
  ipcMain.handle('sync:getMetadata', async (event: IpcMainInvokeEvent, syncType: string): Promise<SyncMetadata | null> => {
    try {
      return database.getSyncMetadata(syncType);
    } catch (error) {
      console.error('Error getting sync metadata:', error);
      throw error;
    }
  });

  // ============================================================================
  // FISCAL HANDLERS
  // ============================================================================

  /**
   * Get fiscal printer configuration
   */
  ipcMain.handle('fiscal:getConfig', async (): Promise<FiscalConfig | null> => {
    try {
      return database.getFiscalConfig();
    } catch (error) {
      console.error('Error getting fiscal config:', error);
      throw error;
    }
  });

  /**
   * Print fiscal receipt manually
   */
  ipcMain.handle('fiscal:printReceipt', async (event: IpcMainInvokeEvent, sale: Sale): Promise<{ fiscalNumber: string; fiscalDocumentId: string }> => {
    try {
      const fiscalService = getFiscalService();

      if (!fiscalService || !fiscalService.isInitialized()) {
        throw new Error('Fiscal service not initialized');
      }

      const result = await fiscalService.printSaleReceipt(sale);

      if (!result.success) {
        throw new Error(result.error || 'Fiscal printing failed');
      }

      return {
        fiscalNumber: result.fiscalNumber || '',
        fiscalDocumentId: result.fiscalDocumentId || '',
      };
    } catch (error) {
      console.error('Error printing fiscal receipt:', error);
      throw error;
    }
  });

  // ============================================================================
  // REGISTRATION HANDLER
  // ============================================================================

  /**
   * Register device with backend
   */
  ipcMain.handle('device:register', async (
    event: IpcMainInvokeEvent,
    token: string,
    apiUrl: string,
    deviceName: string
  ): Promise<AppConfig> => {
    try {
      console.log('Registering device...', { apiUrl, deviceName });

      // Create temporary API client
      const { createApiClient } = await import('../src/main/services/api-client');
      const tempApiClient = createApiClient({
        baseURL: apiUrl,
        token,
        timeout: 30000,
      });

      // Register with backend
      const response = await tempApiClient.register(deviceName, '1.0.0', 'windows');

      if (!response.success) {
        throw new Error('Registration failed');
      }

      console.log('Registration successful', {
        account_id: response.account_id,
        branch_id: response.branch_id,
      });

      // Save config
      const config: AppConfig = {
        token,
        api_url: apiUrl,
        account_id: response.account_id,
        branch_id: response.branch_id,
        device_name: response.device_name,
        is_registered: true,
      };

      configStore.set('token', config.token);
      configStore.set('api_url', config.api_url);
      configStore.set('account_id', config.account_id);
      configStore.set('branch_id', config.branch_id);
      configStore.set('device_name', config.device_name);
      configStore.set('is_registered', true);

      // Restart services with new config
      await restartServices();

      console.log('Device registered and services restarted');

      return config;
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  });

  // ============================================================================
  // UTILITY HANDLERS
  // ============================================================================

  /**
   * Get database statistics
   */
  ipcMain.handle('db:getStatistics', async () => {
    try {
      return database.getStatistics();
    } catch (error) {
      console.error('Error getting database statistics:', error);
      throw error;
    }
  });

  /**
   * Test fiscal printer connection
   */
  ipcMain.handle('fiscal:testConnection', async () => {
    try {
      const fiscalService = getFiscalService();

      if (!fiscalService || !fiscalService.isInitialized()) {
        return {
          success: false,
          error: 'Fiscal service not initialized',
        };
      }

      return await fiscalService.testConnection();
    } catch (error) {
      console.error('Error testing fiscal connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  console.log('IPC handlers registered successfully');
}

/**
 * Unregister all IPC handlers (for cleanup)
 */
export function unregisterIPCHandlers(): void {
  console.log('Unregistering IPC handlers...');

  ipcMain.removeHandler('config:get');
  ipcMain.removeHandler('config:save');
  ipcMain.removeHandler('config:clear');
  ipcMain.removeHandler('config:uploadLogo');
  ipcMain.removeHandler('products:search');
  ipcMain.removeHandler('products:getByBarcode');
  ipcMain.removeHandler('products:getAll');
  ipcMain.removeHandler('customers:search');
  ipcMain.removeHandler('customers:getById');
  ipcMain.removeHandler('sales:create');
  ipcMain.removeHandler('sales:getQueued');
  ipcMain.removeHandler('sales:getById');
  ipcMain.removeHandler('sync:getStatus');
  ipcMain.removeHandler('sync:trigger');
  ipcMain.removeHandler('sync:getMetadata');
  ipcMain.removeHandler('fiscal:getConfig');
  ipcMain.removeHandler('fiscal:printReceipt');
  ipcMain.removeHandler('device:register');
  ipcMain.removeHandler('db:getStatistics');
  ipcMain.removeHandler('fiscal:testConnection');

  console.log('IPC handlers unregistered');
}
