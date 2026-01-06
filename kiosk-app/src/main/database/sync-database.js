"use strict";
/**
 * Database interface for sync service
 * This is a stub implementation - actual implementation will use SQLite (better-sqlite3 + Kysely)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncDatabase = void 0;
exports.createSyncDatabase = createSyncDatabase;
/**
 * Mock/Stub implementation of sync database
 * Replace this with actual SQLite implementation using better-sqlite3 and Kysely
 */
class SyncDatabase {
    constructor() {
        // In-memory storage for stub (replace with actual SQLite)
        this.queuedSales = [];
        this.products = new Map();
        this.customers = new Map();
        this.fiscalConfig = null;
        this.syncMetadata = new Map();
        // Initialize sync metadata
        this.syncMetadata.set('products', { lastSyncAt: '', lastSyncStatus: 'success', recordsSynced: 0 });
        this.syncMetadata.set('customers', { lastSyncAt: '', lastSyncStatus: 'success', recordsSynced: 0 });
        this.syncMetadata.set('config', { lastSyncAt: '', lastSyncStatus: 'success', recordsSynced: 0 });
    }
    // ============================================
    // SALES QUEUE METHODS
    // ============================================
    /**
     * Get all queued sales (not synced)
     */
    getQueuedSales() {
        return this.queuedSales.filter((sale) => sale.sync_status === 'queued');
    }
    /**
     * Mark sale as synced
     */
    markSaleAsSynced(localId, serverSaleId) {
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
    markSaleAsFailed(localId, error) {
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
    updateSaleRetryCount(localId) {
        const sale = this.queuedSales.find((s) => s.local_id === localId);
        if (sale) {
            sale.retry_count += 1;
        }
    }
    /**
     * Add sale to queue
     */
    addSaleToQueue(sale) {
        this.queuedSales.push(sale);
    }
    // ============================================
    // PRODUCTS METHODS
    // ============================================
    /**
     * Upsert products (insert or update)
     */
    upsertProducts(products) {
        for (const product of products) {
            product.last_synced_at = new Date().toISOString();
            this.products.set(product.id, product);
        }
    }
    /**
     * Delete products by IDs
     */
    deleteProducts(productIds) {
        for (const id of productIds) {
            this.products.delete(id);
        }
    }
    /**
     * Get all products
     */
    getAllProducts() {
        return Array.from(this.products.values());
    }
    /**
     * Get product by ID
     */
    getProductById(id) {
        return this.products.get(id) || null;
    }
    /**
     * Search products by name, SKU, or barcode
     */
    searchProducts(query) {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.products.values()).filter((product) => product.name.toLowerCase().includes(lowerQuery) ||
            product.sku?.toLowerCase().includes(lowerQuery) ||
            product.barcode?.toLowerCase().includes(lowerQuery));
    }
    // ============================================
    // CUSTOMERS METHODS
    // ============================================
    /**
     * Upsert customers (insert or update)
     */
    upsertCustomers(customers) {
        for (const customer of customers) {
            customer.last_synced_at = new Date().toISOString();
            this.customers.set(customer.id, customer);
        }
    }
    /**
     * Get all customers
     */
    getAllCustomers() {
        return Array.from(this.customers.values());
    }
    /**
     * Get customer by ID
     */
    getCustomerById(id) {
        return this.customers.get(id) || null;
    }
    /**
     * Search customers by name, phone, or email
     */
    searchCustomers(query) {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.customers.values()).filter((customer) => customer.name.toLowerCase().includes(lowerQuery) ||
            customer.phone?.toLowerCase().includes(lowerQuery) ||
            customer.email?.toLowerCase().includes(lowerQuery));
    }
    // ============================================
    // FISCAL CONFIG METHODS
    // ============================================
    /**
     * Update fiscal printer config
     */
    updateFiscalConfig(config) {
        config.last_synced_at = new Date().toISOString();
        this.fiscalConfig = config;
    }
    /**
     * Get fiscal printer config
     */
    getFiscalConfig() {
        return this.fiscalConfig;
    }
    // ============================================
    // SYNC METADATA METHODS
    // ============================================
    /**
     * Get last sync time for a sync type
     */
    getLastSyncTime(syncType) {
        const metadata = this.syncMetadata.get(syncType);
        return metadata?.lastSyncAt || null;
    }
    /**
     * Update sync metadata
     */
    updateSyncMetadata(syncType, timestamp) {
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
    getAllSyncMetadata() {
        return this.syncMetadata;
    }
    // ============================================
    // UTILITY METHODS
    // ============================================
    /**
     * Clear all data (for testing)
     */
    clearAll() {
        this.queuedSales = [];
        this.products.clear();
        this.customers.clear();
        this.fiscalConfig = null;
        this.syncMetadata.clear();
    }
    /**
     * Get database statistics
     */
    getStatistics() {
        return {
            queuedSalesCount: this.queuedSales.filter((s) => s.sync_status === 'queued').length,
            productsCount: this.products.size,
            customersCount: this.customers.size,
            hasFiscalConfig: this.fiscalConfig !== null,
        };
    }
}
exports.SyncDatabase = SyncDatabase;
/**
 * Create database instance
 */
function createSyncDatabase() {
    return new SyncDatabase();
}
//# sourceMappingURL=sync-database.js.map