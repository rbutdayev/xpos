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
    method: 'cash' | 'card' | 'gift_card';
    amount: number;
    reference?: string;
}
export interface Sale {
    local_id?: number;
    account_id: number;
    branch_id: number;
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
    is_active: boolean;
    last_synced_at: string | null;
}
export interface SyncMetadata {
    sync_type: 'products' | 'customers' | 'config';
    last_sync_at: string | null;
    last_sync_status: 'success' | 'failed' | null;
    records_synced: number;
}
export interface IPCApi {
    getConfig(): Promise<AppConfig | null>;
    saveConfig(config: AppConfig): Promise<void>;
    clearConfig(): Promise<void>;
    searchProducts(query: string): Promise<Product[]>;
    getProductByBarcode(barcode: string): Promise<Product | null>;
    getAllProducts(): Promise<Product[]>;
    searchCustomers(query: string): Promise<Customer[]>;
    getCustomerById(id: number): Promise<Customer | null>;
    createSale(sale: Sale): Promise<number>;
    getQueuedSales(): Promise<Sale[]>;
    getSaleById(localId: number): Promise<Sale | null>;
    getSyncStatus(): Promise<SyncStatus>;
    triggerSync(): Promise<void>;
    getSyncMetadata(syncType: string): Promise<SyncMetadata | null>;
    getFiscalConfig(): Promise<FiscalConfig | null>;
    printFiscalReceipt(sale: Sale): Promise<{
        fiscalNumber: string;
        fiscalDocumentId: string;
    }>;
    registerDevice(token: string, apiUrl: string, deviceName: string): Promise<AppConfig>;
}
declare global {
    interface Window {
        ipc: IPCApi;
    }
}
//# sourceMappingURL=index.d.ts.map