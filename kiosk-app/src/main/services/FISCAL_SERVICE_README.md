# Fiscal Printer Service

Direct fiscal printer integration for the xPOS Kiosk App. This service enables the kiosk to communicate directly with fiscal printers via HTTP, eliminating the need for a bridge agent.

## Overview

The Fiscal Printer Service provides:

- ✅ **Direct HTTP communication** with fiscal printers (no bridge needed)
- ✅ **Multi-provider support** (Caspos, Omnitech, NBA, OneClick, AzSmart, Datecs)
- ✅ **Offline-first design** (sales succeed even if fiscal fails)
- ✅ **Error handling & retry logic**
- ✅ **TypeScript type safety**
- ✅ **Request formatting matching backend exactly**

## Architecture

### Web App vs Kiosk App

```
┌────────────────────────────────────────────────────────────┐
│ WEB APP (Browser)                                          │
│                                                            │
│  Sale → Backend → FiscalPrinterJob → Bridge Agent (polls) │
│                                          ↓                 │
│                                    Fiscal Printer          │
│                                                            │
│  Indirect: Browser can't access local hardware            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ KIOSK APP (Desktop)                                        │
│                                                            │
│  Sale → Fiscal Service → Direct HTTP → Fiscal Printer ✅  │
│                                                            │
│  Direct: Desktop app has local network access             │
└────────────────────────────────────────────────────────────┘
```

### Key Differences

| Feature | Web App | Kiosk App |
|---------|---------|-----------|
| Communication | Indirect (via bridge) | Direct HTTP |
| Bridge Agent | Required | Not needed |
| Network Access | Limited (browser sandbox) | Full (desktop app) |
| Latency | Higher (polling) | Lower (direct) |
| Complexity | Higher | Lower |

## Supported Providers

### 1. Caspos (Primary)

- **Port**: 5544 (default)
- **Auth**: Basic Auth (username/password)
- **API Format**: Custom JSON (`operation`, `username`, `password`, `data`)
- **Features**: Full support including gift cards, credit sales, mixed payments

### 2. Omnitech

- **Port**: 8989 (default)
- **Auth**: Access token (login required)
- **API Format**: `requestData` with `checkData` and `products`
- **Features**: Login session management, document IDs

### 3. NBA Smart

- **Port**: 9898 (default)
- **Auth**: Basic Auth
- **API Format**: Generic JSON

### 4. OneClick

- **Port**: 9876 (default)
- **Auth**: Security Key
- **API Format**: Generic JSON

### 5. AzSmart

- **Port**: 8008 (default)
- **Auth**: Merchant ID
- **API Format**: Generic JSON

### 6. Datecs

- **Port**: 8080 (default)
- **Auth**: Varies
- **API Format**: Generic JSON

## Installation

### Prerequisites

```bash
npm install axios uuid
npm install -D @types/uuid
```

### Import

```typescript
import { fiscalService } from './services/fiscal-service';
import type { FiscalConfig, Sale } from '../shared/types';
```

## Usage

### 1. Initialize Fiscal Service

```typescript
// Load fiscal config from SQLite
const config: FiscalConfig = await db.getFiscalConfig();

// Initialize fiscal service
try {
  await fiscalService.initialize(config);
  console.log('Fiscal printer ready:', fiscalService.getProviderName());
} catch (error) {
  console.error('Fiscal printer initialization failed:', error);
  // Continue without fiscal (offline-first)
}
```

### 2. Print Sale Receipt

```typescript
const sale: Sale = {
  branch_id: 5,
  customer_id: null,
  items: [
    {
      product_id: 123,
      variant_id: null,
      product_name: 'Product A',
      quantity: 2,
      unit_price: 10.00,
      discount_amount: 0,
    },
  ],
  payments: [
    { method: 'cash', amount: 20.00 },
  ],
  subtotal: 20.00,
  tax_amount: 0,
  discount_amount: 0,
  total: 20.00,
  payment_status: 'paid',
  created_at: new Date().toISOString(),
};

const result = await fiscalService.printSaleReceipt(sale);

if (result.success) {
  console.log('✓ Fiscal Number:', result.fiscalNumber);
  // Update sale in database
  await db.updateSale(sale.local_id, {
    fiscal_number: result.fiscalNumber,
    fiscal_document_id: result.fiscalDocumentId,
  });
} else {
  console.warn('⚠ Fiscal failed:', result.error);
  // Sale continues without fiscal number
}
```

