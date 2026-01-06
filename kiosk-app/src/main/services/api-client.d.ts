/**
 * API Client with retry logic, authentication, and error handling
 */
import { AxiosRequestConfig } from 'axios';
import { ApiClientConfig, ApiResponse, RegistrationResponse, ProductsDelta, CustomersDelta, FiscalConfigResponse, SalesUploadResponse } from '../../shared/types';
export declare class ApiClient {
    private client;
    private token;
    private retryAttempts;
    private retryDelay;
    constructor(config: ApiClientConfig);
    /**
     * Setup request and response interceptors
     */
    private setupInterceptors;
    /**
     * Handle response errors with retry logic
     */
    private handleResponseError;
    /**
     * Determine if request should be retried
     */
    private shouldRetryRequest;
    /**
     * Calculate exponential backoff delay
     */
    private calculateRetryDelay;
    /**
     * Sleep utility for retry delays
     */
    private sleep;
    /**
     * Log error details
     */
    private logError;
    /**
     * Update bearer token
     */
    setToken(token: string): void;
    /**
     * Register device with backend
     */
    register(deviceName: string, version: string, platform?: string): Promise<RegistrationResponse>;
    /**
     * Send heartbeat to backend
     */
    heartbeat(): Promise<boolean>;
    /**
     * Get products delta sync
     */
    getProductsDelta(since?: string): Promise<ProductsDelta>;
    /**
     * Get customers delta sync
     */
    getCustomersDelta(since?: string): Promise<CustomersDelta>;
    /**
     * Get fiscal printer configuration
     */
    getFiscalConfig(): Promise<FiscalConfigResponse>;
    /**
     * Upload queued sales (batch)
     */
    uploadSales(sales: any[]): Promise<SalesUploadResponse>;
    /**
     * Create single sale (real-time)
     */
    createSale(sale: any): Promise<ApiResponse>;
    /**
     * Get sale sync status
     */
    getSaleStatus(localId: number): Promise<ApiResponse>;
    /**
     * Search products
     */
    searchProducts(query: string): Promise<ApiResponse>;
    /**
     * Search customers
     */
    searchCustomers(query: string): Promise<ApiResponse>;
    /**
     * Disconnect device
     */
    disconnect(): Promise<ApiResponse>;
    /**
     * Generic GET request
     */
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Generic POST request
     */
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Generic PUT request
     */
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Generic DELETE request
     */
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
}
/**
 * Create API client instance
 */
export declare function createApiClient(config: ApiClientConfig): ApiClient;
//# sourceMappingURL=api-client.d.ts.map