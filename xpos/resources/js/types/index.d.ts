export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    phone?: string;
    role: string;
    status: string;
    account_id: number;
    last_login_at?: string;
    // Employee fields
    position?: string;
    hire_date?: string;
    hourly_rate?: number;
    branch_id?: number;
    notes?: string;
    // Relations
    branch?: Branch;
    // Timestamps
    created_at?: string;
    updated_at?: string;
}

export interface Company {
    id: number;
    account_id: number;
    name: string;
    address?: string;
    tax_number?: string;
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
    default_language: string;
    logo_path?: string;
    logo_url?: string; // Computed URL for logo display
    business_hours?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: number;
    name: string;
    parent_id?: number;
    parent?: Category;
    children?: Category[];
    sort_order: number;
    is_service: boolean;
    is_active: boolean;
    description?: string;
    account_id: number;
    products?: Product[];
    created_at?: string;
    updated_at?: string;
}

export interface WarehouseBranchAccess {
    id: number;
    warehouse_id: number;
    branch_id: number;
    can_transfer: boolean;
    can_view_stock: boolean;
    can_modify_stock: boolean;
    can_receive_stock: boolean;
    can_issue_stock: boolean;
    created_at?: string;
    updated_at?: string;
    warehouse?: Warehouse;
    branch?: Branch;
}

export interface Warehouse {
    id: number;
    name: string;
    type: 'main' | 'auxiliary' | 'mobile';
    location?: string;
    description?: string;
    is_active: boolean;
    account_id: number;
    settings?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
    branch_access?: WarehouseBranchAccess[];
    branches?: Branch[];
}