### 3. Test Connection

```typescript
const test = await fiscalService.testConnection();

if (test.success) {
  console.log(`✓ Fiscal printer online (${test.responseTime}ms)`);
} else {
  console.error(`✗ Fiscal printer offline: ${test.error}`);
}
```

### 4. Check Shift Status

```typescript
const status = await fiscalService.getShiftStatus();

if (!status.isOpen) {
  console.warn('⚠ Shift is closed. Sales cannot be fiscalized.');
} else if (status.isExpired) {
  console.warn('⚠ Shift expired (>24 hours). Please close and reopen.');
} else {
  console.log(`✓ Shift open (${status.durationHours} hours)`);
}
```

## Integration Pattern (Recommended)

```typescript
async function createKioskSale(saleData: Sale) {
  // STEP 1: Save to SQLite (ALWAYS succeeds - offline first)
  const localId = await db.insertSale(saleData);
  console.log('✓ Sale saved locally');

  // STEP 2: Try fiscal (MAY fail - graceful degradation)
  let fiscalNumber: string | undefined;

  try {
    if (fiscalService.isInitialized()) {
      const result = await fiscalService.printSaleReceipt(saleData);

      if (result.success) {
        fiscalNumber = result.fiscalNumber;
        await db.updateSale(localId, {
          fiscal_number: fiscalNumber,
          fiscal_document_id: result.fiscalDocumentId,
        });
        console.log('✓ Fiscal:', fiscalNumber);
      } else {
        console.warn('⚠ Fiscal failed:', result.error);
      }
    }
  } catch (error) {
    console.error('⚠ Fiscal error:', error);
    // Continue without fiscal
  }

  // STEP 3: Queue for sync (includes fiscal if printed)
  await db.queueSaleForSync(localId);
  console.log('✓ Sale queued for backend sync');

  return {
    success: true,
    localId,
    fiscalNumber,
    message: fiscalNumber ? 'Sale with fiscal' : 'Sale without fiscal',
  };
}
```

## Payment Method Handling

### Cash Payment

```typescript
payments: [
  { method: 'cash', amount: 20.00 },
]
// Caspos: cashPayment = 20.00
```

### Card Payment

```typescript
payments: [
  { method: 'card', amount: 20.00 },
]
// Caspos: cardPayment = 20.00
```

### Mixed Payments

```typescript
payments: [
  { method: 'cash', amount: 10.00 },
  { method: 'card', amount: 10.00 },
]
// Caspos: cashPayment = 10.00, cardPayment = 10.00
```

### Gift Card (Applied as Discount)

```typescript
payments: [
  { method: 'gift_card', amount: 5.00 },  // Treated as discount
  { method: 'cash', amount: 15.00 },
]
// Caspos: cashPayment = 15.00
// Gift card amount distributed as item discounts proportionally
```

### Credit Sale (Debt)

```typescript
payments: [],
payment_status: 'credit',
// Caspos: cashPayment = total (Azerbaijan fiscal rules)
// Debt tracking is internal, fiscal shows cash sale
```

### Partial Payment

```typescript
payments: [
  { method: 'cash', amount: 10.00 },
],
payment_status: 'partial',
total: 20.00,
// Caspos: cashPayment = 20.00 (unpaid amount added using same method)
```

## Error Handling

### Connection Errors

```typescript
// Printer offline
{ success: false, error: 'Fiscal printer offline or unreachable' }

// Timeout
{ success: false, error: 'Fiscal printer offline or unreachable' }

// HTTP error
{ success: false, error: 'HTTP 500: Server error' }
```

### Retry Logic

```typescript
async function printWithRetry(sale: Sale, maxRetries = 1) {
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const result = await fiscalService.printSaleReceipt(sale);

    if (result.success) {
      return result;
    }

    if (attempt <= maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}
```

