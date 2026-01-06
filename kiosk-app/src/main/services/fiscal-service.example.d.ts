/**
 * Fiscal Service Usage Examples
 *
 * This file demonstrates how to use the FiscalPrinterService
 * in the kiosk application.
 */
import type { Sale } from '../../shared/types';
declare function initializeFiscalPrinter(): Promise<void>;
declare function testFiscalConnection(): Promise<void>;
declare function printSaleReceiptExample(): Promise<import("./fiscal-service").FiscalPrintResult>;
declare function completeSaleWithFiscal(saleData: Sale): Promise<{
    success: boolean;
    localId: number;
}>;
declare function saleWithMixedPayments(): Promise<void>;
declare function saleWithGiftCard(): Promise<void>;
declare function creditSale(): Promise<void>;
declare function saleWithRetry(sale: Sale, maxRetries?: number): Promise<import("./fiscal-service").FiscalPrintResult>;
declare function checkShiftStatus(): Promise<void>;
/**
 * Recommended pattern for kiosk sale creation
 */
declare function createKioskSale(saleData: Sale): Promise<{
    success: boolean;
    localId: number;
    fiscalNumber: string | undefined;
    fiscalDocumentId: string | undefined;
    message: string;
}>;
export { initializeFiscalPrinter, testFiscalConnection, printSaleReceiptExample, completeSaleWithFiscal, saleWithMixedPayments, saleWithGiftCard, creditSale, saleWithRetry, checkShiftStatus, createKioskSale, };
//# sourceMappingURL=fiscal-service.example.d.ts.map