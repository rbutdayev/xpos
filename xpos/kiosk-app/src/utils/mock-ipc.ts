// Mock IPC API for development (browser mode)
// In production, this will be replaced by actual Electron IPC

import type { IPCApi, Product, Customer, Sale, AppConfig, SyncStatus, SyncMetadata, FiscalConfig } from '../types';

// Mock data
const mockProducts: Product[] = [
  {
    id: 1,
    account_id: 1,
    name: 'Blue Denim Jeans',
    sku: 'JEANS-001',
    barcode: '1234567890',
    sale_price: 49.99,
    purchase_price: 25.00,
    stock_quantity: 15,
    variant_id: null,
    variant_name: null,
    category_name: 'Clothing',
    is_active: true,
    type: 'product',
    last_synced_at: new Date().toISOString(),
  },
  {
    id: 2,
    account_id: 1,
    name: 'White T-Shirt',
    sku: 'TSHIRT-001',
    barcode: '0987654321',
    sale_price: 19.99,
    purchase_price: 8.00,
    stock_quantity: 30,
    variant_id: null,
    variant_name: null,
    category_name: 'Clothing',
    is_active: true,
    type: 'product',
    last_synced_at: new Date().toISOString(),
  },
  {
    id: 3,
    account_id: 1,
    name: 'Leather Jacket',
    sku: 'JACKET-001',
    barcode: '1122334455',
    sale_price: 129.99,
    purchase_price: 65.00,
    stock_quantity: 8,
    variant_id: null,
    variant_name: null,
    category_name: 'Outerwear',
    is_active: true,
    type: 'product',
    last_synced_at: new Date().toISOString(),
  },
];

const mockCustomers: Customer[] = [
  {
    id: 1,
    account_id: 1,
    name: 'John Doe',
    phone: '+1234567890',
    email: 'john@example.com',
    loyalty_card_number: 'LC001',
    current_points: 150,
    customer_type: 'vip',
    last_synced_at: new Date().toISOString(),
  },
  {
    id: 2,
    account_id: 1,
    name: 'Jane Smith',
    phone: '+0987654321',
    email: 'jane@example.com',
    loyalty_card_number: 'LC002',
    current_points: 75,
    customer_type: 'regular',
    last_synced_at: new Date().toISOString(),
  },
];

let mockSales: Sale[] = [];
let mockConfig: AppConfig | null = null;
let nextLocalId = 1;

export const mockIPC: IPCApi = {
  // Config
  async getConfig() {
    return mockConfig;
  },

  async saveConfig(config: AppConfig) {
    mockConfig = config;
  },

  async clearConfig() {
    mockConfig = null;
  },

  // Products
  async searchProducts(query: string) {
    const lowerQuery = query.toLowerCase();
    return mockProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.sku?.toLowerCase().includes(lowerQuery) ||
        p.barcode?.includes(query)
    );
  },

  async getProductByBarcode(barcode: string) {
    return mockProducts.find((p) => p.barcode === barcode) || null;
  },

  async getAllProducts() {
    return mockProducts;
  },

  // Customers
  async searchCustomers(query: string) {
    const lowerQuery = query.toLowerCase();
    return mockCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.phone?.includes(query) ||
        c.email?.toLowerCase().includes(lowerQuery)
    );
  },

  async getCustomerById(id: number) {
    return mockCustomers.find((c) => c.id === id) || null;
  },

  // Sales
  async createSale(sale: Sale) {
    const localId = nextLocalId++;
    const newSale = {
      ...sale,
      local_id: localId,
      sync_status: 'queued' as const,
    };
    mockSales.push(newSale);
    return localId;
  },

  async getQueuedSales() {
    return mockSales.filter((s) => s.sync_status === 'queued');
  },

  async getSaleById(localId: number) {
    return mockSales.find((s) => s.local_id === localId) || null;
  },

  // Sync
  async getSyncStatus(): Promise<SyncStatus> {
    return {
      is_online: true,
      last_sync_at: new Date().toISOString(),
      queued_sales_count: mockSales.filter((s) => s.sync_status === 'queued').length,
      is_syncing: false,
      sync_error: null,
    };
  },

  async triggerSync() {
    // Simulate sync delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Mark all queued sales as synced
    mockSales = mockSales.map((s) =>
      s.sync_status === 'queued' ? { ...s, sync_status: 'synced' as const } : s
    );
  },

  async getSyncMetadata(syncType: string): Promise<SyncMetadata | null> {
    return {
      sync_type: syncType as any,
      last_sync_at: new Date().toISOString(),
      last_sync_status: 'success',
      records_synced: 100,
    };
  },

  // Fiscal
  async getFiscalConfig(): Promise<FiscalConfig | null> {
    return {
      id: 1,
      account_id: 1,
      provider: 'caspos',
      ip_address: '192.168.1.100',
      port: 8080,
      operator_code: '1',
      operator_password: 'password',
      is_active: true,
      last_synced_at: new Date().toISOString(),
    };
  },

  async printFiscalReceipt(sale: Sale) {
    // Simulate fiscal printing
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      fiscalNumber: `FP${Date.now()}`,
      fiscalDocumentId: `DOC${Date.now()}`,
    };
  },

  // Registration
  async registerDevice(token: string, apiUrl: string, deviceName: string) {
    // Simulate registration
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const config: AppConfig = {
      token,
      api_url: apiUrl,
      account_id: 1,
      branch_id: 1,
      device_name: deviceName,
      is_registered: true,
    };

    mockConfig = config;
    return config;
  },
};

// Install mock IPC in development
if (typeof window !== 'undefined' && !window.ipc) {
  (window as any).ipc = mockIPC;
}
