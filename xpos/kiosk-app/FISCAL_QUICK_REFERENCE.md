# Fiscal Service - Quick Reference Card

## Import

```typescript
import { fiscalService } from './services/fiscal-service';
import type { FiscalConfig, Sale } from '../shared/types';
```

## Initialize (App Startup)

```typescript
const config = await db.getFiscalConfig();
await fiscalService.initialize(config);
```

## Print Sale (Main Use Case)

```typescript
const result = await fiscalService.printSaleReceipt(sale);

if (result.success) {
  // Update sale with fiscal number
  await db.updateSale(sale.local_id, {
    fiscal_number: result.fiscalNumber,
    fiscal_document_id: result.fiscalDocumentId,
  });
} else {
  // Sale continues without fiscal
  console.warn('Fiscal failed:', result.error);
}
```

## Recommended Pattern

```typescript
async function createSale(saleData: Sale) {
  // 1. Save to SQLite (ALWAYS succeeds)
  const localId = await db.insertSale(saleData);

  // 2. Try fiscal (MAY fail - OK!)
  try {
    const result = await fiscalService.printSaleReceipt(saleData);
    if (result.success) {
      await db.updateSale(localId, { fiscal_number: result.fiscalNumber });
    }
  } catch (error) {
    // Continue without fiscal
  }

  // 3. Queue for sync
  await db.queueSaleForSync(localId);

  return { success: true, localId };
}
```

## Payment Methods

### Cash
```typescript
payments: [{ method: 'cash', amount: 20.00 }]
```

### Card
```typescript
payments: [{ method: 'card', amount: 20.00 }]
```

### Mixed
```typescript
payments: [
  { method: 'cash', amount: 10.00 },
  { method: 'card', amount: 10.00 },
]
```

### Gift Card (Applied as Discount)
```typescript
payments: [
  { method: 'gift_card', amount: 5.00 },  // Becomes discount
  { method: 'cash', amount: 15.00 },
]
```

### Credit (Debt)
```typescript
payments: [],
payment_status: 'credit',
// Caspos records as cash (Azerbaijan rules)
```

## Error Handling

```typescript
const result = await fiscalService.printSaleReceipt(sale);

// Always check success flag
if (result.success) {
  // Fiscal printed
} else {
  // Fiscal failed, but sale is valid
  console.error(result.error);
}
```

## Connection Test

```typescript
const test = await fiscalService.testConnection();
console.log(test.success ? 'Online' : 'Offline');
```

## Shift Status

```typescript
const status = await fiscalService.getShiftStatus();

if (!status.isOpen) {
  alert('Shift closed. Please open shift.');
}

if (status.isExpired) {
  alert('Shift expired (>24h). Please close shift.');
}
```

## Retry Logic

```typescript
async function printWithRetry(sale: Sale) {
  for (let i = 0; i < 2; i++) {
    const result = await fiscalService.printSaleReceipt(sale);
    if (result.success) return result;
    await new Promise(r => setTimeout(r, 1000)); // Wait 1s
  }
  return { success: false, error: 'Max retries' };
}
```

## Caspos Request (Example)

```json
{
  "operation": "sale",
  "username": "admin",
  "password": "password",
  "data": {
    "documentUUID": "uuid",
    "cashPayment": "20.00",
    "cardPayment": "0.00",
    "items": [
      {
        "name": "Product",
        "quantity": "2.000",
        "salePrice": "10.00",
        "vatType": 1,
        "discountAmount": "0.00",
        "itemUuid": "uuid"
      }
    ],
    "currency": "AZN"
  }
}
```

## Caspos Response (Success)

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "document_number": "FP123456",
    "document_id": "DOC789"
  }
}
```

## Caspos Response (Error)

```json
{
  "code": 1,
  "message": "Shift not open"
}
```

## Common Errors

| Error | Meaning | Solution |
|-------|---------|----------|
| `offline or unreachable` | Network issue | Check IP, ping printer |
| `Shift not open` | Shift closed | Open shift on printer |
| `Invalid credentials` | Wrong user/pass | Check config |
| `HTTP 500` | Printer error | Check printer logs |

## Provider Ports

| Provider | Default Port |
|----------|--------------|
| Caspos | 5544 |
| Omnitech | 8989 |
| NBA Smart | 9898 |
| OneClick | 9876 |
| AzSmart | 8008 |

## Fiscal Config

```typescript
interface FiscalConfig {
  provider: 'caspos' | 'omnitech' | 'nba' | ...;
  ip_address: string;     // e.g., '192.168.1.100'
  port: number;           // e.g., 5544
  operator_code: string;  // username
  operator_password: string;
  default_tax_rate: number; // 18
  is_active: boolean;
}
```

## Key Principles

1. **Offline-first**: Sales succeed even if fiscal fails
2. **Graceful degradation**: Continue without fiscal on error
3. **Never block**: Fiscal errors don't block sale
4. **Always log**: Track fiscal failures for debugging
5. **Retry smart**: Retry once, then continue

## Testing

```bash
# Unit tests
npm run test fiscal-service.test.ts

# Manual test
const result = await fiscalService.testConnection();
```

## Files

- `fiscal-service.ts` - Main implementation
- `fiscal-service.example.ts` - 10 usage examples
- `fiscal-service.test.ts` - Unit tests
- `FISCAL_SERVICE_README.md` - Full documentation

## Support

- Backend reference: `/app/Services/FiscalPrinterService.php`
- Kiosk plan: `/KIOSK_IMPLEMENTATION.md`
- Implementation: `/FISCAL_IMPLEMENTATION_SUMMARY.md`
