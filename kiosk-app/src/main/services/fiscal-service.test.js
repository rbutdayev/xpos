"use strict";
/**
 * Fiscal Service Tests
 *
 * Unit tests for FiscalPrinterService
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fiscal_service_1 = require("./fiscal-service");
const axios_1 = __importDefault(require("axios"));
// Mock axios
vitest_1.vi.mock('axios');
const mockedAxios = axios_1.default;
(0, vitest_1.describe)('FiscalPrinterService', () => {
    let service;
    let casposConfig;
    let omnitechConfig;
    let sampleSale;
    (0, vitest_1.beforeEach)(() => {
        service = new fiscal_service_1.FiscalPrinterService();
        // Mock Caspos config
        casposConfig = {
            account_id: 123,
            provider: 'caspos',
            ip_address: '192.168.1.100',
            port: 5544,
            operator_code: 'admin',
            operator_password: 'password',
            username: 'admin',
            password: 'password',
            default_tax_rate: 18,
            is_active: true,
        };
        // Mock Omnitech config
        omnitechConfig = {
            account_id: 123,
            provider: 'omnitech',
            ip_address: '192.168.1.101',
            port: 8989,
            operator_code: 'admin',
            operator_password: 'password',
            username: 'admin',
            password: 'password',
            is_active: true,
        };
        // Sample sale
        sampleSale = {
            branch_id: 5,
            customer_id: null,
            items: [
                {
                    product_id: 123,
                    variant_id: null,
                    product_name: 'Test Product',
                    quantity: 2,
                    unit_price: 10.00,
                    discount_amount: 0,
                },
            ],
            payments: [
                {
                    method: 'cash',
                    amount: 20.00,
                },
            ],
            subtotal: 20.00,
            tax_amount: 0,
            discount_amount: 0,
            total: 20.00,
            payment_status: 'paid',
            created_at: new Date().toISOString(),
        };
        // Mock axios.create
        mockedAxios.create = vitest_1.vi.fn(() => ({
            post: mockedAxios.post,
            get: mockedAxios.get,
        }));
    });
    // ==========================================================================
    // Initialization Tests
    // ==========================================================================
    (0, vitest_1.describe)('initialize()', () => {
        (0, vitest_1.it)('should initialize with valid Caspos config', async () => {
            await service.initialize(casposConfig);
            (0, vitest_1.expect)(service.isInitialized()).toBe(true);
            (0, vitest_1.expect)(service.getProviderName()).toBe('Caspos');
            (0, vitest_1.expect)(service.getConfig()).toEqual(casposConfig);
        });
        (0, vitest_1.it)('should initialize with valid Omnitech config', async () => {
            await service.initialize(omnitechConfig);
            (0, vitest_1.expect)(service.isInitialized()).toBe(true);
            (0, vitest_1.expect)(service.getProviderName()).toBe('Omnitech');
        });
        (0, vitest_1.it)('should throw error for inactive config', async () => {
            const inactiveConfig = { ...casposConfig, is_active: false };
            await (0, vitest_1.expect)(service.initialize(inactiveConfig)).rejects.toThrow('Fiscal printer is not active');
        });
        (0, vitest_1.it)('should throw error for missing IP address', async () => {
            const invalidConfig = { ...casposConfig, ip_address: '' };
            await (0, vitest_1.expect)(service.initialize(invalidConfig)).rejects.toThrow('Fiscal printer IP address or port not configured');
        });
        (0, vitest_1.it)('should throw error for unconfigured provider', async () => {
            const unconfiguredConfig = {
                ...casposConfig,
                operator_code: null,
                operator_password: null,
            };
            await (0, vitest_1.expect)(service.initialize(unconfiguredConfig)).rejects.toThrow('not properly configured');
        });
    });
    // ==========================================================================
    // Caspos Tests
    // ==========================================================================
    (0, vitest_1.describe)('Caspos Provider', () => {
        (0, vitest_1.beforeEach)(async () => {
            await service.initialize(casposConfig);
        });
        (0, vitest_1.it)('should format Caspos request correctly', async () => {
            let capturedRequest;
            mockedAxios.post = vitest_1.vi.fn((url, data) => {
                capturedRequest = data;
                return Promise.resolve({
                    status: 200,
                    data: {
                        code: 0,
                        message: 'Success',
                        data: {
                            document_number: 'FP123456',
                            document_id: 'DOC789',
                        },
                    },
                });
            });
            await service.printSaleReceipt(sampleSale);
            // Verify Caspos request structure
            (0, vitest_1.expect)(capturedRequest).toHaveProperty('operation', 'sale');
            (0, vitest_1.expect)(capturedRequest).toHaveProperty('username', 'admin');
            (0, vitest_1.expect)(capturedRequest).toHaveProperty('password', 'password');
            (0, vitest_1.expect)(capturedRequest).toHaveProperty('data');
            const data = capturedRequest.data;
            (0, vitest_1.expect)(data).toHaveProperty('documentUUID');
            (0, vitest_1.expect)(data).toHaveProperty('cashPayment', '20.00');
            (0, vitest_1.expect)(data).toHaveProperty('cardPayment', '0.00');
            (0, vitest_1.expect)(data).toHaveProperty('items');
            (0, vitest_1.expect)(data.items).toHaveLength(1);
            (0, vitest_1.expect)(data.items[0]).toHaveProperty('name', 'Test Product');
            (0, vitest_1.expect)(data.items[0]).toHaveProperty('quantity', '2.000');
            (0, vitest_1.expect)(data.items[0]).toHaveProperty('salePrice', '10.00');
        });
        (0, vitest_1.it)('should handle Caspos success response', async () => {
            mockedAxios.post = vitest_1.vi.fn(() => Promise.resolve({
                status: 200,
                data: {
                    code: 0,
                    message: 'Success',
                    data: {
                        document_number: 'FP123456',
                        document_id: 'DOC789',
                    },
                },
            }));
            const result = await service.printSaleReceipt(sampleSale);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.fiscalNumber).toBe('FP123456');
            (0, vitest_1.expect)(result.fiscalDocumentId).toBe('DOC789');
        });
        (0, vitest_1.it)('should handle Caspos error response', async () => {
            mockedAxios.post = vitest_1.vi.fn(() => Promise.resolve({
                status: 200,
                data: {
                    code: 1,
                    message: 'Shift not open',
                },
            }));
            const result = await service.printSaleReceipt(sampleSale);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toBe('Shift not open');
        });
        (0, vitest_1.it)('should handle gift card payment as discount', async () => {
            let capturedRequest;
            mockedAxios.post = vitest_1.vi.fn((url, data) => {
                capturedRequest = data;
                return Promise.resolve({
                    status: 200,
                    data: { code: 0, data: { document_number: 'FP123' } },
                });
            });
            const saleWithGiftCard = {
                ...sampleSale,
                payments: [
                    { method: 'gift_card', amount: 5.00 },
                    { method: 'cash', amount: 15.00 },
                ],
            };
            await service.printSaleReceipt(saleWithGiftCard);
            // Gift card should be excluded from payments
            (0, vitest_1.expect)(capturedRequest.data.cashPayment).toBe('15.00');
            (0, vitest_1.expect)(capturedRequest.data.cardPayment).toBe('0.00');
            // Gift card should be applied as item discount
            const item = capturedRequest.data.items[0];
            (0, vitest_1.expect)(parseFloat(item.discountAmount)).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should handle credit sale as cash', async () => {
            let capturedRequest;
            mockedAxios.post = vitest_1.vi.fn((url, data) => {
                capturedRequest = data;
                return Promise.resolve({
                    status: 200,
                    data: { code: 0, data: { document_number: 'FP123' } },
                });
            });
            const creditSale = {
                ...sampleSale,
                payments: [],
                payment_status: 'credit',
            };
            await service.printSaleReceipt(creditSale);
            // Credit sale should be recorded as cash
            (0, vitest_1.expect)(capturedRequest.data.cashPayment).toBe('20.00');
        });
        (0, vitest_1.it)('should handle mixed payment methods', async () => {
            let capturedRequest;
            mockedAxios.post = vitest_1.vi.fn((url, data) => {
                capturedRequest = data;
                return Promise.resolve({
                    status: 200,
                    data: { code: 0, data: { document_number: 'FP123' } },
                });
            });
            const mixedSale = {
                ...sampleSale,
                payments: [
                    { method: 'cash', amount: 10.00 },
                    { method: 'card', amount: 10.00 },
                ],
            };
            await service.printSaleReceipt(mixedSale);
            (0, vitest_1.expect)(capturedRequest.data.cashPayment).toBe('10.00');
            (0, vitest_1.expect)(capturedRequest.data.cardPayment).toBe('10.00');
        });
    });
    // ==========================================================================
    // Omnitech Tests
    // ==========================================================================
    (0, vitest_1.describe)('Omnitech Provider', () => {
        (0, vitest_1.beforeEach)(async () => {
            await service.initialize(omnitechConfig);
        });
        (0, vitest_1.it)('should format Omnitech request correctly', async () => {
            let capturedRequest;
            mockedAxios.post = vitest_1.vi.fn((url, data) => {
                capturedRequest = data;
                return Promise.resolve({
                    status: 200,
                    data: {
                        code: 0,
                        document_number: 123,
                        long_id: 'LONG-ID-123',
                    },
                });
            });
            await service.printSaleReceipt(sampleSale);
            (0, vitest_1.expect)(capturedRequest).toHaveProperty('requestData');
            (0, vitest_1.expect)(capturedRequest.requestData).toHaveProperty('checkData');
            (0, vitest_1.expect)(capturedRequest.requestData.checkData.check_type).toBe(1);
            (0, vitest_1.expect)(capturedRequest.requestData).toHaveProperty('products');
            (0, vitest_1.expect)(capturedRequest.requestData).toHaveProperty('payments');
        });
        (0, vitest_1.it)('should handle Omnitech success response', async () => {
            mockedAxios.post = vitest_1.vi.fn(() => Promise.resolve({
                status: 200,
                data: {
                    code: 0,
                    document_number: 123,
                    long_id: 'LONG-ID-123',
                    short_id: 'SHORT-123',
                },
            }));
            const result = await service.printSaleReceipt(sampleSale);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.fiscalNumber).toBe('123');
            (0, vitest_1.expect)(result.fiscalDocumentId).toBe('LONG-ID-123');
        });
        (0, vitest_1.it)('should handle Omnitech error response', async () => {
            mockedAxios.post = vitest_1.vi.fn(() => Promise.resolve({
                status: 200,
                data: {
                    code: 1,
                    message: 'Printer error',
                },
            }));
            const result = await service.printSaleReceipt(sampleSale);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toBe('Printer error');
        });
    });
    // ==========================================================================
    // Error Handling Tests
    // ==========================================================================
    (0, vitest_1.describe)('Error Handling', () => {
        (0, vitest_1.beforeEach)(async () => {
            await service.initialize(casposConfig);
        });
        (0, vitest_1.it)('should handle connection refused error', async () => {
            mockedAxios.post = vitest_1.vi.fn(() => Promise.reject({
                code: 'ECONNREFUSED',
                message: 'Connection refused',
                isAxiosError: true,
            }));
            const result = await service.printSaleReceipt(sampleSale);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('offline or unreachable');
        });
        (0, vitest_1.it)('should handle timeout error', async () => {
            mockedAxios.post = vitest_1.vi.fn(() => Promise.reject({
                code: 'ETIMEDOUT',
                message: 'Timeout',
                isAxiosError: true,
            }));
            const result = await service.printSaleReceipt(sampleSale);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('offline or unreachable');
        });
        (0, vitest_1.it)('should handle HTTP error status', async () => {
            mockedAxios.post = vitest_1.vi.fn(() => Promise.reject({
                response: { status: 500 },
                message: 'Server error',
                isAxiosError: true,
            }));
            const result = await service.printSaleReceipt(sampleSale);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('HTTP 500');
        });
        (0, vitest_1.it)('should require initialization before printing', async () => {
            const uninitializedService = new fiscal_service_1.FiscalPrinterService();
            const result = await uninitializedService.printSaleReceipt(sampleSale);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('not initialized');
        });
    });
    // ==========================================================================
    // Connection Test
    // ==========================================================================
    (0, vitest_1.describe)('testConnection()', () => {
        (0, vitest_1.beforeEach)(async () => {
            await service.initialize(casposConfig);
        });
        (0, vitest_1.it)('should return success on successful connection', async () => {
            mockedAxios.get = vitest_1.vi.fn(() => Promise.resolve({ status: 200, data: {} }));
            const result = await service.testConnection();
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.provider).toBe('caspos');
            (0, vitest_1.expect)(result.responseTime).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should return error on failed connection', async () => {
            mockedAxios.get = vitest_1.vi.fn(() => Promise.reject(new Error('Connection failed')));
            const result = await service.testConnection();
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toBe('Connection failed');
        });
    });
    // ==========================================================================
    // Helper Methods Tests
    // ==========================================================================
    (0, vitest_1.describe)('Helper Methods', () => {
        (0, vitest_1.it)('should get correct provider name', async () => {
            await service.initialize(casposConfig);
            (0, vitest_1.expect)(service.getProviderName()).toBe('Caspos');
            await service.initialize(omnitechConfig);
            (0, vitest_1.expect)(service.getProviderName()).toBe('Omnitech');
        });
        (0, vitest_1.it)('should check initialization status', async () => {
            (0, vitest_1.expect)(service.isInitialized()).toBe(false);
            await service.initialize(casposConfig);
            (0, vitest_1.expect)(service.isInitialized()).toBe(true);
        });
        (0, vitest_1.it)('should return current config', async () => {
            (0, vitest_1.expect)(service.getConfig()).toBeNull();
            await service.initialize(casposConfig);
            (0, vitest_1.expect)(service.getConfig()).toEqual(casposConfig);
        });
    });
});
//# sourceMappingURL=fiscal-service.test.js.map