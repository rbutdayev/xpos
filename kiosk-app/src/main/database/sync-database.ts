/**
 * Database interface for sync service
 * This is a stub implementation - actual implementation will use SQLite (better-sqlite3 + Kysely)
 */

import { ISyncDatabase } from '../services/sync-service';
import { QueuedSale, Product, Customer, FiscalConfig } from '../../shared/types';

/**
 * Mock/Stub implementation of sync database
 * Replace this with actual SQLite implementation using better-sqlite3 and Kysely
 */
export class SyncDatabase implements ISyncDatabase {
  // In-memory storage for stub (replace with actual SQLite)
  private queuedSales: QueuedSale[] = [];
  private products: Map<number, Product> = new Map();
  private customers: Map<number, Customer> = new Map();
  private users: Map<number, any> = new Map();
  private fiscalConfig: FiscalConfig | null = null;
  private syncMetadata: Map<string, { lastSyncAt: string; lastSyncStatus: string; recordsSynced: number }> = new Map();

  constructor() {
    // Initialize sync metadata
    this.syncMetadata.set('products', { lastSyncAt: '', lastSyncStatus: 'success', recordsSynced: 0 });
    this.syncMetadata.set('customers', { lastSyncAt: '', lastSyncStatus: 'success', recordsSynced: 0 });
    this.syncMetadata.set('users', { lastSyncAt: '', lastSyncStatus: 'success', recordsSynced: 0 });
    this.syncMetadata.set('config', { lastSyncAt: '', lastSyncStatus: 'success', recordsSynced: 0 });
  }

  // ============================================
  // SALES QUEUE METHODS
  // ============================================

  /**
   * Get all queued sales (not synced)
   */
  getQueuedSales(): QueuedSale[] {
    return this.queuedSales.filter((sale) => sale.sync_status === 'queued');
  }

  /**
   * Mark sale as synced
   */
  markSaleAsSynced(localId: number, serverSaleId: number): void {
    const sale = this.queuedSales.find((s) => s.local_id === localId);
    if (sale) {
      sale.sync_status = 'synced';
      sale.server_sale_id = serverSaleId;
      sale.sync_attempted_at = new Date().toISOString();
      sale.sync_error = undefined;
    }
  }

  /**
   * Mark sale as failed
   */
  markSaleAsFailed(localId: number, error: string): void {
    const sale = this.queuedSales.find((s) => s.local_id === localId);
    if (sale) {
      sale.sync_status = 'failed';
      sale.sync_error = error;
      sale.sync_attempted_at = new Date().toISOString();
    }
  }

  /**
   * Update sale retry count
   */
  updateSaleRetryCount(localId: number): void {
    const sale = this.queuedSales.find((s) => s.local_id === localId);
    if (sale) {
      sale.retry_count += 1;
    }
  }

  /**
   * Add sale to queue
   */
  addSaleToQueue(sale: QueuedSale): void {
    this.queuedSales.push(sale);
  }

  // ============================================
  // PRODUCTS METHODS
  // ============================================

  /**
   * Upsert products (insert or update)
   */
  upsertProducts(products: Product[]): void {
    for (const product of products) {
      product.last_synced_at = new Date().toISOString();
      this.products.set(product.id, product);
    }
  }

  /**
   * Delete products by IDs
   */
  deleteProducts(productIds: number[]): void {
    for (const id of productIds) {
      this.products.delete(id);
    }
  }

  /**
   * Get all products
   */
  getAllProducts(): Product[] {
    return Array.from(this.products.values());
  }

  /**
   * Get product by ID
   */
  getProductById(id: number): Product | null {
    return this.products.get(id) || null;
  }

  /**
   * Search products by name, SKU, or barcode
   */
  searchProducts(query: string): Product[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(
      (product) =>
        product.name.toLowerCase().includes(lowerQuery) ||
        product.sku?.toLowerCase().includes(lowerQuery) ||
        product.barcode?.toLowerCase().includes(lowerQuery)
    );
  }

  // ============================================
  // CUSTOMERS METHODS
  // ============================================

  /**
   * Upsert customers (insert or update)
   */
  upsertCustomers(customers: Customer[]): void {
    for (const customer of customers) {
      customer.last_synced_at = new Date().toISOString();
      this.customers.set(customer.id, customer);
    }
  }

  /**
   * Get all customers
   */
  getAllCustomers(): Customer[] {
    return Array.from(this.customers.values());
  }

  /**
   * Get customer by ID
   */
  getCustomerById(id: number): Customer | null {
    return this.customers.get(id) || null;
  }

  /**
   * Search customers by name, phone, or email
   */
  searchCustomers(query: string): Customer[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.customers.values()).filter(
      (customer) =>
        customer.name.toLowerCase().includes(lowerQuery) ||
        customer.phone?.toLowerCase().includes(lowerQuery) ||
        customer.email?.toLowerCase().includes(lowerQuery)
    );
  }

  // ============================================
  // USERS METHODS (for offline login)
  // ============================================

  /**
   * Upsert users (insert or update)
   */
  upsertUsers(users: any[]): void {
    for (const user of users) {
      this.users.set(user.id, {
        ...user,
        last_synced_at: new Date().toISOString(),
      });
    }
  }

  /**
   * Get all users
   */
  getAllUsers(): any[] {
    return Array.from(this.users.values());
  }

  /**
   * Get user by ID
   */
  getUserById(id: number): any | null {
    return this.users.get(id) || null;
  }

  // ============================================
  // FISCAL CONFIG METHODS
  // ============================================

  /**
   * Update fiscal printer config
   */
  updateFiscalConfig(config: FiscalConfig): void {
    config.last_synced_at = new Date().toISOString();
    this.fiscalConfig = config;
  }

  /**
   * Get fiscal printer config
   */
  getFiscalConfig(): FiscalConfig | null {
    return this.fiscalConfig;
  }

  // ============================================
  // SYNC METADATA METHODS
  // ============================================

  /**
   * Get last sync time for a sync type
   */
  getLastSyncTime(syncType: 'products' | 'customers' | 'users' | 'config'): string | null {
    const metadata = this.syncMetadata.get(syncType);
    return metadata?.lastSyncAt || null;
  }

  /**
   * Update sync metadata
   */
  updateSyncMetadata(syncType: 'products' | 'customers' | 'users' | 'config', timestamp: string): void {
    const existing = this.syncMetadata.get(syncType);
    this.syncMetadata.set(syncType, {
      lastSyncAt: timestamp,
      lastSyncStatus: 'success',
      recordsSynced: (existing?.recordsSynced || 0) + 1,
    });
  }

  /**
   * Get all sync metadata
   */
  getAllSyncMetadata(): Map<string, any> {
    return this.syncMetadata;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Clear all data (for testing)
   */
  clearAll(): void {
    this.queuedSales = [];
    this.products.clear();
    this.customers.clear();
    this.users.clear();
    this.fiscalConfig = null;
    this.syncMetadata.clear();
  }

  /**
   * Get database statistics
   */
  getStatistics(): {
    queuedSalesCount: number;
    productsCount: number;
    customersCount: number;
    usersCount: number;
    hasFiscalConfig: boolean;
  } {
    return {
      queuedSalesCount: this.queuedSales.filter((s) => s.sync_status === 'queued').length,
      productsCount: this.products.size,
      customersCount: this.customers.size,
      usersCount: this.users.size,
      hasFiscalConfig: this.fiscalConfig !== null,
    };
  }
}

/**
 * Create database instance
 */
export function createSyncDatabase(): SyncDatabase {
  return new SyncDatabase();
}
