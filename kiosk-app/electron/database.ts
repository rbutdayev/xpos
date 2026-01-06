/**
 * SQLite Database Service
 *
 * Implements all 7 tables from schema:
 * - products (cache)
 * - customers (cache)
 * - users (cache - for offline login)
 * - sales_queue (offline sales)
 * - fiscal_config (fiscal printer config)
 * - app_config (app configuration)
 * - sync_metadata (sync tracking)
 *
 * Uses better-sqlite3 for synchronous SQLite access
 */

import BetterSqlite3 from 'better-sqlite3';
import * as path from 'path';
import type {
  Product,
  Customer,
  Sale,
  QueuedSale,
  FiscalConfig,
  SyncMetadata
} from '../src/shared/types';
import { ISyncDatabase } from '../src/main/services/sync-service';

export class Database implements ISyncDatabase {
  private db: BetterSqlite3.Database;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    console.log('Opening database:', dbPath);

    // Open database with better-sqlite3
    this.db = new BetterSqlite3(dbPath, {
      verbose: console.log,
    });

    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    console.log('Database opened successfully');
  }

  // ============================================================================
  // MIGRATIONS
  // ============================================================================

  /**
   * Run database migrations (create tables if not exist)
   */
  migrate(): void {
    console.log('Running database migrations...');

    // Create products table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        account_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        sku TEXT,
        barcode TEXT,
        sale_price REAL NOT NULL,
        purchase_price REAL,
        stock_quantity REAL DEFAULT 0,
        variant_id INTEGER,
        variant_name TEXT,
        category_name TEXT,
        is_active INTEGER DEFAULT 1,
        type TEXT DEFAULT 'product',
        last_synced_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
      CREATE INDEX IF NOT EXISTS idx_products_account ON products(account_id);
    `);

    // Create customers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY,
        account_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        loyalty_card_number TEXT,
        current_points INTEGER DEFAULT 0,
        customer_type TEXT DEFAULT 'regular',
        last_synced_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
      CREATE INDEX IF NOT EXISTS idx_customers_loyalty_card ON customers(loyalty_card_number);
      CREATE INDEX IF NOT EXISTS idx_customers_account ON customers(account_id);
    `);

    // Create users table (for offline login)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        account_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        kiosk_enabled INTEGER DEFAULT 0,
        kiosk_pin TEXT,
        branch_id INTEGER,
        last_synced_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_users_account ON users(account_id);
      CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id);
      CREATE INDEX IF NOT EXISTS idx_users_kiosk_enabled ON users(kiosk_enabled);
    `);

    // Create sales_queue table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sales_queue (
        local_id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        branch_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        customer_id INTEGER,
        items TEXT NOT NULL,
        payments TEXT NOT NULL,
        subtotal REAL NOT NULL,
        tax_amount REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        total REAL NOT NULL,
        payment_status TEXT DEFAULT 'paid',
        notes TEXT,
        fiscal_number TEXT,
        fiscal_document_id TEXT,
        created_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'queued',
        server_sale_id INTEGER,
        sync_attempted_at TEXT,
        sync_error TEXT,
        retry_count INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_sales_queue_sync_status ON sales_queue(sync_status);
      CREATE INDEX IF NOT EXISTS idx_sales_queue_created_at ON sales_queue(created_at);
    `);

    // Migration: Add user_id column if it doesn't exist (for existing databases)
    try {
      const tableInfo = this.db.pragma('table_info(sales_queue)') as Array<{ name: string }>;
      const hasUserId = tableInfo.some((col) => col.name === 'user_id');

      if (!hasUserId) {
        console.log('Migrating sales_queue: Adding user_id column');
        this.db.exec(`ALTER TABLE sales_queue ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`);
        console.log('Migration completed: user_id column added');
      }
    } catch (error) {
      console.error('Migration error for sales_queue:', error);
    }
  }

  /**
   * Fix old sales with user_id = 0 (migration helper)
   * Call this after user logs in to update queued sales
   */
  fixOldSalesUserId(userId: number): void {
    try {
      const result = this.db.prepare(`
        UPDATE sales_queue
        SET user_id = ?
        WHERE user_id = 0 OR user_id IS NULL
      `).run(userId);

      if (result.changes > 0) {
        console.log(`Fixed ${result.changes} old sales with user_id = ${userId}`);
      }
    } catch (error) {
      console.error('Error fixing old sales user_id:', error);
    }

    // Create fiscal_config table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS fiscal_config (
        id INTEGER PRIMARY KEY,
        account_id INTEGER NOT NULL,
        provider TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        port INTEGER NOT NULL,
        operator_code TEXT,
        operator_password TEXT,
        is_active INTEGER DEFAULT 1,
        last_synced_at TEXT
      );
    `);

    // Create app_config table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT
      );
    `);

    // Create sync_metadata table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        sync_type TEXT PRIMARY KEY,
        last_sync_at TEXT,
        last_sync_status TEXT,
        records_synced INTEGER DEFAULT 0
      );

      -- Initialize sync metadata
      INSERT OR IGNORE INTO sync_metadata (sync_type, last_sync_status, records_synced)
      VALUES
        ('products', 'success', 0),
        ('customers', 'success', 0),
        ('config', 'success', 0);
    `);

    console.log('Database migrations completed');
  }

  // ============================================================================
  // PRODUCTS METHODS
  // ============================================================================

  /**
   * Upsert products (insert or replace)
   */
  upsertProducts(products: Product[]): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO products (
        id, account_id, name, sku, barcode, sale_price, purchase_price,
        stock_quantity, variant_id, variant_name, category_name,
        is_active, type, last_synced_at
      ) VALUES (
        @id, @account_id, @name, @sku, @barcode, @sale_price, @purchase_price,
        @stock_quantity, @variant_id, @variant_name, @category_name,
        @is_active, @type, @last_synced_at
      )
    `);

    const transaction = this.db.transaction((items: Product[]) => {
      for (const product of items) {
        stmt.run({
          id: product.id,
          account_id: product.account_id,
          name: product.name,
          sku: product.sku || null,
          barcode: product.barcode || null,
          sale_price: product.sale_price,
          purchase_price: product.purchase_price || null,
          stock_quantity: product.stock_quantity || 0,
          variant_id: product.variant_id || null,
          variant_name: product.variant_name || null,
          category_name: product.category_name || null,
          is_active: product.is_active ? 1 : 0,
          type: product.type,
          last_synced_at: new Date().toISOString(),
        });
      }
    });

    transaction(products);
  }

  /**
   * Delete products by IDs
   */
  deleteProducts(productIds: number[]): void {
    if (productIds.length === 0) return;

    const stmt = this.db.prepare('DELETE FROM products WHERE id = ?');

    const transaction = this.db.transaction((ids: number[]) => {
      for (const id of ids) {
        stmt.run(id);
      }
    });

    transaction(productIds);
  }

  /**
   * Get all products
   */
  getAllProducts(): Product[] {
    const rows = this.db.prepare('SELECT * FROM products WHERE is_active = 1').all();
    return rows.map(this.rowToProduct);
  }

  /**
   * Get product by ID
   */
  getProductById(id: number): Product | null {
    const row = this.db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    return row ? this.rowToProduct(row) : null;
  }

  /**
   * Get product by barcode
   */
  getProductByBarcode(barcode: string): Product | null {
    const row = this.db.prepare('SELECT * FROM products WHERE barcode = ? AND is_active = 1').get(barcode);
    return row ? this.rowToProduct(row) : null;
  }

  /**
   * Search products by query (name, SKU, barcode)
   */
  searchProducts(query: string): Product[] {
    const searchQuery = `%${query}%`;
    const rows = this.db.prepare(`
      SELECT * FROM products
      WHERE is_active = 1
        AND (
          name LIKE ? COLLATE NOCASE
          OR sku LIKE ? COLLATE NOCASE
          OR barcode LIKE ? COLLATE NOCASE
        )
      LIMIT 50
    `).all(searchQuery, searchQuery, searchQuery);

    return rows.map(this.rowToProduct);
  }

  /**
   * Convert database row to Product type
   */
  private rowToProduct(row: any): Product {
    return {
      id: row.id,
      account_id: row.account_id,
      name: row.name,
      sku: row.sku,
      barcode: row.barcode,
      sale_price: row.sale_price,
      purchase_price: row.purchase_price,
      stock_quantity: row.stock_quantity,
      variant_id: row.variant_id,
      variant_name: row.variant_name,
      category_name: row.category_name,
      is_active: row.is_active === 1,
      type: row.type,
      updated_at: row.last_synced_at,
      last_synced_at: row.last_synced_at,
    };
  }

  // ============================================================================
  // CUSTOMERS METHODS
  // ============================================================================

  /**
   * Upsert customers (insert or replace)
   */
  upsertCustomers(customers: Customer[]): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO customers (
        id, account_id, name, phone, email, loyalty_card_number,
        current_points, customer_type, last_synced_at
      ) VALUES (
        @id, @account_id, @name, @phone, @email, @loyalty_card_number,
        @current_points, @customer_type, @last_synced_at
      )
    `);

    const transaction = this.db.transaction((items: Customer[]) => {
      for (const customer of items) {
        stmt.run({
          id: customer.id,
          account_id: customer.account_id,
          name: customer.name,
          phone: customer.phone || null,
          email: customer.email || null,
          loyalty_card_number: customer.loyalty_card_number || null,
          current_points: customer.current_points || 0,
          customer_type: customer.customer_type,
          last_synced_at: new Date().toISOString(),
        });
      }
    });

    transaction(customers);
  }

  /**
   * Get all customers
   */
  getAllCustomers(): Customer[] {
    const rows = this.db.prepare('SELECT * FROM customers').all();
    return rows.map(this.rowToCustomer);
  }

  /**
   * Get customer by ID
   */
  getCustomerById(id: number): Customer | null {
    const row = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    return row ? this.rowToCustomer(row) : null;
  }

  /**
   * Search customers by query (name, phone, email)
   */
  searchCustomers(query: string): Customer[] {
    const searchQuery = `%${query}%`;
    const rows = this.db.prepare(`
      SELECT * FROM customers
      WHERE name LIKE ? COLLATE NOCASE
        OR phone LIKE ? COLLATE NOCASE
        OR email LIKE ? COLLATE NOCASE
      LIMIT 50
    `).all(searchQuery, searchQuery, searchQuery);

    return rows.map(this.rowToCustomer);
  }

  // ============================================================================
  // USERS (for offline login)
  // ============================================================================

  /**
   * Upsert users (insert or replace)
   */
  upsertUsers(users: any[]): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO users (
        id, account_id, name, kiosk_enabled, kiosk_pin, branch_id, last_synced_at
      ) VALUES (
        @id, @account_id, @name, @kiosk_enabled, @kiosk_pin, @branch_id, @last_synced_at
      )
    `);

    const transaction = this.db.transaction((items: any[]) => {
      for (const user of items) {
        stmt.run({
          id: user.id,
          account_id: user.account_id,
          name: user.name,
          kiosk_enabled: user.kiosk_enabled ? 1 : 0,
          kiosk_pin: user.kiosk_pin || null,
          branch_id: user.branch_id || null,
          last_synced_at: new Date().toISOString(),
        });
      }
    });

    transaction(users);
  }

  /**
   * Get user by ID (for offline login)
   */
  getUserById(id: number, accountId: number): any | null {
    const row = this.db.prepare(`
      SELECT * FROM users
      WHERE id = ? AND account_id = ?
    `).get(id, accountId);

    return row ? this.rowToUser(row) : null;
  }

  /**
   * Verify user PIN offline (returns user data if valid)
   */
  verifyUserPinOffline(userId: number, pin: string, accountId: number, branchId: number): any | null {
    const user = this.getUserById(userId, accountId);

    if (!user) {
      console.warn('Offline login: User not found', { userId, accountId });
      return null;
    }

    if (!user.kiosk_enabled) {
      console.warn('Offline login: Kiosk not enabled', { userId });
      return null;
    }

    if (!user.kiosk_pin) {
      console.warn('Offline login: No PIN set', { userId });
      return null;
    }

    // Check branch assignment
    if (user.branch_id !== branchId) {
      console.warn('Offline login: Branch mismatch', {
        userId,
        userBranch: user.branch_id,
        kioskBranch: branchId
      });
      return null;
    }

    // Note: PIN is already hashed in database, we need bcrypt to verify
    // For offline mode, we'll need to use a native bcrypt implementation
    const bcrypt = require('bcryptjs');
    const isValidPin = bcrypt.compareSync(pin, user.kiosk_pin);

    if (!isValidPin) {
      console.warn('Offline login: Invalid PIN', { userId });
      return null;
    }

    console.log('Offline login: Success', { userId, userName: user.name });
    return {
      user_id: user.id,
      user_name: user.name,
      branch_id: user.branch_id,
    };
  }

  /**
   * Convert database row to User type
   */
  private rowToUser(row: any): any {
    return {
      id: row.id,
      account_id: row.account_id,
      name: row.name,
      kiosk_enabled: row.kiosk_enabled === 1,
      kiosk_pin: row.kiosk_pin,
      branch_id: row.branch_id,
      last_synced_at: row.last_synced_at,
    };
  }

  /**
   * Convert database row to Customer type
   */
  private rowToCustomer(row: any): Customer {
    return {
      id: row.id,
      account_id: row.account_id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      loyalty_card_number: row.loyalty_card_number,
      current_points: row.current_points,
      customer_type: row.customer_type,
      updated_at: row.last_synced_at,
      last_synced_at: row.last_synced_at,
    };
  }

  // ============================================================================
  // SALES QUEUE METHODS
  // ============================================================================

  /**
   * Create sale (add to queue)
   */
  createSale(sale: Sale): number {
    const stmt = this.db.prepare(`
      INSERT INTO sales_queue (
        account_id, branch_id, user_id, customer_id, items, payments,
        subtotal, tax_amount, discount_amount, total, payment_status,
        notes, fiscal_number, fiscal_document_id, created_at, sync_status
      ) VALUES (
        @account_id, @branch_id, @user_id, @customer_id, @items, @payments,
        @subtotal, @tax_amount, @discount_amount, @total, @payment_status,
        @notes, @fiscal_number, @fiscal_document_id, @created_at, @sync_status
      )
    `);

    const result = stmt.run({
      account_id: sale.account_id,
      branch_id: sale.branch_id,
      user_id: sale.user_id,
      customer_id: sale.customer_id || null,
      items: JSON.stringify(sale.items),
      payments: JSON.stringify(sale.payments),
      subtotal: sale.subtotal,
      tax_amount: sale.tax_amount,
      discount_amount: sale.discount_amount,
      total: sale.total,
      payment_status: sale.payment_status,
      notes: sale.notes || null,
      fiscal_number: sale.fiscal_number || null,
      fiscal_document_id: sale.fiscal_document_id || null,
      created_at: sale.created_at || new Date().toISOString(),
      sync_status: 'queued',
    });

    return result.lastInsertRowid as number;
  }

  /**
   * Get queued sales (not synced)
   */
  getQueuedSales(): QueuedSale[] {
    const rows = this.db.prepare(`
      SELECT * FROM sales_queue
      WHERE sync_status = 'queued'
      ORDER BY created_at ASC
    `).all();

    return rows.map(this.rowToQueuedSale);
  }

  /**
   * Get sale by local ID
   */
  getSaleById(localId: number): QueuedSale | null {
    const row = this.db.prepare('SELECT * FROM sales_queue WHERE local_id = ?').get(localId);
    return row ? this.rowToQueuedSale(row) : null;
  }

  /**
   * Mark sale as synced
   */
  markSaleAsSynced(localId: number, serverSaleId: number): void {
    this.db.prepare(`
      UPDATE sales_queue
      SET sync_status = 'synced',
          server_sale_id = ?,
          sync_attempted_at = ?,
          sync_error = NULL
      WHERE local_id = ?
    `).run(serverSaleId, new Date().toISOString(), localId);
  }

  /**
   * Mark sale as failed
   */
  markSaleAsFailed(localId: number, error: string): void {
    this.db.prepare(`
      UPDATE sales_queue
      SET sync_status = 'failed',
          sync_error = ?,
          sync_attempted_at = ?
      WHERE local_id = ?
    `).run(error, new Date().toISOString(), localId);
  }

  /**
   * Update sale retry count
   */
  updateSaleRetryCount(localId: number): void {
    this.db.prepare(`
      UPDATE sales_queue
      SET retry_count = retry_count + 1,
          sync_attempted_at = ?
      WHERE local_id = ?
    `).run(new Date().toISOString(), localId);
  }

  /**
   * Get queued sales count
   */
  getQueuedSalesCount(): number {
    const result = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM sales_queue
      WHERE sync_status = 'queued'
    `).get() as { count: number };

    return result.count;
  }

  /**
   * Convert database row to QueuedSale type
   */
  private rowToQueuedSale(row: any): QueuedSale {
    return {
      local_id: row.local_id,
      account_id: row.account_id,
      branch_id: row.branch_id,
      user_id: row.user_id,
      customer_id: row.customer_id,
      items: JSON.parse(row.items),
      payments: JSON.parse(row.payments),
      subtotal: row.subtotal,
      tax_amount: row.tax_amount,
      discount_amount: row.discount_amount,
      total: row.total,
      payment_status: row.payment_status,
      notes: row.notes,
      fiscal_number: row.fiscal_number,
      fiscal_document_id: row.fiscal_document_id,
      created_at: row.created_at,
      sync_status: row.sync_status,
      server_sale_id: row.server_sale_id,
      sync_attempted_at: row.sync_attempted_at,
      sync_error: row.sync_error,
      retry_count: row.retry_count,
    };
  }

  // ============================================================================
  // FISCAL CONFIG METHODS
  // ============================================================================

  /**
   * Update fiscal printer config
   */
  updateFiscalConfig(config: any): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO fiscal_config (
        id, account_id, provider, ip_address, port,
        operator_code, operator_password, is_active, last_synced_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      config.account_id,
      config.provider,
      config.ip_address,
      config.port,
      config.operator_code || null,
      config.operator_password || null,
      config.is_active ? 1 : 0,
      new Date().toISOString()
    );
  }

  /**
   * Get fiscal printer config
   */
  getFiscalConfig(): FiscalConfig | null {
    const row = this.db.prepare('SELECT * FROM fiscal_config WHERE id = 1').get() as any;

    if (!row) return null;

    return {
      id: row.id,
      account_id: row.account_id,
      provider: row.provider,
      ip_address: row.ip_address,
      port: row.port,
      operator_code: row.operator_code,
      operator_password: row.operator_password,
      username: row.username || null,
      password: row.password || null,
      security_key: row.security_key || null,
      merchant_id: row.merchant_id || null,
      credit_contract_number: row.credit_contract_number || null,
      default_tax_rate: row.default_tax_rate || null,
      is_active: row.is_active === 1,
      last_synced_at: row.last_synced_at,
    };
  }

  // ============================================================================
  // APP CONFIG METHODS
  // ============================================================================

  /**
   * Set app config value
   */
  setConfig(key: string, value: string): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO app_config (key, value, updated_at)
      VALUES (?, ?, ?)
    `).run(key, value, new Date().toISOString());
  }

  /**
   * Get app config value
   */
  getConfig(key: string): string | null {
    const row = this.db.prepare('SELECT value FROM app_config WHERE key = ?').get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  /**
   * Delete app config value
   */
  deleteConfig(key: string): void {
    this.db.prepare('DELETE FROM app_config WHERE key = ?').run(key);
  }

  // ============================================================================
  // SYNC METADATA METHODS
  // ============================================================================

  /**
   * Get last sync time for a sync type
   */
  getLastSyncTime(syncType: 'products' | 'customers' | 'config'): string | null {
    const row = this.db.prepare('SELECT last_sync_at FROM sync_metadata WHERE sync_type = ?').get(syncType) as { last_sync_at: string | null } | undefined;
    return row?.last_sync_at || null;
  }

  /**
   * Update sync metadata
   */
  updateSyncMetadata(syncType: 'products' | 'customers' | 'config', timestamp: string): void {
    this.db.prepare(`
      UPDATE sync_metadata
      SET last_sync_at = ?,
          last_sync_status = 'success',
          records_synced = records_synced + 1
      WHERE sync_type = ?
    `).run(timestamp, syncType);
  }

  /**
   * Get sync metadata
   */
  getSyncMetadata(syncType: string): SyncMetadata | null {
    const row = this.db.prepare('SELECT * FROM sync_metadata WHERE sync_type = ?').get(syncType) as any;

    if (!row) return null;

    return {
      sync_type: row.sync_type as 'products' | 'customers' | 'config',
      last_sync_at: row.last_sync_at,
      last_sync_status: row.last_sync_status as 'success' | 'failed',
      records_synced: row.records_synced,
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get database statistics
   */
  getStatistics(): {
    productsCount: number;
    customersCount: number;
    queuedSalesCount: number;
    syncedSalesCount: number;
    failedSalesCount: number;
    hasFiscalConfig: boolean;
  } {
    const productsCount = this.db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
    const customersCount = this.db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number };
    const queuedSalesCount = this.db.prepare(`SELECT COUNT(*) as count FROM sales_queue WHERE sync_status = 'queued'`).get() as { count: number };
    const syncedSalesCount = this.db.prepare(`SELECT COUNT(*) as count FROM sales_queue WHERE sync_status = 'synced'`).get() as { count: number };
    const failedSalesCount = this.db.prepare(`SELECT COUNT(*) as count FROM sales_queue WHERE sync_status = 'failed'`).get() as { count: number };
    const fiscalConfig = this.getFiscalConfig();

    return {
      productsCount: productsCount.count,
      customersCount: customersCount.count,
      queuedSalesCount: queuedSalesCount.count,
      syncedSalesCount: syncedSalesCount.count,
      failedSalesCount: failedSalesCount.count,
      hasFiscalConfig: fiscalConfig !== null,
    };
  }

  /**
   * Clear all data (for testing/reset)
   */
  clearAllData(): void {
    this.db.exec(`
      DELETE FROM products;
      DELETE FROM customers;
      DELETE FROM sales_queue;
      DELETE FROM fiscal_config;
      DELETE FROM app_config;
      UPDATE sync_metadata SET last_sync_at = NULL, records_synced = 0;
    `);
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    console.log('Database closed');
  }

  /**
   * Check if database is open
   */
  isOpen(): boolean {
    return this.db.open;
  }
}
