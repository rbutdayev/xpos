// Kiosk Application Types

export interface Product {
  id: number;
  account_id: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  sale_price: number;
  purchase_price: number | null;
  stock_quantity: number;
  variant_id: number | null;
  variant_name: string | null;
  category_name: string | null;
  is_active: boolean;
  type: string;
  updated_at: string;
  last_synced_at: string | null;
}

export interface Customer {
  id: number;
  account_id: number;
  name: string;
  phone: string | null;
  email: string | null;
  loyalty_card_number: string | null;
  current_points: number;
  customer_type: string;
  updated_at: string;
  last_synced_at: string | null;
}

export interface CartItem {
  product_id: number;
  variant_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  subtotal: number;
}

export interface Payment {
  method: 'cash' | 'card' | 'gift_card' | 'giftCard' | 'other';
  amount: number;
  reference?: string;
}

export interface Sale {
  local_id?: number;
  account_id: number;
  branch_id: number;
  user_id: number; // Kiosk user who made the sale
  customer_id: number | null;
  items: CartItem[];
  payments: Payment[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  payment_status: string;
  notes?: string;
  fiscal_number?: string;
  fiscal_document_id?: string;
  created_at: string;
  enable_fiscal_print?: boolean; // Flag to enable/disable fiscal printing
  sync_status?: 'queued' | 'uploading' | 'synced' | 'failed';
  server_sale_id?: number;
  sync_attempted_at?: string;
  sync_error?: string;
  retry_count?: number;
}

export interface AppConfig {
  token: string;
  api_url: string;
  account_id: number;
  branch_id: number;
  device_name: string;
  is_registered: boolean;
  user_id?: number;
  user_name?: string;
  user_role?: string;
  branch_name?: string;
  is_logged_in?: boolean;
  logo_path?: string;
}

export interface SyncStatus {
  is_online: boolean;
  last_sync_at: string | null;
  queued_sales_count: number;
  is_syncing: boolean;
  sync_error: string | null;
}

export interface FiscalConfig {
  id: number;
  account_id: number;
  provider: string;
  ip_address: string;
  port: number;
  operator_code: string | null;
  operator_password: string | null;
  username: string | null;
  password: string | null;
  security_key: string | null;
  merchant_id: string | null;
  credit_contract_number: string | null;
  default_tax_rate: number | null;
  is_active: boolean;
  last_synced_at: string | null;
}

export interface SyncMetadata {
  sync_type: 'products' | 'customers' | 'config';
  last_sync_at: string | null;
  last_sync_status: 'success' | 'failed' | null;
  records_synced: number;
}

// IPC API Interface (for communication with main process)
export interface IPCApi {
  // Config
  getConfig(): Promise<AppConfig | null>;
  saveConfig(config: AppConfig): Promise<void>;
  clearConfig(): Promise<void>;
  uploadLogo(): Promise<string | null>; // Returns file path or null if cancelled

  // Authentication
  loginWithPin(userId: number, pin: string): Promise<{user_id: number; user_name: string; branch_id: number}>;
  verifyKioskPin(params: {user_id: number; pin: string}): Promise<{success: boolean}>;
  logout(): Promise<void>;

  // Products
  searchProducts(query: string): Promise<Product[]>;
  getProductByBarcode(barcode: string): Promise<Product | null>;
  getAllProducts(): Promise<Product[]>;

  // Customers
  searchCustomers(query: string): Promise<Customer[]>;
  getCustomerById(id: number): Promise<Customer | null>;

  // Sales
  createSale(sale: Sale): Promise<number>; // Returns local_id
  getQueuedSales(): Promise<Sale[]>;
  getSaleById(localId: number): Promise<Sale | null>;

  // Sync
  getSyncStatus(): Promise<SyncStatus>;
  triggerSync(): Promise<void>;
  getSyncMetadata(syncType: string): Promise<SyncMetadata | null>;

  // Fiscal
  getFiscalConfig(): Promise<FiscalConfig | null>;
  printFiscalReceipt(sale: Sale): Promise<{ fiscalNumber: string; fiscalDocumentId: string }>;

  // Registration
  registerDevice(token: string, apiUrl: string, deviceName: string): Promise<AppConfig>;
}

// Extend window interface for IPC
declare global {
  interface Window {
    ipc: IPCApi;
  }
}
