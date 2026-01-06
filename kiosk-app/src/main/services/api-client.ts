/**
 * API Client with retry logic, authentication, and error handling
 */

import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import {
  ApiClientConfig,
  ApiResponse,
  RegistrationResponse,
  ProductsDelta,
  CustomersDelta,
  FiscalConfigResponse,
  SalesUploadResponse,
} from '../../shared/types';

export class ApiClient {
  private client: AxiosInstance;
  private token: string;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(config: ApiClientConfig) {
    this.token = config.token;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000; // 1 second base delay

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000, // 30 seconds default
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - Add bearer token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add bearer token to all requests
        config.headers.Authorization = `Bearer ${this.token}`;

        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);

        return config;
      },
      (error: AxiosError) => {
        console.error('[API] Request error:', error.message);
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors and retry logic
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
      },
      async (error: AxiosError) => {
        return this.handleResponseError(error);
      }
    );
  }

  /**
   * Handle response errors with retry logic
   */
  private async handleResponseError(error: AxiosError): Promise<any> {
    const config = error.config as AxiosRequestConfig & { _retry?: number };

    if (!config) {
      return Promise.reject(error);
    }

    // Initialize retry counter
    config._retry = config._retry || 0;

    // Check if we should retry
    const shouldRetry = this.shouldRetryRequest(error, config._retry);

    if (shouldRetry && config._retry < this.retryAttempts) {
      config._retry += 1;

      // Calculate exponential backoff delay
      const delay = this.calculateRetryDelay(config._retry);

      console.warn(
        `[API] Retrying request (attempt ${config._retry}/${this.retryAttempts}) after ${delay}ms - ${error.message}`
      );

      // Wait before retrying
      await this.sleep(delay);

      // Retry the request
      return this.client.request(config);
    }

    // Log error details
    this.logError(error);

    return Promise.reject(error);
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetryRequest(error: AxiosError, retryCount: number): boolean {
    // Don't retry if max attempts reached
    if (retryCount >= this.retryAttempts) {
      return false;
    }

    // Retry on network errors
    if (!error.response) {
      return true;
    }

    const status = error.response.status;

    // Retry on server errors (5xx)
    if (status >= 500 && status < 600) {
      return true;
    }

    // Retry on rate limiting (429)
    if (status === 429) {
      return true;
    }

    // Retry on timeout (408)
    if (status === 408) {
      return true;
    }

    // Don't retry on client errors (4xx) except 429 and 408
    if (status >= 400 && status < 500) {
      return false;
    }

    return false;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff: baseDelay * 2^(retryCount - 1)
    const exponentialDelay = this.retryDelay * Math.pow(2, retryCount - 1);

    // Add jitter (random 0-1000ms) to prevent thundering herd
    const jitter = Math.random() * 1000;

    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Log error details
   */
  private logError(error: AxiosError): void {
    if (error.response) {
      // Server responded with error status
      console.error('[API] Response error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data,
      });
    } else if (error.request) {
      // Request made but no response received
      console.error('[API] No response received:', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
      });
    } else {
      // Error setting up request
      console.error('[API] Request setup error:', error.message);
    }
  }

  /**
   * Update bearer token
   */
  public setToken(token: string): void {
    this.token = token;
  }

  // ============================================
  // API METHODS
  // ============================================

  /**
   * Register device with backend
   */
  async register(
    deviceName: string,
    version: string,
    platform: string = 'windows'
  ): Promise<RegistrationResponse> {
    const response = await this.client.post<RegistrationResponse>('/api/kiosk/register', {
      device_name: deviceName,
      version,
      platform,
    });

    return response.data;
  }

  /**
   * Send heartbeat to backend
   */
  async heartbeat(): Promise<boolean> {
    try {
      await this.client.get('/api/kiosk/heartbeat', {
        timeout: 5000, // 5 seconds for heartbeat
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get products delta sync
   */
  async getProductsDelta(since?: string): Promise<ProductsDelta> {
    const params = since ? { since } : {};
    const response = await this.client.get<ProductsDelta>('/api/kiosk/sync/products/delta', {
      params,
    });

    return response.data;
  }

  /**
   * Get customers delta sync
   */
  async getCustomersDelta(since?: string): Promise<CustomersDelta> {
    const params = since ? { since } : {};
    const response = await this.client.get<CustomersDelta>('/api/kiosk/sync/customers/delta', {
      params,
    });

    return response.data;
  }

  /**
   * Get fiscal printer configuration
   */
  async getFiscalConfig(): Promise<FiscalConfigResponse> {
    const response = await this.client.get<FiscalConfigResponse>('/api/kiosk/fiscal-config');

    return response.data;
  }

  /**
   * Upload queued sales (batch)
   */
  async uploadSales(sales: any[]): Promise<SalesUploadResponse> {
    const response = await this.client.post<SalesUploadResponse>('/api/kiosk/sales/upload', {
      sales,
    });

    return response.data;
  }

  /**
   * Create single sale (real-time)
   */
  async createSale(sale: any): Promise<ApiResponse> {
    const response = await this.client.post<ApiResponse>('/api/kiosk/sale', sale);

    return response.data;
  }

  /**
   * Get sale sync status
   */
  async getSaleStatus(localId: number): Promise<ApiResponse> {
    const response = await this.client.get<ApiResponse>(`/api/kiosk/sales/status/${localId}`);

    return response.data;
  }

  /**
   * Search products
   */
  async searchProducts(query: string): Promise<ApiResponse> {
    const response = await this.client.get<ApiResponse>('/api/kiosk/products/search', {
      params: { q: query },
    });

    return response.data;
  }

  /**
   * Search customers
   */
  async searchCustomers(query: string): Promise<ApiResponse> {
    const response = await this.client.get<ApiResponse>('/api/kiosk/customers/search', {
      params: { q: query },
    });

    return response.data;
  }

  /**
   * Disconnect device
   */
  async disconnect(): Promise<ApiResponse> {
    const response = await this.client.post<ApiResponse>('/api/kiosk/disconnect');

    return response.data;
  }

  /**
   * Generic GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

/**
 * Create API client instance
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}