### Graceful Degradation

**Key Principle**: Sales ALWAYS succeed, fiscal is optional.

```typescript
// ✅ CORRECT: Sale succeeds even if fiscal fails
try {
  await db.saveSale(sale); // Always succeeds
  await fiscalService.printSaleReceipt(sale); // May fail, that's OK
} catch (error) {
  // Sale is already saved, continue
}

// ❌ WRONG: Don't let fiscal failure block sale
try {
  await fiscalService.printSaleReceipt(sale); // May fail
  await db.saveSale(sale); // Never reached if fiscal fails!
} catch (error) {
  // Sale lost!
}
```

## Provider-Specific Details

### Caspos

**Request Format**:
```typescript
{
  "operation": "sale",
  "username": "admin",
  "password": "password",
  "data": {
    "documentUUID": "uuid-here",
    "cashPayment": "20.00",
    "cardPayment": "0.00",
    "creditPayment": "0.00",
    "bonusPayment": "0.00",
    "items": [
      {
        "name": "Product A",
        "code": "123",
        "quantity": "2.000",
        "salePrice": "10.00",
        "purchasePrice": "0.00",
        "codeType": 1,
        "quantityType": 0,
        "vatType": 1,
        "discountAmount": "0.00",
        "itemUuid": "uuid-here"
      }
    ],
    "cashierName": "Kassir",
    "note": "Satış",
    "currency": "AZN"
  }
}
```

**Response Format**:
```typescript
{
  "code": 0, // 0 = success
  "message": "Success",
  "data": {
    "document_number": "FP123456",
    "document_id": "DOC789"
  }
}
```

**VAT Types**:
- `1`: 18% VAT (default)
- `2`: Trade 18%
- `3`: VAT-free
- `5`: 0%
- `6`: Simplified 2%
- `7`: Simplified 8%

**Quantity Types**:
- `0`: Pieces (Ədəd)
- `1`: Kilograms (KQ)
- `2`: Liters (L)
- `3`: Meters (M)
- `4`: Square Meters (M²)
- `5`: Cubic Meters (M³)

### Omnitech

**Request Format**:
```typescript
{
  "requestData": {
    "checkData": {
      "check_type": 1 // 1 = sale, 40 = login
    },
    "products": [
      {
        "name": "Product A",
        "price": 10.00,
        "quantity": 2,
        "vat": 18
      }
    ],
    "payments": [
      {
        "type": 0, // 0 = cash, 1 = card
        "amount": 20.00
      }
    ]
  },
  "access_token": "token-here" // If logged in
}
```

**Response Format**:
```typescript
{
  "code": 0,
  "document_number": 123,
  "long_id": "LONG-ID-123",
  "short_id": "SHORT-123"
}
```

## Configuration

### Fiscal Config Structure

```typescript
interface FiscalConfig {
  account_id: number;
  provider: 'caspos' | 'omnitech' | 'nba' | 'oneclick' | 'azsmart' | 'datecs';
  ip_address: string;        // e.g., '192.168.1.100'
  port: number;              // e.g., 5544
  operator_code: string;     // Username or key
  operator_password: string; // Password
  username?: string;         // Explicit username
  password?: string;         // Explicit password
  security_key?: string;     // For OneClick
  merchant_id?: string;      // For AzSmart
  credit_contract_number?: string; // For Caspos bank credit
  default_tax_rate?: number; // VAT rate (0, 2, 8, 18)
  is_active: boolean;
}
```

### Database Schema (SQLite)

```sql
CREATE TABLE fiscal_config (
  id INTEGER PRIMARY KEY,
  account_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  port INTEGER NOT NULL,
  operator_code TEXT,
  operator_password TEXT,
  is_active INTEGER DEFAULT 1,
  last_synced_at TEXT
);
```

## Testing

### Unit Tests

```bash
npm run test fiscal-service.test.ts
```

### Manual Testing

```typescript
// 1. Test connection
const test = await fiscalService.testConnection();
console.log('Connection:', test);

// 2. Print test receipt
const testSale = createTestSale();
const result = await fiscalService.printSaleReceipt(testSale);
console.log('Result:', result);

// 3. Check shift status
const status = await fiscalService.getShiftStatus();
console.log('Shift:', status);
```

