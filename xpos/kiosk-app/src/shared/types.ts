/**
 * Shared TypeScript types for Kiosk App
 */

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Registration & Auth Types
export interface RegistrationRequest {
  device_name: string;
  version: string;
  platform: string;
}

export interface RegistrationResponse {
  success: boolean;
  account_id: number;
  branch_id: number;
  device_name: string;
  sync_config: SyncConfig;
}

export interface SyncConfig {
  sync_interval_seconds: number;
  heartbeat_interval_seconds: number;
  max_retry_attempts: number;
}

// Product Types
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
  type: string;
  is_active: boolean;
  updated_at: string;
  last_synced_at?: string;
}

export interface ProductsDelta {
  products: Product[];
  deleted_ids: number[];
  sync_timestamp: string;
  total_records: number;
}

// Customer Types
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
  last_synced_at?: string;
}

export interface CustomersDelta {
  customers: Customer[];
  sync_timestamp: string;
  total_records: number;
}

// Fiscal Config Types
export interface FiscalConfig {
  id?: number;
  account_id: number;
  provider: string; // 'caspos', 'omnitech', 'nba', 'oneclick', 'azsmart', 'datecs'
  ip_address: string;
  port: number;
  operator_code: string | null; // Username for most providers, or security_key/merchant_id for some
  operator_password: string | null;
  username?: string | null; // Explicit username field
  password?: string | null; // Explicit password field
  security_key?: string | null; // For OneClick
  merchant_id?: string | null; // For AzSmart
  credit_contract_number?: string | null; // For Caspos bank credit
  default_tax_rate?: number; // VAT rate (0, 2, 8, 18)
  is_active: boolean;
  last_synced_at?: string;
}

export interface FiscalConfigResponse {
  success: boolean;
  config: FiscalConfig | null;
}

// Fiscal Printer Response Types
export interface FiscalPrintResult {
  success: boolean;
  fiscalNumber?: string;
  fiscalDocumentId?: string;
  error?: string;
  responseData?: any;
}

export interface FiscalShiftStatus {
  isOpen: boolean;
  openedAt?: string;
  durationHours?: number;
  isExpired?: boolean;
}

export interface FiscalConnectionTest {
  success: boolean;
  provider: string;
  responseTime?: number;
  error?: string;
}

// Sale Types
export interface SaleItem {
  product_id: number;
  variant_id: number | null;
  product_name?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
}

export interface SalePayment {
  method: string; // 'cash', 'card', 'gift_card', etc.
  amount: number;
  reference?: string;
}

export interface Sale {
  local_id?: number;
  branch_id: number;
  customer_id: number | null;
  items: SaleItem[];
  payments: SalePayment[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  payment_status: string;
  notes?: string;
  fiscal_number?: string;
  fiscal_document_id?: string;
  created_at: string;
}

export interface QueuedSale extends Sale {
  local_id: number;
  account_id: number;
  sync_status: 'queued' | 'uploading' | 'synced' | 'failed';
  server_sale_id?: number;
  sync_attempted_at?: string;
  sync_error?: string;
  retry_count: number;
}

export interface SalesUploadRequest {
  sales: Sale[];
}

export interface SaleUploadResult {
  local_id: number;
  server_sale_id: number;
  sale_number: string;
  status: string;
}

export interface SalesUploadResponse {
  success: boolean;
  results: SaleUploadResult[];
  failed: any[];
}

// Sync Metadata Types
export interface SyncMetadata {
  sync_type: 'products' | 'customers' | 'config';
  last_sync_at: string | null;
  last_sync_status: 'success' | 'failed';
  records_synced: number;
}

// Event Types
export type SyncEventType =
  | 'sync:started'
  | 'sync:progress'
  | 'sync:completed'
  | 'sync:failed'
  | 'connection:online'
  | 'connection:offline';

export interface SyncProgressEvent {
  type: 'products' | 'customers' | 'sales' | 'config';
  current: number;
  total: number;
  percentage: number;
}

export interface SyncEvent {
  type: SyncEventType;
  timestamp: string;
  data?: any;
}

// API Client Config
export interface ApiClientConfig {
  baseURL: string;
  token: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// Logger Types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: any;
}
