/**
 * Fiscal Service Tests
 *
 * Unit tests for FiscalPrinterService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FiscalPrinterService } from './fiscal-service';
import type { FiscalConfig, Sale } from '../../shared/types';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

describe('FiscalPrinterService', () => {
  let service: FiscalPrinterService;
  let casposConfig: FiscalConfig;
  let omnitechConfig: FiscalConfig;
  let sampleSale: Sale;

  beforeEach(() => {
    service = new FiscalPrinterService();

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
    mockedAxios.create = vi.fn(() => ({
      post: mockedAxios.post,
      get: mockedAxios.get,
    }));
  });

  // ==========================================================================
  // Initialization Tests
  // ==========================================================================

  describe('initialize()', () => {
    it('should initialize with valid Caspos config', async () => {
      await service.initialize(casposConfig);

      expect(service.isInitialized()).toBe(true);
      expect(service.getProviderName()).toBe('Caspos');
      expect(service.getConfig()).toEqual(casposConfig);
    });

    it('should initialize with valid Omnitech config', async () => {
      await service.initialize(omnitechConfig);

      expect(service.isInitialized()).toBe(true);
      expect(service.getProviderName()).toBe('Omnitech');
    });

    it('should throw error for inactive config', async () => {
      const inactiveConfig = { ...casposConfig, is_active: false };

      await expect(service.initialize(inactiveConfig)).rejects.toThrow(
        'Fiscal printer is not active'
      );
    });

    it('should throw error for missing IP address', async () => {
      const invalidConfig = { ...casposConfig, ip_address: '' };

      await expect(service.initialize(invalidConfig)).rejects.toThrow(
        'Fiscal printer IP address or port not configured'
      );
    });

    it('should throw error for unconfigured provider', async () => {
      const unconfiguredConfig = {
        ...casposConfig,
        operator_code: null,
        operator_password: null,
      };

      await expect(service.initialize(unconfiguredConfig)).rejects.toThrow(
        'not properly configured'
      );
    });
  });

  // ==========================================================================
  // Caspos Tests
  // ==========================================================================

  describe('Caspos Provider', () => {
    beforeEach(async () => {
      await service.initialize(casposConfig);
    });

    it('should format Caspos request correctly', async () => {
      let capturedRequest: any;

      mockedAxios.post = vi.fn((url, data) => {
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
      expect(capturedRequest).toHaveProperty('operation', 'sale');
      expect(capturedRequest).toHaveProperty('username', 'admin');
      expect(capturedRequest).toHaveProperty('password', 'password');
      expect(capturedRequest).toHaveProperty('data');

      const data = capturedRequest.data;
      expect(data).toHaveProperty('documentUUID');
      expect(data).toHaveProperty('cashPayment', '20.00');
      expect(data).toHaveProperty('cardPayment', '0.00');
      expect(data).toHaveProperty('items');
      expect(data.items).toHaveLength(1);
      expect(data.items[0]).toHaveProperty('name', 'Test Product');
      expect(data.items[0]).toHaveProperty('quantity', '2.000');
      expect(data.items[0]).toHaveProperty('salePrice', '10.00');
    });

    it('should handle Caspos success response', async () => {
      mockedAxios.post = vi.fn(() =>
        Promise.resolve({
          status: 200,
          data: {
            code: 0,
            message: 'Success',
            data: {
              document_number: 'FP123456',
              document_id: 'DOC789',
            },
          },
        })
      );

      const result = await service.printSaleReceipt(sampleSale);

      expect(result.success).toBe(true);
      expect(result.fiscalNumber).toBe('FP123456');
      expect(result.fiscalDocumentId).toBe('DOC789');
    });

    it('should handle Caspos error response', async () => {
      mockedAxios.post = vi.fn(() =>
        Promise.resolve({
          status: 200,
          data: {
            code: 1,
            message: 'Shift not open',
          },
        })
      );

      const result = await service.printSaleReceipt(sampleSale);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Shift not open');
    });

    it('should handle gift card payment as discount', async () => {
      let capturedRequest: any;

      mockedAxios.post = vi.fn((url, data) => {
        capturedRequest = data;
        return Promise.resolve({
          status: 200,
          data: { code: 0, data: { document_number: 'FP123' } },
        });
      });

      const saleWithGiftCard: Sale = {
        ...sampleSale,
        payments: [
          { method: 'gift_card', amount: 5.00 },
          { method: 'cash', amount: 15.00 },
        ],
      };

      await service.printSaleReceipt(saleWithGiftCard);

      // Gift card should be excluded from payments
      expect(capturedRequest.data.cashPayment).toBe('15.00');
      expect(capturedRequest.data.cardPayment).toBe('0.00');

      // Gift card should be applied as item discount
      const item = capturedRequest.data.items[0];
      expect(parseFloat(item.discountAmount)).toBeGreaterThan(0);
    });

    it('should handle credit sale as cash', async () => {
      let capturedRequest: any;

      mockedAxios.post = vi.fn((url, data) => {
        capturedRequest = data;
        return Promise.resolve({
          status: 200,
          data: { code: 0, data: { document_number: 'FP123' } },
        });
      });

      const creditSale: Sale = {
        ...sampleSale,
        payments: [],
        payment_status: 'credit',
      };

      await service.printSaleReceipt(creditSale);

      // Credit sale should be recorded as cash
      expect(capturedRequest.data.cashPayment).toBe('20.00');
    });

    it('should handle mixed payment methods', async () => {
      let capturedRequest: any;

      mockedAxios.post = vi.fn((url, data) => {
        capturedRequest = data;
        return Promise.resolve({
          status: 200,
          data: { code: 0, data: { document_number: 'FP123' } },
        });
      });

      const mixedSale: Sale = {
        ...sampleSale,
        payments: [
          { method: 'cash', amount: 10.00 },
          { method: 'card', amount: 10.00 },
        ],
      };

      await service.printSaleReceipt(mixedSale);

      expect(capturedRequest.data.cashPayment).toBe('10.00');
      expect(capturedRequest.data.cardPayment).toBe('10.00');
    });
  });

  // ==========================================================================
  // Omnitech Tests
  // ==========================================================================

  describe('Omnitech Provider', () => {
    beforeEach(async () => {
      await service.initialize(omnitechConfig);
    });

    it('should format Omnitech request correctly', async () => {
      let capturedRequest: any;

      mockedAxios.post = vi.fn((url, data) => {
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

      expect(capturedRequest).toHaveProperty('requestData');
      expect(capturedRequest.requestData).toHaveProperty('checkData');
      expect(capturedRequest.requestData.checkData.check_type).toBe(1);
      expect(capturedRequest.requestData).toHaveProperty('products');
      expect(capturedRequest.requestData).toHaveProperty('payments');
    });

    it('should handle Omnitech success response', async () => {
      mockedAxios.post = vi.fn(() =>
        Promise.resolve({
          status: 200,
          data: {
            code: 0,
            document_number: 123,
            long_id: 'LONG-ID-123',
            short_id: 'SHORT-123',
          },
        })
      );

      const result = await service.printSaleReceipt(sampleSale);

      expect(result.success).toBe(true);
      expect(result.fiscalNumber).toBe('123');
      expect(result.fiscalDocumentId).toBe('LONG-ID-123');
    });

    it('should handle Omnitech error response', async () => {
      mockedAxios.post = vi.fn(() =>
        Promise.resolve({
          status: 200,
          data: {
            code: 1,
            message: 'Printer error',
          },
        })
      );

      const result = await service.printSaleReceipt(sampleSale);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Printer error');
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    beforeEach(async () => {
      await service.initialize(casposConfig);
    });

    it('should handle connection refused error', async () => {
      mockedAxios.post = vi.fn(() =>
        Promise.reject({
          code: 'ECONNREFUSED',
          message: 'Connection refused',
          isAxiosError: true,
        })
      );

      const result = await service.printSaleReceipt(sampleSale);

      expect(result.success).toBe(false);
      expect(result.error).toContain('offline or unreachable');
    });

    it('should handle timeout error', async () => {
      mockedAxios.post = vi.fn(() =>
        Promise.reject({
          code: 'ETIMEDOUT',
          message: 'Timeout',
          isAxiosError: true,
        })
      );

      const result = await service.printSaleReceipt(sampleSale);

      expect(result.success).toBe(false);
      expect(result.error).toContain('offline or unreachable');
    });

    it('should handle HTTP error status', async () => {
      mockedAxios.post = vi.fn(() =>
        Promise.reject({
          response: { status: 500 },
          message: 'Server error',
          isAxiosError: true,
        })
      );

      const result = await service.printSaleReceipt(sampleSale);

      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP 500');
    });

    it('should require initialization before printing', async () => {
      const uninitializedService = new FiscalPrinterService();

      const result = await uninitializedService.printSaleReceipt(sampleSale);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not initialized');
    });
  });

  // ==========================================================================
  // Connection Test
  // ==========================================================================

  describe('testConnection()', () => {
    beforeEach(async () => {
      await service.initialize(casposConfig);
    });

    it('should return success on successful connection', async () => {
      mockedAxios.get = vi.fn(() =>
        Promise.resolve({ status: 200, data: {} })
      );

      const result = await service.testConnection();

      expect(result.success).toBe(true);
      expect(result.provider).toBe('caspos');
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should return error on failed connection', async () => {
      mockedAxios.get = vi.fn(() =>
        Promise.reject(new Error('Connection failed'))
      );

      const result = await service.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });
  });

  // ==========================================================================
  // Helper Methods Tests
  // ==========================================================================

  describe('Helper Methods', () => {
    it('should get correct provider name', async () => {
      await service.initialize(casposConfig);
      expect(service.getProviderName()).toBe('Caspos');

      await service.initialize(omnitechConfig);
      expect(service.getProviderName()).toBe('Omnitech');
    });

    it('should check initialization status', async () => {
      expect(service.isInitialized()).toBe(false);

      await service.initialize(casposConfig);
      expect(service.isInitialized()).toBe(true);
    });

    it('should return current config', async () => {
      expect(service.getConfig()).toBeNull();

      await service.initialize(casposConfig);
      expect(service.getConfig()).toEqual(casposConfig);
    });
  });
});
