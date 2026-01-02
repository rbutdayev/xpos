/**
 * Fiscal Service Usage Examples
 *
 * This file demonstrates how to use the FiscalPrinterService
 * in the kiosk application.
 */

import { fiscalService } from './fiscal-service';
import type { Sale, FiscalConfig } from '../../shared/types';

// ============================================================================
// Example 1: Initialize Fiscal Service
// ============================================================================

async function initializeFiscalPrinter() {
  // Fetch fiscal config from SQLite (assume db is your database instance)
  const config: FiscalConfig = {
    account_id: 123,
    provider: 'caspos',
    ip_address: '192.168.1.100',
    port: 5544,
    operator_code: 'admin', // username for Caspos
    operator_password: 'password123',
    username: 'admin', // explicit username
    password: 'password123', // explicit password
    default_tax_rate: 18, // 18% VAT
    is_active: true,
  };

  try {
    await fiscalService.initialize(config);
    console.log('Fiscal printer initialized successfully');
    console.log('Provider:', fiscalService.getProviderName());
  } catch (error) {
    console.error('Failed to initialize fiscal printer:', error);
  }
}

// ============================================================================
// Example 2: Test Connection
// ============================================================================

async function testFiscalConnection() {
  const result = await fiscalService.testConnection();

  if (result.success) {
    console.log('✓ Fiscal printer online');
    console.log(`  Provider: ${result.provider}`);
    console.log(`  Response time: ${result.responseTime}ms`);
  } else {
    console.error('✗ Fiscal printer offline');
    console.error(`  Error: ${result.error}`);
  }
}

// ============================================================================
// Example 3: Print Sale Receipt (Main Use Case)
// ============================================================================

async function printSaleReceiptExample() {
  // Sample sale data (from SQLite)
  const sale: Sale = {
    local_id: 1,
    branch_id: 5,
    customer_id: 789,
    items: [
      {
        product_id: 123,
        variant_id: null,
        product_name: 'Coca Cola 0.5L',
        quantity: 2,
        unit_price: 1.50,
        discount_amount: 0,
      },
      {
        product_id: 456,
        variant_id: null,
        product_name: 'Snickers',
        quantity: 1,
        unit_price: 0.80,
        discount_amount: 0.10, // 10 qəpik discount
      },
    ],
    payments: [
      {
        method: 'cash',
        amount: 3.70,
      },
    ],
    subtotal: 3.80,
    tax_amount: 0,
    discount_amount: 0.10,
    total: 3.70,
    payment_status: 'paid',
    notes: 'Test sale',
    created_at: new Date().toISOString(),
  };

  try {
    const result = await fiscalService.printSaleReceipt(sale);

    if (result.success) {
      console.log('✓ Fiscal receipt printed successfully');
      console.log(`  Fiscal Number: ${result.fiscalNumber}`);
      console.log(`  Document ID: ${result.fiscalDocumentId}`);

      // Update sale in SQLite with fiscal number
      // db.updateSale(sale.local_id, {
      //   fiscal_number: result.fiscalNumber,
      //   fiscal_document_id: result.fiscalDocumentId,
      // });

      return result;
    } else {
      console.error('✗ Failed to print fiscal receipt');
      console.error(`  Error: ${result.error}`);

      // Sale continues without fiscal number (offline-first)
      // db.queueSaleForSync(sale.local_id);

      return result;
    }
  } catch (error) {
    console.error('Exception during fiscal printing:', error);
    // Sale continues without fiscal (fail gracefully)
    return { success: false, error: String(error) };
  }
}

// ============================================================================
// Example 4: Complete Sale Flow with Fiscal Printing
// ============================================================================

