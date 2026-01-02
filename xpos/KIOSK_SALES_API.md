# Kiosk Sales API Implementation

## Overview

This document describes the sales API implementation for the kiosk system. The implementation provides endpoints for creating sales in real-time and uploading batched sales from offline queues.

## Files Created

### 1. Service Layer
**File:** `/app/Services/KioskSaleProcessor.php`

**Purpose:** Handles all sale processing logic for the kiosk system.

**Key Methods:**
- `processSingleSale(array $saleData, int $accountId): Sale` - Process a single sale in real-time
- `processBatchSales(array $salesData, int $accountId): array` - Process multiple sales from offline queue
- `getSaleStatusByLocalId(string $localId, int $accountId): ?array` - Check if a sale has been synced

**Features:**
- ✅ Stock updates (following branch/warehouse logic)
- ✅ Fiscal printer job creation (if needed)
- ✅ Dashboard cache invalidation
- ✅ Loyalty points awarding
- ✅ Idempotency support (duplicate prevention via local_id)
- ✅ Payment record creation
- ✅ Stock history tracking
- ✅ Support for fiscal numbers from kiosk

### 2. Controller Layer
**File:** `/app/Http/Controllers/Kiosk/KioskSalesController.php`

**Purpose:** HTTP endpoints for kiosk sales operations.

**Endpoints:**

#### Create Single Sale (Real-time)
```
POST /api/kiosk/sale
```
**Request Body:**
```json
{
  "local_id": 123,
  "branch_id": 5,
  "customer_id": 789,
  "items": [
    {
      "product_id": 123,
      "variant_id": null,
      "quantity": 2,
      "unit_price": 29.99,
      "discount_amount": 0
    }
  ],
  "payments": [
    {
      "method": "cash",
      "amount": 59.98
    }
  ],
  "subtotal": 59.98,
  "tax_amount": 0,
  "discount_amount": 0,
  "payment_status": "paid",
  "fiscal_number": "FP123456",
  "fiscal_document_id": "DOC789",
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "sale": {
    "server_sale_id": 9876,
    "sale_number": "SALE-2024-001",
    "total": 59.98,
    "status": "completed",
    "payment_status": "paid",
    "fiscal_number": "FP123456",
    "fiscal_document_id": "DOC789",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

#### Upload Batch Sales (Offline Queue)
```
POST /api/kiosk/sales/upload
```
**Request Body:**
```json
{
  "sales": [
    {
      "local_id": 1,
      "branch_id": 5,
      "customer_id": 789,
      "items": [...],
      "payments": [...],
      "subtotal": 59.98,
      "tax_amount": 0,
      "discount_amount": 0,
      "total": 59.98,
      "payment_status": "paid",
      "fiscal_number": "FP123456",
      "fiscal_document_id": "DOC789",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "local_id": 1,
      "server_sale_id": 9876,
      "sale_number": "SALE-2024-001",
      "status": "created"
    }
  ],
  "failed": [],
  "summary": {
    "total": 1,
    "successful": 1,
    "failed": 0
  }
}
```

#### Get Sale Status by Local ID
```
GET /api/kiosk/sales/status/{localId}
```

**Response:**
```json
{
  "success": true,
  "synced": true,
  "sale": {
    "server_sale_id": 9876,
    "sale_number": "SALE-2024-001",
    "total": 59.98,
    "status": "completed",
    "payment_status": "paid",
    "fiscal_number": "FP123456",
    "fiscal_document_id": "DOC789",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

### 3. Routes
**File:** `/routes/api.php`

All routes are under `/api/kiosk/*` prefix with `kiosk.auth` middleware.

**Sales Routes:**
- `POST /api/kiosk/sale` - Create single sale
- `POST /api/kiosk/sales/upload` - Upload batch sales
- `GET /api/kiosk/sales/status/{localId}` - Check sale sync status

**Rate Limiting:**
- Sales endpoints: 50 requests/minute (via `kiosk.rate_limit:sales` middleware)

## Key Features

### 1. Idempotency Support
The system prevents duplicate sales by:
- Tracking `local_id` in sale notes as "Kiosk Local ID: {id}"
- Checking for existing sales before creating new ones
- Returning existing sale data if duplicate detected

### 2. Stock Management
- Follows the same stock update logic as POSController
- Updates product stock in branch warehouses
- Creates stock history records
- Creates stock movement records
- Supports variant stock tracking

### 3. Fiscal Printer Integration
Two modes:
1. **Kiosk already printed** (recommended):
   - Kiosk prints directly to fiscal printer via HTTP
   - Sends fiscal_number and fiscal_document_id to backend
   - Backend stores fiscal data with sale

2. **Backend prints** (fallback):
   - If no fiscal data provided, backend creates FiscalPrinterJob
   - Bridge agent picks up job and prints
   - Only if fiscal_printer_enabled and valid shift

### 4. Loyalty Points
- Awards loyalty points automatically if:
  - Customer is specified
  - Payment status is "paid"
  - Loyalty program is active
- Follows loyalty program rules (earn_on_discounted_items, etc.)

### 5. Dashboard Cache Invalidation
- Automatically clears dashboard cache after successful sales
- Uses `DashboardService::clearCache()` method
- Ensures dashboard shows latest data

## Authentication

All endpoints require:
- **Bearer Token** in Authorization header
- Token must be active in `kiosk_device_tokens` table
- Middleware sets `kiosk_account_id`, `kiosk_branch_id`, `kiosk_device_id` in request

Example:
```bash
curl -X POST https://api.example.com/api/kiosk/sale \
  -H "Authorization: Bearer ksk_abc123..." \
  -H "Content-Type: application/json" \
  -d '{"branch_id": 5, "items": [...]}'
```

## Validation Rules

All sales must include:
- `branch_id` (required, exists in branches table)
- `items` (required, array with min 1 item)
- Each item must have:
  - `product_id` (required, exists)
  - `quantity` (required, numeric, min 0.001)
  - `unit_price` (required, numeric, min 0)
- `payment_status` (required: paid, credit, partial)

Optional fields:
- `local_id` (integer, for idempotency)
- `customer_id` (required if payment_status is credit/partial)
- `variant_id` (for variant products)
- `payments` (array of payment methods)
- `fiscal_number` (if kiosk already printed)
- `fiscal_document_id` (if kiosk already printed)
- `created_at` (ISO8601 timestamp)

## Error Handling

### Validation Errors (422)
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "items": ["The items field is required."]
  }
}
```

### Server Errors (500)
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Sale not found",
  "synced": false
}
```

