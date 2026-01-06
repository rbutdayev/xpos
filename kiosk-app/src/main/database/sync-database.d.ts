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
export declare class SyncDatabase implements ISyncDatabase {
    private queuedSales;
    private products;
    private customers;
    private fiscalConfig;
    private syncMetadata;
    constructor();
    /**
     * Get all queued sales (not synced)
     */
    getQueuedSales(): QueuedSale[];
    /**
     * Mark sale as synced
     */
    markSaleAsSynced(localId: number, serverSaleId: number): void;
    /**
     * Mark sale as failed
     */
    markSaleAsFailed(localId: number, error: string): void;
    /**
     * Update sale retry count
     */
    updateSaleRetryCount(localId: number): void;
    /**
     * Add sale to queue
     */
    addSaleToQueue(sale: QueuedSale): void;
    /**
     * Upsert products (insert or update)
     */
    upsertProducts(products: Product[]): void;
    /**
     * Delete products by IDs
     */
    deleteProducts(productIds: number[]): void;
    /**
     * Get all products
     */
    getAllProducts(): Product[];
    /**
     * Get product by ID
     */
    getProductById(id: number): Product | null;
    /**
     * Search products by name, SKU, or barcode
     */
    searchProducts(query: string): Product[];
    /**
     * Upsert customers (insert or update)
     */
    upsertCustomers(customers: Customer[]): void;
    /**
     * Get all customers
     */
    getAllCustomers(): Customer[];
    /**
     * Get customer by ID
     */
    getCustomerById(id: number): Customer | null;
    /**
     * Search customers by name, phone, or email
     */
    searchCustomers(query: string): Customer[];
    /**
     * Update fiscal printer config
     */
    updateFiscalConfig(config: FiscalConfig): void;
    /**
     * Get fiscal printer config
     */
    getFiscalConfig(): FiscalConfig | null;
    /**
     * Get last sync time for a sync type
     */
    getLastSyncTime(syncType: 'products' | 'customers' | 'config'): string | null;
    /**
     * Update sync metadata
     */
    updateSyncMetadata(syncType: 'products' | 'customers' | 'config', timestamp: string): void;
    /**
     * Get all sync metadata
     */
    getAllSyncMetadata(): Map<string, any>;
    /**
     * Clear all data (for testing)
     */
    clearAll(): void;
    /**
     * Get database statistics
     */
    getStatistics(): {
        queuedSalesCount: number;
        productsCount: number;
        customersCount: number;
        hasFiscalConfig: boolean;
    };
}
/**
 * Create database instance
 */
export declare function createSyncDatabase(): SyncDatabase;
//# sourceMappingURL=sync-database.d.ts.map