async function completeSaleWithFiscal(saleData: Sale) {
  console.log('Processing sale...');

  // Step 1: Save sale to SQLite (always succeeds, offline-first)
  // const localId = db.insertSale(saleData);
  const localId = 123; // Mock

  console.log(`✓ Sale saved locally (ID: ${localId})`);

  // Step 2: Print to fiscal printer (optional, may fail)
  try {
    const fiscalResult = await fiscalService.printSaleReceipt(saleData);

    if (fiscalResult.success) {
      console.log(`✓ Fiscal receipt printed: ${fiscalResult.fiscalNumber}`);

      // Update sale with fiscal number
      // db.updateSale(localId, {
      //   fiscal_number: fiscalResult.fiscalNumber,
      //   fiscal_document_id: fiscalResult.fiscalDocumentId,
      // });
    } else {
      console.warn('⚠ Fiscal printer failed, continuing without fiscal');
      console.warn(`  Reason: ${fiscalResult.error}`);
      // Sale is still valid, just no fiscal number
    }
  } catch (error) {
    console.warn('⚠ Fiscal printer offline, continuing without fiscal');
    // Sale is still valid
  }

  // Step 3: Queue for backend sync (fiscal number included if printed)
  // db.queueSaleForSync(localId);
  console.log('✓ Sale queued for backend sync');

  return { success: true, localId };
}

// ============================================================================
// Example 5: Handle Different Payment Methods
// ============================================================================

async function saleWithMixedPayments() {
  const sale: Sale = {
    branch_id: 5,
    customer_id: null,
    items: [
      {
        product_id: 100,
        variant_id: null,
        product_name: 'T-Shirt',
        quantity: 1,
        unit_price: 25.00,
        discount_amount: 5.00, // 5 AZN discount
      },
    ],
    payments: [
      {
        method: 'cash',
        amount: 10.00, // Partial cash
      },
      {
        method: 'card',
        amount: 10.00, // Partial card
      },
    ],
    subtotal: 25.00,
    tax_amount: 0,
    discount_amount: 5.00,
    total: 20.00,
    payment_status: 'paid',
    created_at: new Date().toISOString(),
  };

  const result = await fiscalService.printSaleReceipt(sale);

  if (result.success) {
    console.log('✓ Mixed payment sale fiscalized');
    console.log(`  Cash: 10 AZN, Card: 10 AZN`);
    console.log(`  Fiscal: ${result.fiscalNumber}`);
  }
}

// ============================================================================
// Example 6: Gift Card Payment (Applied as Discount)
// ============================================================================

async function saleWithGiftCard() {
  const sale: Sale = {
    branch_id: 5,
    customer_id: null,
    items: [
      {
        product_id: 200,
        variant_id: null,
        product_name: 'Shoes',
        quantity: 1,
        unit_price: 100.00,
        discount_amount: 0,
      },
    ],
    payments: [
      {
        method: 'gift_card', // Gift card is treated as discount in Caspos
        amount: 30.00,
      },
      {
        method: 'cash',
        amount: 70.00,
      },
    ],
    subtotal: 100.00,
    tax_amount: 0,
    discount_amount: 0,
    total: 100.00,
    payment_status: 'paid',
    created_at: new Date().toISOString(),
  };

  const result = await fiscalService.printSaleReceipt(sale);

  if (result.success) {
    console.log('✓ Gift card sale fiscalized');
    console.log('  Gift card applied as item discount (30 AZN)');
    console.log('  Cash payment: 70 AZN');
    console.log(`  Fiscal: ${result.fiscalNumber}`);
  }
}

// ============================================================================
// Example 7: Credit Sale (Debt)
// ============================================================================

async function creditSale() {
  const sale: Sale = {
    branch_id: 5,
    customer_id: 999,
    items: [
      {
        product_id: 300,
        variant_id: null,
        product_name: 'Laptop',
        quantity: 1,
        unit_price: 1500.00,
        discount_amount: 0,
      },
    ],
    payments: [], // No payments - full credit
    subtotal: 1500.00,
    tax_amount: 0,
    discount_amount: 0,
    total: 1500.00,
    payment_status: 'credit', // Full credit (debt)
    created_at: new Date().toISOString(),
  };

  const result = await fiscalService.printSaleReceipt(sale);

  if (result.success) {
    console.log('✓ Credit sale fiscalized');
    console.log('  Azerbaijan fiscal rules: credit recorded as cash sale');
    console.log('  Debt tracking is internal, fiscal shows cash');
    console.log(`  Fiscal: ${result.fiscalNumber}`);
  }
}

