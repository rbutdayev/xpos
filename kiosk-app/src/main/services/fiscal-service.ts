/**
 * Fiscal Printer Service
 *
 * Direct integration with fiscal printers for kiosk app.
 * Supports multiple providers: Caspos, Datecs, Omnitech, NBA, OneClick, AzSmart
 *
 * This service communicates directly with fiscal printers via HTTP,
 * bypassing the need for a bridge agent (unlike web app).
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import type { Sale, SaleItem, SalePayment, FiscalConfig } from '../../shared/types';

// ============================================================================
// Types
// ============================================================================

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

// Caspos API Types (based on backend implementation)
interface CasposItem {
  name: string;
  code: string;
  quantity: string; // Formatted with 3 decimals
  salePrice: string; // Formatted with 2 decimals
  purchasePrice: string; // Formatted with 2 decimals
  codeType: number; // 0=Plain, 1=EAN8, 2=EAN13, 3=Service
  quantityType: number; // 0=Pieces, 1=KG, 2=Liter, 3=Meter, 4=M2, 5=M3
  vatType: number; // 1=18%, 2=Trade18%, 3=VAT-free, 5=0%, 6=2%, 7=8%
  discountAmount: string; // Formatted with 2 decimals
  itemUuid: string;
}

interface CasposSaleData {
  documentUUID: string;
  cashPayment: string;
  creditPayment: string;
  cardPayment: string;
  bonusPayment: string;
  items: CasposItem[];
  clientName?: string | null;
  clientTotalBonus?: number;
  clientEarnedBonus?: number;
  clientBonusCardNumber?: string | null;
  cashierName?: string;
  note?: string;
  currency: string;
  creditContract?: string;
}

interface CasposRequest {
  operation: 'sale';
  username: string;
  password: string;
  data: CasposSaleData;
}

interface CasposResponse {
  code: number | string; // 0 = success
  message?: string;
  data?: {
    document_number?: string;
    document_id?: string;
    [key: string]: any;
  };
}

// Omnitech API Types
interface OmnitechRequest {
  requestData: {
    checkData: {
      check_type: number; // 1 = sale
    };
    products: Array<{
      name: string;
      price: number;
      quantity: number;
      vat: number;
    }>;
    payments: Array<{
      type: number; // 0=cash, 1=card
      amount: number;
    }>;
  };
  access_token?: string;
}

interface OmnitechResponse {
  code: number | string; // 0 = success
  message?: string;
  document_number?: string;
  long_id?: string;
  short_id?: string;
}

// ============================================================================
// Fiscal Printer Service
// ============================================================================

export class FiscalPrinterService {
  private config: FiscalConfig | null = null;
  private httpClient: AxiosInstance;
  private logger: Console = console;

  constructor() {
    // Initialize HTTP client with sensible defaults
    this.httpClient = axios.create({
      timeout: 3000, // 3 seconds (reduced from 30s for faster failure)
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize fiscal printer configuration
   * Should be called with config from SQLite database
   */
  async initialize(config: FiscalConfig): Promise<void> {
    if (!config.is_active) {
      throw new Error('Fiscal printer is not active');
    }

    if (!config.ip_address || !config.port) {
      throw new Error('Fiscal printer IP address or port not configured');
    }

    // Validate provider-specific requirements
    if (!this.isProviderConfigured(config)) {
      throw new Error(`Fiscal printer provider ${config.provider} is not properly configured`);
    }

    this.config = config;
    this.logger.info('Fiscal printer initialized', {
      provider: config.provider,
      ip: config.ip_address,
      port: config.port,
    });
  }

  /**
   * Check if provider is properly configured
   */
  private isProviderConfigured(config: FiscalConfig): boolean {
    switch (config.provider) {
      case 'caspos':
      case 'nba':
      case 'omnitech':
        return !!(config.operator_code && config.operator_password);

      case 'oneclick':
        // OneClick requires security_key (would need to extend FiscalConfig type)
        return !!config.operator_code; // Using operator_code as security_key

      case 'azsmart':
        // AzSmart requires merchant_id (would need to extend FiscalConfig type)
        return !!config.operator_code; // Using operator_code as merchant_id

      default:
        return false;
    }
  }

  // ==========================================================================
  // Main Printing Methods
  // ==========================================================================

  /**
   * Print sale receipt to fiscal printer
   *
   * @param sale - Sale data from SQLite
   * @returns Fiscal print result with fiscal number
   */
  async printSaleReceipt(sale: Sale): Promise<FiscalPrintResult> {
    if (!this.config) {
      return {
        success: false,
        error: 'Fiscal printer not initialized. Call initialize() first.',
      };
    }

    try {
      this.logger.info('Printing fiscal receipt', {
        provider: this.config.provider,
        sale_total: sale.total,
      });

      const url = this.getApiEndpoint('print');
      const requestData = this.formatSaleRequest(sale);
      const headers = this.getRequestHeaders();

      const startTime = Date.now();
      const response = await this.httpClient.post(url, requestData, { headers });
      const responseTime = Date.now() - startTime;

      this.logger.info('Fiscal printer responded', {
        status: response.status,
        responseTime,
      });

      return this.parseFiscalResponse(response.data);

    } catch (error) {
      this.logger.error('Fiscal printer error', error);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ETIMEDOUT') {
          return {
            success: false,
            error: 'Fiscal printer offline or unreachable',
          };
        }
        return {
          success: false,
          error: `HTTP ${axiosError.response?.status}: ${axiosError.message}`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test connection to fiscal printer
   */
  async testConnection(): Promise<FiscalConnectionTest> {
    if (!this.config) {
      return {
        success: false,
        provider: 'unknown',
        error: 'Fiscal printer not initialized',
      };
    }

    try {
      const url = this.getApiEndpoint('test');
      const startTime = Date.now();

      // Send a lightweight test request (provider-specific)
      await this.httpClient.get(url, {
        headers: this.getRequestHeaders(),
        timeout: 5000, // 5 seconds for test
      });

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        provider: this.config.provider,
        responseTime,
      };

    } catch (error) {
      this.logger.error('Fiscal printer connection test failed', error);
      return {
        success: false,
        provider: this.config.provider,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * Get shift status (for providers that support it)
   */
  async getShiftStatus(): Promise<FiscalShiftStatus> {
    if (!this.config) {
      return { isOpen: false };
    }

    try {
      const url = this.getApiEndpoint('shift-status');
      const response = await this.httpClient.get(url, {
        headers: this.getRequestHeaders(),
        timeout: 5000,
      });

      // Provider-specific parsing
      return this.parseShiftStatus(response.data);

    } catch (error) {
      this.logger.error('Failed to get shift status', error);
      // Assume shift is open on error (fail open for sales to continue)
      return { isOpen: true };
    }
  }

  // ==========================================================================
  // Request Formatting (Provider-Specific)
  // ==========================================================================

  /**
   * Format sale request based on provider
   */
  private formatSaleRequest(sale: Sale): any {
    if (!this.config) {
      throw new Error('Config not initialized');
    }

    switch (this.config.provider) {
      case 'caspos':
        return this.formatCasposRequest(sale);

      case 'omnitech':
        return this.formatOmnitechRequest(sale);

      case 'nba':
      case 'oneclick':
      case 'azsmart':
      default:
        return this.formatGenericRequest(sale);
    }
  }

  /**
   * Format Caspos request (matches backend exactly)
   * Reference: /app/Services/FiscalPrinterService.php::formatCasposRequest
   */
  private formatCasposRequest(sale: Sale): CasposRequest {
    if (!this.config) {
      throw new Error('Config not initialized');
    }

    // Calculate total gift card amount to distribute as discount
    let totalGiftCardAmount = 0.0;
    for (const payment of sale.payments) {
      const method = payment.method.toLowerCase().trim();
      if (['hədiyyə_kartı', 'hediyye_karti', 'gift_card'].includes(method)) {
        totalGiftCardAmount += payment.amount;
      }
    }

    // Calculate subtotal for proportional discount distribution
    const subtotal = sale.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    // Format items
    const items: CasposItem[] = sale.items.map((item) => {
      // Calculate item's share of gift card discount (proportional to item total)
      const itemTotal = item.quantity * item.unit_price;
      let itemGiftCardDiscount = 0.0;
      if (totalGiftCardAmount > 0 && subtotal > 0) {
        itemGiftCardDiscount = (itemTotal / subtotal) * totalGiftCardAmount;
      }

      // Add existing discount + gift card discount
      const totalDiscount = item.discount_amount + itemGiftCardDiscount;

      return {
        name: item.product_name || `Product ${item.product_id}`,
        code: String(item.product_id), // Use product ID as code
        quantity: item.quantity.toFixed(3),
        salePrice: item.unit_price.toFixed(2),
        purchasePrice: '0.00', // Not available in kiosk sale data
        codeType: 1, // Default to EAN8
        quantityType: 0, // Default to pieces (Ədəd)
        vatType: 1, // Default to 18% VAT
        discountAmount: totalDiscount.toFixed(2),
        itemUuid: uuidv4(),
      };
    });

    // Calculate payment methods (excluding gift cards - they're applied as discounts)
    let cashPayment = 0.0;
    let cardPayment = 0.0;
    let creditPayment = 0.0;
    let bonusPayment = 0.0;

    // For credit sales (debt), Azerbaijan fiscal rules require recording as cash
    if (sale.payment_status === 'credit' && sale.payments.length === 0) {
      cashPayment = sale.total;
    } else {
      // Process actual payment records
      let primaryPaymentMethod: string | null = null;

      for (const payment of sale.payments) {
        const amount = payment.amount;
        const method = payment.method.toLowerCase().trim();

        // Remember first non-gift-card payment method
        if (primaryPaymentMethod === null &&
            !['hədiyyə_kartı', 'hediyye_karti', 'gift_card'].includes(method)) {
          primaryPaymentMethod = method;
        }

        // Map payment method to Caspos payment types
        switch (method) {
          case 'cash':
          case 'nağd':
          case 'nagd':
            cashPayment += amount;
            break;

          case 'card':
          case 'terminal':
          case 'kart':
          case 'köçürmə':
          case 'kocurme':
          case 'bank':
            cardPayment += amount;
            break;

          case 'credit':
          case 'kredit':
          case 'bank_kredit':
            creditPayment += amount;
            break;

          case 'bonus':
            bonusPayment += amount;
            break;

          case 'hədiyyə_kartı':
          case 'hediyye_karti':
          case 'gift_card':
            // Skip: Gift cards applied as discounts
            break;

          default:
            // Unknown method defaults to cash
            this.logger.warn('Unknown payment method, defaulting to cash', { method });
            cashPayment += amount;
        }
      }

      // For partial payment sales with remaining balance as debt
      if (sale.payment_status === 'partial') {
        const totalPaid = cashPayment + cardPayment + creditPayment + bonusPayment;
        const unpaidAmount = sale.total - totalPaid;

        if (unpaidAmount > 0) {
          // Add unpaid amount using the same payment method
          if (primaryPaymentMethod && ['kart', 'köçürmə', 'terminal'].includes(primaryPaymentMethod)) {
            cardPayment += unpaidAmount;
          } else {
            cashPayment += unpaidAmount;
          }
        }
      }
    }

    // Prepare Caspos data structure
    const data: CasposSaleData = {
      documentUUID: uuidv4(),
      cashPayment: cashPayment.toFixed(2),
      creditPayment: creditPayment.toFixed(2),
      cardPayment: cardPayment.toFixed(2),
      bonusPayment: bonusPayment.toFixed(2),
      items,
      clientName: null, // Customer data not available in basic sale
      clientTotalBonus: 0.0,
      clientEarnedBonus: 0.0,
      clientBonusCardNumber: null,
      cashierName: 'Kassir', // Default cashier name
      note: sale.notes || '',
      currency: 'AZN',
    };

    // Format according to Caspos API
    return {
      operation: 'sale',
      username: this.config.operator_code || '',
      password: this.config.operator_password || '',
      data,
    };
  }

  /**
   * Format Omnitech request
   */
  private formatOmnitechRequest(sale: Sale): OmnitechRequest {
    const products = sale.items.map((item) => ({
      name: item.product_name || `Product ${item.product_id}`,
      price: item.unit_price,
      quantity: item.quantity,
      vat: 18, // Default to 18% VAT
    }));

    const payments = sale.payments.map((payment) => {
      const method = payment.method.toLowerCase();
      return {
        type: ['cash', 'nağd', 'nagd'].includes(method) ? 0 : 1,
        amount: payment.amount,
      };
    });

    return {
      requestData: {
        checkData: {
          check_type: 1, // 1 = sale
        },
        products,
        payments,
      },
    };
  }

  /**
   * Format generic request (NBA, OneClick, AzSmart, etc.)
   */
  private formatGenericRequest(sale: Sale): any {
    const items = sale.items.map((item) => ({
      name: item.product_name || `Product ${item.product_id}`,
      quantity: item.quantity,
      price: item.unit_price,
      total: item.quantity * item.unit_price,
      discount: item.discount_amount,
    }));

    const payments = sale.payments.map((payment) => ({
      method: payment.method,
      amount: payment.amount,
    }));

    return {
      items,
      subtotal: sale.subtotal,
      tax_amount: sale.tax_amount,
      discount_amount: sale.discount_amount,
      total: sale.total,
      payments,
      notes: sale.notes,
    };
  }

  // ==========================================================================
  // Response Parsing (Provider-Specific)
  // ==========================================================================

  /**
   * Parse fiscal response based on provider
   */
  private parseFiscalResponse(responseData: any): FiscalPrintResult {
    if (!this.config) {
      return {
        success: false,
        error: 'Config not initialized',
      };
    }

    switch (this.config.provider) {
      case 'caspos':
        return this.parseCasposResponse(responseData);

      case 'omnitech':
        return this.parseOmnitechResponse(responseData);

      default:
        return this.parseGenericResponse(responseData);
    }
  }

  /**
   * Parse Caspos response
   * Format: {"code": 0, "message": "...", "data": {"document_number": "..."}}
   */
  private parseCasposResponse(responseData: CasposResponse): FiscalPrintResult {
    const code = Number(responseData.code);

    if (code === 0) {
      return {
        success: true,
        fiscalNumber: responseData.data?.document_number || responseData.data?.document_id,
        fiscalDocumentId: responseData.data?.document_id,
        responseData,
      };
    } else {
      return {
        success: false,
        error: responseData.message || `Error code: ${code}`,
        responseData,
      };
    }
  }

  /**
   * Parse Omnitech response
   * Format: {"code": 0, "document_number": X, "long_id": "...", "short_id": "..."}
   */
  private parseOmnitechResponse(responseData: OmnitechResponse): FiscalPrintResult {
    const code = Number(responseData.code);

    if (code === 0) {
      return {
        success: true,
        fiscalNumber: String(responseData.document_number),
        fiscalDocumentId: responseData.long_id,
        responseData,
      };
    } else {
      return {
        success: false,
        error: responseData.message || `Error code: ${code}`,
        responseData,
      };
    }
  }

  /**
   * Parse generic response
   */
  private parseGenericResponse(responseData: any): FiscalPrintResult {
    if (responseData.success) {
      return {
        success: true,
        fiscalNumber: responseData.fiscal_number || responseData.fiscalNumber,
        fiscalDocumentId: responseData.fiscal_document_id || responseData.fiscalDocumentId,
        responseData,
      };
    } else {
      return {
        success: false,
        error: responseData.error || responseData.message || 'Unknown error',
        responseData,
      };
    }
  }

  /**
   * Parse shift status response
   */
  private parseShiftStatus(responseData: any): FiscalShiftStatus {
    // Provider-specific parsing would go here
    // For now, return a basic structure
    return {
      isOpen: responseData.shift_open || true,
      openedAt: responseData.opened_at,
      durationHours: responseData.duration_hours,
      isExpired: responseData.is_expired || false,
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Get API endpoint URL based on provider and action
   */
  private getApiEndpoint(action: string): string {
    if (!this.config) {
      throw new Error('Config not initialized');
    }

    const base = `http://${this.config.ip_address}:${this.config.port}`;

    // Caspos uses base URL without specific endpoints (operation-based)
    if (this.config.provider === 'caspos') {
      return base;
    }

    // Omnitech uses base URL
    if (this.config.provider === 'omnitech') {
      return base;
    }

    // Other providers use endpoint paths
    return `${base}/api/${action}`;
  }

  /**
   * Get request headers with authentication
   */
  private getRequestHeaders(): Record<string, string> {
    if (!this.config) {
      return {};
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // Caspos requires UTF-8 encoding in Content-Type header
    if (this.config.provider === 'caspos') {
      headers['Content-Type'] = 'application/json; charset=utf-8';
    } else {
      headers['Content-Type'] = 'application/json';
    }

    // Add Basic Auth for providers that require it
    switch (this.config.provider) {
      case 'nba':
      case 'caspos':
      case 'oneclick':
        if (this.config.operator_code && this.config.operator_password) {
          const credentials = Buffer.from(
            `${this.config.operator_code}:${this.config.operator_password}`
          ).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
    }

    return headers;
  }

  /**
   * Get current configuration
   */
  getConfig(): FiscalConfig | null {
    return this.config;
  }

  /**
   * Check if fiscal printer is initialized
   */
  isInitialized(): boolean {
    return this.config !== null;
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    if (!this.config) {
      return 'Unknown';
    }

    const providerNames: Record<string, string> = {
      'caspos': 'Caspos',
      'omnitech': 'Omnitech',
      'nba': 'NBA Smart',
      'oneclick': 'OneClick',
      'azsmart': 'AzSmart',
      'datecs': 'Datecs',
    };

    return providerNames[this.config.provider] || this.config.provider;
  }
}

// Export singleton instance
export const fiscalService = new FiscalPrinterService();