export interface ProductStock {
    id: number;
    account_id: number;
    product_id: number;
    variant_id?: number;
    warehouse_id: number;
    warehouse: Warehouse;
    product: Product;
    variant?: ProductVariant;
    quantity: number;
    reserved_quantity: number;
    min_level?: number;
    max_level?: number;
    reorder_point?: number;
    reorder_quantity?: number;
    location?: string;
    available_quantity: number;
    last_counted_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ProductPrice {
    id: number;
    product_id: number;
    branch_id?: number;
    branch?: Branch;
    purchase_price: number;
    sale_price: number;
    discount_percentage: number;
    min_sale_price?: number;
    effective_from: string;
    effective_until?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

export interface ProductVariant {
    id: number;
    account_id: number;
    product_id: number;
    size?: string;
    color?: string;
    color_code?: string;
    sku?: string;
    barcode?: string;
    price_adjustment: number;
    is_active: boolean;
    attributes?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
    // Relations
    product?: Product;
    stock?: ProductStock[];
    // Computed attributes
    final_price?: number;
    display_name?: string;
    short_display?: string;
    total_stock?: number;
}

export interface Product {
    id: number;
    name: string;
    sku: string;
    barcode?: string;
    barcode_type?: string;
    has_custom_barcode: boolean;
    has_variants?: boolean;
    category_id?: number;
    category?: Category;
    parent_product_id?: number | null;
    parentProduct?: Product;
    type: 'product' | 'service';
    description?: string;
    unit: string;
    packaging_size?: string;
    base_unit?: string;
    packaging_quantity?: number;
    unit_price?: number;
    allow_negative_stock: boolean;
    brand?: string;
    model?: string;
    attributes?: Record<string, any>;
    is_active: boolean;
    account_id: number;
    stock?: ProductStock[];
    variants?: ProductVariant[];
    prices?: ProductPrice[];
    latest_price?: ProductPrice;
    total_stock?: number;
    warehouses_count?: number;
    min_level?: number;
    sale_price?: number;
    purchase_price?: number;
    pivot?: {
        supplier_price?: number;
        supplier_sku?: string;
        lead_time_days?: number;
        minimum_order_quantity?: number;
        discount_percentage?: number;
        notes?: string;
        is_preferred?: boolean;
        is_active?: boolean;
    };
    created_at?: string;
    updated_at?: string;
}

export interface Supplier {
    id: number;
    account_id: number;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    tax_number?: string;
    bank_account?: string;
    bank_name?: string;
    payment_terms_days: number;
    notes?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
    products?: Product[];
    active_products_count?: number;
    products_count?: number;
    formatted_phone?: string;
    payment_terms_text?: string;
}

export interface SupplierProduct {
    id: number;
    supplier_id: number;
    product_id: number;
    supplier_price: number;
    supplier_sku?: string;
    lead_time_days: number;
    minimum_order_quantity: number;
    discount_percentage: number;
    notes?: string;
    is_preferred: boolean;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    supplier?: Supplier;
    product?: Product;
    final_price?: number;
    savings?: number;
    lead_time_text?: string;
}

export interface SupplierFormData {
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string;
    tax_number: string;
    bank_account: string;
    bank_name: string;
    payment_terms_days: number;
    notes: string;
    is_active: boolean;
}

export interface SupplierProductFormData {
    product_id: number;
    supplier_price: number;
    supplier_sku: string;
    lead_time_days: number;
    minimum_order_quantity: number;
    discount_percentage: number;
    is_preferred: boolean;
    notes: string;
}

export interface SupplierCredit {
    id: number;
    account_id: number;
    supplier_id: number;
    branch_id?: number;
    type: 'credit' | 'payment';
    amount: number;
    remaining_amount: number;
    description?: string;
    reference_number: string;
    credit_date: string;
    due_date?: string;
    status: 'pending' | 'partial' | 'paid';
    user_id: number;
    payment_history?: Array<{
        amount: number;
        date: string;
        description?: string;
    }>;
    notes?: string;
    created_at?: string;
    updated_at?: string;
    supplier?: Supplier;
    branch?: Branch;
    user?: User;
    status_text?: string;
    type_text?: string;
    total_paid_amount?: number;
}

export interface GoodsReceipt {
    id: number;
    account_id: number;
    warehouse_id: number;
    product_id: number;
    supplier_id: number;
    employee_id?: number;
    receipt_number: string;
    quantity: number;
    unit: string;
    unit_cost: number;
    total_cost: number;
    document_path?: string;
    notes?: string;
    additional_data?: Record<string, any>;
    payment_status: 'paid' | 'unpaid' | 'partial';
    payment_method: 'instant' | 'credit';
    due_date?: string;
    supplier_credit_id?: number;
    created_at?: string;
    updated_at?: string;
    // Relations
    warehouse?: Warehouse;
    product?: Product;
    supplier?: Supplier;
    employee?: Employee;
    supplier_credit?: SupplierCredit;
    // Computed attributes
    has_document?: boolean;
    is_unpaid?: boolean;
    document_view_url?: string;
    document_download_url?: string;
}

export interface GoodsReceiptFormData {
    warehouse_id: string | number;
    product_id: string | number;
    supplier_id: string | number;
    employee_id?: string | number;
    quantity: number;
    unit: string;
    unit_cost: number;
    payment_status: 'paid' | 'unpaid' | 'partial';
    payment_method: 'instant' | 'credit';
    due_date?: string;
    document_path?: string;
    notes?: string;
}

export interface Employee {
    employee_id: number;
    id?: number; // For backward compatibility 
    account_id: number;
    name: string;
    phone?: string;
    email?: string;
    position?: string;
    hire_date: string;
    hourly_rate?: number;
    branch_id?: number;
    is_active: boolean;
    notes?: string;
    created_at?: string;
    updated_at?: string;
    branch?: Branch;
    formatted_phone?: string;
    total_hours_worked?: number;
    total_labor_earned?: number;
}

// Module 5: Customer & Service Records Types
export interface Customer {
    id: number;
    account_id: number;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    birthday?: string;
    customer_type: 'individual' | 'corporate';
    tax_number?: string;
    notes?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
    vehicles?: Vehicle[];
    service_records?: ServiceRecord[];
    formatted_phone?: string;
    customer_type_text?: string;
    active_vehicles_count?: number;
    active_customerItems_count?: number;
    total_tailor_services?: number;
    total_service_records?: number;
    last_service_date?: string;
    total_credit_amount?: number;
    has_pending_credits?: boolean;
}

export interface Vehicle {
    id: number;
    customer_id: number;
    customer?: Customer;
    plate_number: string;
    brand: string;
    model: string;
    year?: number;
    vin?: string;
    engine_type: 'petrol' | 'diesel' | 'electric' | 'hybrid';
    color?: string;
    mileage?: number;
    notes?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    service_records?: ServiceRecord[];
    engine_type_text?: string;
    full_name?: string;
    formatted_plate?: string;
    total_tailor_services?: number;
    last_service_date?: string;
    last_service_mileage?: number;
}

export interface ServiceRecord {
    id: number;
    account_id: number;
    customer_id: number;
    customer_item_id?: number;
    branch_id: number;
    user_id?: number;
    service_number: string;
    description: string;
    labor_cost: number;
    parts_total: number;
    total_cost: number;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    service_date: string;
    notes?: string;
    customer?: Customer;
    customer_item?: CustomerItem;
    user?: User;
    formatted_total_cost?: string;
    formatted_labor_cost?: string;
    status_text?: string;
    created_at?: string;
    updated_at?: string;
    started_at?: string;
    completed_at?: string;
    branch?: Branch;
    service_items?: ServiceItem[];
    status_color?: string;
    duration?: string;
    customer_credit_id?: number;
    payment_status?: 'paid' | 'credit' | 'partial';
    paid_amount?: number;
    credit_amount?: number;
    credit_due_date?: string;
    credit_description?: string;
    customer_credit?: CustomerCredit;
}

export interface Service {
    id: number;
    account_id: number;
    name: string;
    code?: string;
    description?: string;
    price: number;
    unit: string;
    category?: string;
    category_id?: number;
    is_active: boolean;
    formatted_price?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ServiceItem {
    id: number;
    service_id: number;
    product_id?: number;
    service_id_ref?: number;
    item_type: 'product' | 'service';
    item_name?: string;
    quantity: number;
    base_quantity?: number;
    unit_price: number;
    total_price: number;
    selling_unit?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
    service_record?: ServiceRecord;
    product?: Product;
    service?: Service;
    display_name?: string;
    formatted_total_price?: string;
    formatted_unit_price?: string;
    formatted_quantity?: string;
}

export interface Branch {
    id: number;
    account_id: number;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    is_main: boolean;
    working_hours?: Record<string, any>;
    latitude?: number;
    longitude?: number;
    description?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    warehouse_access?: any[];
}

export interface CustomerItem {
    id: number;
    account_id: number;
    customer_id: number;
    customer?: Customer;
    service_type?: 'tailor' | 'phone_repair' | 'electronics' | 'general';
    item_type: string;
    description: string;
    color?: string;
    size?: string;
    fabric_type?: string;
    measurements?: Record<string, any>;
    notes?: string;
    reference_number?: string;
    received_date?: string;
    status?: string;
    status_text?: string;
    status_color?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    full_description?: string;
    display_name?: string;
    formatted_measurements?: string;
    tailor_services?: TailorService[];
}

export interface TailorService {
    id: number;
    account_id: number;
    service_type?: 'tailor' | 'phone_repair' | 'tv_repair' | 'appliance' | 'general';
    customer_id: number;
    customer_item_id?: number;
    branch_id?: number;
    employee_id?: number;
    service_number: string;
    description?: string;
    item_condition?: string;
    labor_cost: number;
    materials_cost: number;
    total_cost: number;
    status: 'received' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
    received_date: string;
    promised_date?: string;
    completed_date?: string;
    delivered_date?: string;
    notes?: string;
    payment_status: 'unpaid' | 'partial' | 'paid' | 'credit';
    paid_amount: number;
    credit_amount: number;
    credit_due_date?: string;
    customer_credit_id?: number;
    created_by?: number;
    created_at?: string;
    updated_at?: string;
    customer?: Customer;
    customer_item?: CustomerItem;
    branch?: Branch;
    employee?: User;
    items?: TailorServiceItem[];
    status_text?: string;
    status_color?: string;
    formatted_total_cost?: string;
    formatted_labor_cost?: string;
    payment_status_text?: string;
    payment_status_color?: string;
    is_overdue?: boolean;
}

export interface TailorServiceItem {
    id: number;
    tailor_service_id: number;
    product_id?: number;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    created_at?: string;
    updated_at?: string;
    product?: Product;
}

// Form Data Types
export interface CustomerFormData {
    name: string;
    phone: string;
    email: string;
    address: string;
    birthday: string;
    customer_type: 'individual' | 'corporate';
    tax_number: string;
    notes: string;
    is_active: boolean;
}

export interface VehicleFormData {
    customer_id: string;
    plate_number: string;
    brand: string;
    model: string;
    year: number;
    vin: string;
    engine_type: string;
    color: string;
    mileage: number | null;
    notes: string;
    is_active: boolean;
}

export interface Employee {
    id: number;
    user_id?: number;
    account_id: number;
    name: string;
    phone?: string;
    email?: string;
    position?: string;
    role?: string;
    display_text?: string;
    hire_date: string;
    hourly_rate?: number;
    branch_id?: number;
    branch?: {
        id: number;
        name: string;
    };
    is_active: boolean;
    notes?: string;
    formatted_phone?: string;
    total_hours_worked?: number;
    total_labor_earned?: number;
    created_at?: string;
    updated_at?: string;
}

export interface ServiceRecordFormData {
    customer_id: string;
    vehicle_id: string;
    branch_id: string;
    description: string;
    labor_cost: number;
    service_date: string;
    service_time?: string;
    status: string;
    notes: string;
    vehicle_mileage?: number;
    service_items: ServiceItemFormData[];
    payment_status?: 'paid' | 'credit' | 'partial' | 'unpaid';
    paid_amount?: number;
    credit_amount?: number;
    credit_due_date?: string;
    credit_description?: string;
    [key: string]: any;
}

export interface ServiceItemFormData {
    id?: number;
    item_type: 'product' | 'service';
    product_id?: string;
    service_id_ref?: string;
    item_name?: string;
    quantity: number;
    base_quantity?: number;
    unit_price: number;
    notes?: string;
}

// Sales & POS Types
export interface Sale {
    sale_id: number;
    id?: number; // Keep both for backward compatibility
    account_id: number;
    branch_id: number;
    customer_id?: number;
    sale_number: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total: number;
    status: 'pending' | 'completed' | 'cancelled' | 'refunded';
    payment_status: 'paid' | 'partial' | 'credit';
    paid_amount?: number;
    credit_amount?: number;
    credit_due_date?: string;
    has_negative_stock: boolean;
    user_id: number;
    notes?: string;
    sale_date: string;
    created_at?: string;
    updated_at?: string;
    customer?: Customer;
    branch?: Branch;
    user?: User;
    items?: SaleItem[];
    payments?: Payment[];
    negative_stock_alerts?: NegativeStockAlert[];
    customer_credit_id?: number;
    is_credit_sale?: boolean;
    customer_credit?: CustomerCredit;
}

export interface CustomerCredit {
    id: number;
    account_id: number;
    customer_id: number;
    branch_id: number;
    type: 'credit' | 'payment';
    amount: number;
    remaining_amount: number;
    description?: string;
    reference_number: string;
    credit_date: string;
    due_date?: string;
    status: 'pending' | 'partial' | 'paid';
    user_id: number;
    payment_history?: any[];
    notes?: string;
    created_at?: string;
    updated_at?: string;
    customer?: Customer;
    branch?: Branch;
    user?: User;
    status_text?: string;
    type_text?: string;
}

export interface SaleItem {
    item_id: number;
    sale_id: number;
    product_id: number;
    variant_id?: number;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    total: number;
    stock_level_at_sale?: number;
    created_at?: string;
    updated_at?: string;
    product?: Product;
    variant?: ProductVariant;
}

export interface Payment {
    payment_id: number;
    sale_id: number;
    method: 'nağd' | 'kart' | 'köçürmə';
    amount: number;
    transaction_id?: string;
    card_type?: string;
    reference_number?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface NegativeStockAlert {
    alert_id: number;
    sale_id: number;
    product_id: number;
    quantity_sold: number;
    stock_level: number;
    message: string;
    status: 'active' | 'acknowledged' | 'resolved';
    alert_date: string;
    acknowledged_by?: number;
    acknowledged_at?: string;
    created_at?: string;
    updated_at?: string;
    product?: Product;
    acknowledged_by_user?: User;
}

// Shared Data Table Types (if not already defined)
export interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    className?: string;
    render?: (item: any) => React.ReactNode;
}

export interface Filter {
    key: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'boolean';
    options?: Array<{ value: string; label: string }>;
    value: string | boolean;
}

export interface Action {
    label: string;
    icon?: React.ComponentType<any>;
    href?: (item: any) => string;
    onClick?: (item: any) => void;
    variant?: 'view' | 'edit' | 'delete' | 'primary' | 'secondary' | 'danger';
    show?: (item: any) => boolean;
    condition?: (item: any) => boolean;
    className?: string;
}

export interface ProductReturn {
    return_id: number;
    account_id: number;
    supplier_id: number;
    product_id: number;
    warehouse_id: number;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    reason: string;
    status: 'gozlemede' | 'tesdiq_edilib' | 'gonderildi' | 'tamamlanib' | 'ləğv_edildi';
    return_date: string;
    requested_by: number;
    approved_by?: number;
    refund_amount?: number;
    refund_date?: string;
    supplier_response?: string;
    created_at?: string;
    updated_at?: string;
    supplier?: Supplier;
    product?: Product;
    warehouse?: Warehouse;
    requestedBy?: User;
    approvedBy?: User;
}

export interface WarehouseTransfer {
    transfer_id: number;
    account_id: number;
    from_warehouse_id: number;
    to_warehouse_id: number;
    product_id: number;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    status: 'gozlemede' | 'tesdiq_edilib' | 'tamamlanib' | 'imtina_edilib';
    transfer_date: string; // legacy client field, not in DB
    requested_at?: string;
    approved_at?: string;
    completed_at?: string;
    requested_by: number;
    approved_by?: number;
    sent_by?: number;
    received_by?: number;
    notes?: string;
    created_at?: string;
    updated_at?: string;
    from_warehouse?: Warehouse;
    to_warehouse?: Warehouse;
    product?: Product;
    requestedBy?: User;
    approvedBy?: User;
    sentBy?: User;
    receivedBy?: User;
}

export interface MinMaxAlert {
    alert_id: number;
    account_id: number;
    product_id: number;
    warehouse_id: number;
    current_stock: number;
    min_level: number;
    max_level?: number;
    alert_type: 'min' | 'max';
    status: 'aktiv' | 'baxildi' | 'həll_edildi';
    created_at?: string;
    resolved_at?: string;
    resolved_by?: number;
    product?: Product;
    warehouse?: Warehouse;
    resolvedBy?: User;
}

export interface PrinterConfig {
    config_id: number;
    account_id: number;
    name: string;
    printer_type: 'thermal' | 'laser' | 'inkjet';
    connection_type: 'usb' | 'network' | 'bluetooth';
    ip_address?: string;
    port?: number;
    device_name?: string;
    paper_width: number;
    character_width: number;
    is_default: boolean;
    is_active: boolean;
    settings?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}

export interface ReceiptTemplate {
    template_id: number;
    account_id: number;
    name: string;
    type: 'sale' | 'service' | 'transfer' | 'return';
    template_content: string;
    paper_width: number;
    font_size: number;
    is_default: boolean;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface StockMovement {
    movement_id: number;
    id: number; // Should be same as movement_id
    account_id: number;
    warehouse_id: number;
    product_id: number;
    movement_type: 'daxil_olma' | 'çıxış' | 'köçürmə' | 'düzəliş';
    quantity: number;
    unit_cost: number;
    reference_type?: string;
    reference_id?: number;
    user_id?: number;
    notes?: string;
    created_at?: string;
    updated_at?: string;
    warehouse?: Warehouse;
    product?: Product;
    user?: User;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