// ============================================================================
// Example 8: Error Handling & Retry Logic
// ============================================================================

async function saleWithRetry(sale: Sale, maxRetries = 1) {
  let attempts = 0;

  while (attempts <= maxRetries) {
    attempts++;

    try {
      const result = await fiscalService.printSaleReceipt(sale);

      if (result.success) {
        console.log(`✓ Fiscal printed on attempt ${attempts}`);
        return result;
      } else {
        if (attempts > maxRetries) {
          console.warn('⚠ Max retries reached, continuing without fiscal');
          return result;
        }
        console.log(`⚠ Attempt ${attempts} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      }
    } catch (error) {
      if (attempts > maxRetries) {
        console.error('✗ Fiscal printer unreachable, continuing without fiscal');
        return { success: false, error: String(error) };
      }
      console.log(`⚠ Attempt ${attempts} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

// ============================================================================
// Example 9: Check Shift Status
// ============================================================================

async function checkShiftStatus() {
  const status = await fiscalService.getShiftStatus();

  if (status.isOpen) {
    console.log('✓ Fiscal shift is open');
    console.log(`  Duration: ${status.durationHours} hours`);

    if (status.isExpired) {
      console.warn('⚠ Shift has expired (>24 hours)');
      console.warn('  Please close shift (Z-report) and open new shift');
    }
  } else {
    console.warn('⚠ Fiscal shift is closed');
    console.warn('  Sales cannot be fiscalized until shift is opened');
  }
}

// ============================================================================
// Example 10: Integration Pattern (Recommended)
// ============================================================================

/**
 * Recommended pattern for kiosk sale creation
 */
async function createKioskSale(saleData: Sale) {
  console.log('=== Creating Kiosk Sale ===');

  // STEP 1: Save to local SQLite (ALWAYS succeeds - offline first!)
  const localId = 123; // db.insertSale(saleData);
  console.log(`✓ Sale saved locally (ID: ${localId})`);

  // STEP 2: Try to print fiscal receipt (MAY fail - graceful degradation)
  let fiscalNumber: string | undefined;
  let fiscalDocumentId: string | undefined;

  try {
    if (fiscalService.isInitialized()) {
      const fiscalResult = await fiscalService.printSaleReceipt(saleData);

      if (fiscalResult.success) {
        fiscalNumber = fiscalResult.fiscalNumber;
        fiscalDocumentId = fiscalResult.fiscalDocumentId;
        console.log(`✓ Fiscal receipt: ${fiscalNumber}`);

        // Update sale with fiscal data
        // db.updateSale(localId, { fiscal_number: fiscalNumber, fiscal_document_id: fiscalDocumentId });
      } else {
        console.warn(`⚠ Fiscal failed: ${fiscalResult.error}`);
        // Continue without fiscal
      }
    } else {
      console.warn('⚠ Fiscal printer not configured');
    }
  } catch (error) {
    console.error('⚠ Fiscal printer error:', error);
    // Continue without fiscal
  }

  // STEP 3: Queue for backend sync (includes fiscal number if printed)
  // db.queueSaleForSync(localId);
  console.log('✓ Sale queued for sync');

  // STEP 4: Return success (sale always succeeds, fiscal is optional)
  return {
    success: true,
    localId,
    fiscalNumber,
    fiscalDocumentId,
    message: fiscalNumber
      ? 'Sale completed with fiscal receipt'
      : 'Sale completed (fiscal unavailable)',
  };
}

// ============================================================================
// Export Examples
// ============================================================================

export {
  initializeFiscalPrinter,
  testFiscalConnection,
  printSaleReceiptExample,
  completeSaleWithFiscal,
  saleWithMixedPayments,
  saleWithGiftCard,
  creditSale,
  saleWithRetry,
  checkShiftStatus,
  createKioskSale,
};