## Troubleshooting

### Fiscal Printer Not Responding

1. **Check network connectivity**:
   ```bash
   ping 192.168.1.100
   ```

2. **Verify port is open**:
   ```bash
   telnet 192.168.1.100 5544
   ```

3. **Test with curl**:
   ```bash
   curl -X POST http://192.168.1.100:5544 \
     -H "Content-Type: application/json" \
     -d '{"operation":"status"}'
   ```

### Shift Not Open

- Open shift manually on fiscal printer
- Some providers require Z-report to close shift after 24 hours

### Invalid Response

- Check provider configuration (username/password)
- Verify API endpoint format
- Check fiscal printer logs

### Timeout Errors

- Increase timeout: `axios.create({ timeout: 60000 })`
- Check network latency
- Verify fiscal printer is not busy

## Best Practices

### 1. Always Initialize on App Start

```typescript
async function initializeApp() {
  const config = await db.getFiscalConfig();

  if (config && config.is_active) {
    try {
      await fiscalService.initialize(config);
      console.log('✓ Fiscal printer initialized');
    } catch (error) {
      console.warn('⚠ Fiscal initialization failed:', error);
      // Continue without fiscal
    }
  }
}
```

### 2. Use Offline-First Pattern

```typescript
// Save first, print second
await db.saveSale(sale);
await fiscalService.printSaleReceipt(sale);
```

### 3. Log Fiscal Errors

```typescript
if (!result.success) {
  await db.logFiscalError({
    sale_id: sale.local_id,
    error: result.error,
    timestamp: new Date().toISOString(),
  });
}
```

### 4. Queue Failed Fiscals

```typescript
if (!result.success) {
  await db.queueForFiscalRetry(sale.local_id);
  // Retry later when connection restored
}
```

### 5. Monitor Shift Status

```typescript
setInterval(async () => {
  const status = await fiscalService.getShiftStatus();

  if (status.isExpired) {
    showNotification('⚠ Fiscal shift expired. Please close shift.');
  }
}, 3600000); // Check every hour
```

## Comparison with Backend

The kiosk fiscal service **exactly matches** the backend implementation:

| Feature | Backend (PHP) | Kiosk (TypeScript) |
|---------|---------------|-------------------|
| Request Format | ✅ Identical | ✅ Identical |
| Response Parsing | ✅ Identical | ✅ Identical |
| Provider Support | Caspos, Omnitech, etc. | Caspos, Omnitech, etc. |
| Gift Card Handling | Proportional discount | Proportional discount |
| Credit Sale | As cash | As cash |
| Payment Mapping | Same logic | Same logic |

**Source**: `/app/Services/FiscalPrinterService.php`

## Security Considerations

### 1. Credentials Storage

```typescript
// Store fiscal config encrypted in SQLite
await db.saveFiscalConfig({
  ...config,
  password: encrypt(config.password), // Encrypt password
});
```

### 2. HTTPS (Optional)

```typescript
// Use HTTPS if fiscal printer supports it
const url = `https://${config.ip_address}:${config.port}`;
```

### 3. Local Network Only

- Fiscal printers should be on isolated network
- No internet access required
- Firewall rules: allow only local subnet

## Performance

### Benchmarks

- **Caspos**: ~200-500ms per receipt
- **Omnitech**: ~300-600ms (includes login)
- **Network latency**: <10ms (local network)

### Optimization

```typescript
// Timeout optimization
const httpClient = axios.create({
  timeout: 10000, // 10 seconds (faster than default 30s)
});

// Concurrent printing (if multiple printers)
await Promise.all([
  fiscalService1.printSaleReceipt(sale),
  fiscalService2.printSaleReceipt(sale),
]);
```

## License

Part of xPOS Kiosk App - Copyright (c) 2024

## Support

For issues or questions:
- Check logs: `kiosk-app/logs/fiscal-printer.log`
- Backend reference: `/app/Services/FiscalPrinterService.php`
- Contact: support@xpos.com
