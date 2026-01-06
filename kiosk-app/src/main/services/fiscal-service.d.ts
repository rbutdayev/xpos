/**
 * Fiscal Printer Service
 *
 * Direct integration with fiscal printers for kiosk app.
 * Supports multiple providers: Caspos, Datecs, Omnitech, NBA, OneClick, AzSmart
 *
 * This service communicates directly with fiscal printers via HTTP,
 * bypassing the need for a bridge agent (unlike web app).
 */
import type { Sale, FiscalConfig } from '../../shared/types';
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
export declare class FiscalPrinterService {
    private config;
    private httpClient;
    private logger;
    constructor();
    /**
     * Initialize fiscal printer configuration
     * Should be called with config from SQLite database
     */
    initialize(config: FiscalConfig): Promise<void>;
    /**
     * Check if provider is properly configured
     */
    private isProviderConfigured;
    /**
     * Print sale receipt to fiscal printer
     *
     * @param sale - Sale data from SQLite
     * @returns Fiscal print result with fiscal number
     */
    printSaleReceipt(sale: Sale): Promise<FiscalPrintResult>;
    /**
     * Test connection to fiscal printer
     */
    testConnection(): Promise<FiscalConnectionTest>;
    /**
     * Get shift status (for providers that support it)
     */
    getShiftStatus(): Promise<FiscalShiftStatus>;
    /**
     * Format sale request based on provider
     */
    private formatSaleRequest;
    /**
     * Format Caspos request (matches backend exactly)
     * Reference: /app/Services/FiscalPrinterService.php::formatCasposRequest
     */
    private formatCasposRequest;
    /**
     * Format Omnitech request
     */
    private formatOmnitechRequest;
    /**
     * Format generic request (NBA, OneClick, AzSmart, etc.)
     */
    private formatGenericRequest;
    /**
     * Parse fiscal response based on provider
     */
    private parseFiscalResponse;
    /**
     * Parse Caspos response
     * Format: {"code": 0, "message": "...", "data": {"document_number": "..."}}
     */
    private parseCasposResponse;
    /**
     * Parse Omnitech response
     * Format: {"code": 0, "document_number": X, "long_id": "...", "short_id": "..."}
     */
    private parseOmnitechResponse;
    /**
     * Parse generic response
     */
    private parseGenericResponse;
    /**
     * Parse shift status response
     */
    private parseShiftStatus;
    /**
     * Get API endpoint URL based on provider and action
     */
    private getApiEndpoint;
    /**
     * Get request headers with authentication
     */
    private getRequestHeaders;
    /**
     * Get current configuration
     */
    getConfig(): FiscalConfig | null;
    /**
     * Check if fiscal printer is initialized
     */
    isInitialized(): boolean;
    /**
     * Get provider name
     */
    getProviderName(): string;
}
export declare const fiscalService: FiscalPrinterService;
//# sourceMappingURL=fiscal-service.d.ts.map