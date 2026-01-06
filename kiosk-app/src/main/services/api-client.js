"use strict";
/**
 * API Client with retry logic, authentication, and error handling
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
exports.createApiClient = createApiClient;
const axios_1 = __importDefault(require("axios"));
class ApiClient {
    constructor(config) {
        this.token = config.token;
        this.retryAttempts = config.retryAttempts || 3;
        this.retryDelay = config.retryDelay || 1000; // 1 second base delay
        this.client = axios_1.default.create({
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
    setupInterceptors() {
        // Request interceptor - Add bearer token
        this.client.interceptors.request.use((config) => {
            // Add bearer token to all requests
            config.headers.Authorization = `Bearer ${this.token}`;
            console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => {
            console.error('[API] Request error:', error.message);
            return Promise.reject(error);
        });
        // Response interceptor - Handle errors and retry logic
        this.client.interceptors.response.use((response) => {
            console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
            return response;
        }, async (error) => {
            return this.handleResponseError(error);
        });
    }
    /**
     * Handle response errors with retry logic
     */
    async handleResponseError(error) {
        const config = error.config;
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
            console.warn(`[API] Retrying request (attempt ${config._retry}/${this.retryAttempts}) after ${delay}ms - ${error.message}`);
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
    shouldRetryRequest(error, retryCount) {
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
    calculateRetryDelay(retryCount) {
        // Exponential backoff: baseDelay * 2^(retryCount - 1)
        const exponentialDelay = this.retryDelay * Math.pow(2, retryCount - 1);
        // Add jitter (random 0-1000ms) to prevent thundering herd
        const jitter = Math.random() * 1000;
        return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
    }
    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Log error details
     */
    logError(error) {
        if (error.response) {
            // Server responded with error status
            console.error('[API] Response error:', {
                status: error.response.status,
                statusText: error.response.statusText,
                url: error.config?.url,
                method: error.config?.method,
                data: error.response.data,
            });
        }
        else if (error.request) {
            // Request made but no response received
            console.error('[API] No response received:', {
                url: error.config?.url,
                method: error.config?.method,
                message: error.message,
            });
        }
        else {
            // Error setting up request
            console.error('[API] Request setup error:', error.message);
        }
    }
    /**
     * Update bearer token
     */
    setToken(token) {
        this.token = token;
    }
    // ============================================
    // API METHODS
    // ============================================
    /**
     * Register device with backend
     */
    async register(deviceName, version, platform = 'windows') {
        const response = await this.client.post('/api/kiosk/register', {
            device_name: deviceName,
            version,
            platform,
        });
        return response.data;
    }
    /**
     * Send heartbeat to backend
     */
    async heartbeat() {
        try {
            await this.client.get('/api/kiosk/heartbeat', {
                timeout: 5000, // 5 seconds for heartbeat
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get products delta sync
     */
    async getProductsDelta(since) {
        const params = since ? { since } : {};
        const response = await this.client.get('/api/kiosk/sync/products/delta', {
            params,
        });
        return response.data;
    }
    /**
     * Get customers delta sync
     */
    async getCustomersDelta(since) {
        const params = since ? { since } : {};
        const response = await this.client.get('/api/kiosk/sync/customers/delta', {
            params,
        });
        return response.data;
    }
    /**
     * Get fiscal printer configuration
     */
    async getFiscalConfig() {
        const response = await this.client.get('/api/kiosk/fiscal-config');
        return response.data;
    }
    /**
     * Upload queued sales (batch)
     */
    async uploadSales(sales) {
        const response = await this.client.post('/api/kiosk/sales/upload', {
            sales,
        });
        return response.data;
    }
    /**
     * Create single sale (real-time)
     */
    async createSale(sale) {
        const response = await this.client.post('/api/kiosk/sale', sale);
        return response.data;
    }
    /**
     * Get sale sync status
     */
    async getSaleStatus(localId) {
        const response = await this.client.get(`/api/kiosk/sales/status/${localId}`);
        return response.data;
    }
    /**
     * Search products
     */
    async searchProducts(query) {
        const response = await this.client.get('/api/kiosk/products/search', {
            params: { q: query },
        });
        return response.data;
    }
    /**
     * Search customers
     */
    async searchCustomers(query) {
        const response = await this.client.get('/api/kiosk/customers/search', {
            params: { q: query },
        });
        return response.data;
    }
    /**
     * Disconnect device
     */
    async disconnect() {
        const response = await this.client.post('/api/kiosk/disconnect');
        return response.data;
    }
    /**
     * Generic GET request
     */
    async get(url, config) {
        const response = await this.client.get(url, config);
        return response.data;
    }
    /**
     * Generic POST request
     */
    async post(url, data, config) {
        const response = await this.client.post(url, data, config);
        return response.data;
    }
    /**
     * Generic PUT request
     */
    async put(url, data, config) {
        const response = await this.client.put(url, data, config);
        return response.data;
    }
    /**
     * Generic DELETE request
     */
    async delete(url, config) {
        const response = await this.client.delete(url, config);
        return response.data;
    }
}
exports.ApiClient = ApiClient;
/**
 * Create API client instance
 */
function createApiClient(config) {
    return new ApiClient(config);
}
//# sourceMappingURL=api-client.js.map