## Testing

### Test Single Sale Creation
```bash
curl -X POST http://localhost:8000/api/kiosk/sale \
  -H "Authorization: Bearer YOUR_KIOSK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "local_id": 123,
    "branch_id": 1,
    "items": [
      {
        "product_id": 1,
        "quantity": 2,
        "unit_price": 10.00
      }
    ],
    "payment_status": "paid"
  }'
```

### Test Batch Upload
```bash
curl -X POST http://localhost:8000/api/kiosk/sales/upload \
  -H "Authorization: Bearer YOUR_KIOSK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sales": [
      {
        "local_id": 1,
        "branch_id": 1,
        "items": [...],
        "payment_status": "paid",
        "created_at": "2024-01-15T10:00:00Z"
      }
    ]
  }'
```

### Check Sale Status
```bash
curl -X GET http://localhost:8000/api/kiosk/sales/status/123 \
  -H "Authorization: Bearer YOUR_KIOSK_TOKEN"
```

## Dependencies

The implementation relies on:
- ✅ `KioskAuthMiddleware` - Authentication
- ✅ `KioskRateLimitMiddleware` - Rate limiting
- ✅ `LoyaltyService` - Loyalty points
- ✅ `FiscalPrinterService` - Fiscal printer jobs
- ✅ `DashboardService` - Cache invalidation
- ✅ POSController logic - Sale creation patterns

## Database Tables Used

- `sales` - Sale records
- `sale_items` - Sale line items
- `payments` - Payment records
- `product_stock` - Stock levels
- `stock_history` - Stock change history
- `stock_movements` - Stock movements
- `fiscal_printer_jobs` - Fiscal printer queue
- `loyalty_transactions` - Loyalty points (if customer)
- `kiosk_device_tokens` - Authentication

## Notes

1. **No POSController modifications** - All logic is self-contained in KioskSaleProcessor
2. **Account-scoped** - All queries filtered by account_id from kiosk token
3. **Multitenant safe** - Uses middleware-injected account context
4. **Logging** - Comprehensive logging for debugging
5. **Transaction safety** - Uses DB transactions for data integrity
6. **Duplicate prevention** - Idempotency via local_id tracking

## Future Enhancements

- [ ] Real-time WebSocket notifications on sale creation
- [ ] Support for sale returns via kiosk
- [ ] Offline queue retry logic with exponential backoff
- [ ] Metrics dashboard for kiosk performance
- [ ] Webhook notifications to kiosk on sale updates
