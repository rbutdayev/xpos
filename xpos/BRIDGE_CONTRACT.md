# Fiscal Printer Bridge Contract

This document defines the contract between the Laravel application and the fiscal printer bridge service.

## Overview

The bridge is a separate service (typically Node.js/Go) that:
1. Polls the `fiscal_printer_jobs` table for pending jobs
2. Sends requests to fiscal printers (Caspos, etc.)
3. Updates job status and stores responses back in the database

## Database Contract

### Table: `fiscal_printer_jobs`

#### Fields the Bridge Must Read:
- `id` - Job identifier
- `account_id` - Account this job belongs to
- `sale_id` - Sale identifier (if sale operation)
- `return_id` - Return identifier (if return operation)
- `status` - Current status (`pending`, `processing`, `completed`, `failed`)
- `request_data` - JSON containing the full request to send to printer
- `provider` - Printer provider (`caspos`, etc.)
- `retry_count` - Number of retry attempts
- `next_retry_at` - When to retry (if applicable)

#### Fields the Bridge Must Write:

**On Success:**
```php
[
    'status' => 'completed',
    'fiscal_number' => '123',              // Short display number (e.g., "60", "123")
    'fiscal_document_id' => 'abc123...',   // Long hash for returns (Caspos document_id)
    'response_data' => [...],              // Full response from printer (for debugging)
    'completed_at' => now(),
]
```

**On Error:**
```php
[
    'status' => 'failed',
    'error_message' => 'Error description',
    'response_data' => [...],              // Store response even on error!
    'retry_count' => $currentRetry + 1,
    'next_retry_at' => now()->addMinutes(5),
    'is_retriable' => true/false,          // false for "Təkrar satış" errors
]
```

## CRITICAL: Handling HTTP 500 Responses

### ⚠️ Caspos May Return 500 Even on Success

We've observed that Caspos sometimes returns HTTP 500 **even when the operation succeeds** and the receipt is printed. Therefore:

**The bridge MUST:**
1. **Always store `response_data`** - even on HTTP errors
2. **Check response body for fiscal data** - even on 500 errors
3. **If response contains valid fiscal data** → mark job as `completed`
4. **Only mark as `failed`** if response body indicates actual failure

### Example Implementation (Pseudo-code):

```javascript
try {
    const response = await axios.post(printerUrl, requestBody);
    // Success path (200/201)
    await updateJob({
        status: 'completed',
        fiscal_number: response.data.document_number,
        fiscal_document_id: response.data.document_id,
        response_data: response.data,
        completed_at: new Date(),
    });
} catch (error) {
    // IMPORTANT: Check if error response has fiscal data
    const responseData = error.response?.data;

    // Store response for debugging
    await updateJobResponseData(jobId, responseData);

    // Check if it's actually successful despite 500 error
    if (responseData?.document_number || responseData?.document_id) {
        console.log('⚠️ Got 500 but response contains fiscal data - treating as success');
        await updateJob({
            status: 'completed',
            fiscal_number: responseData.document_number,
            fiscal_document_id: responseData.document_id,
            response_data: responseData,
            completed_at: new Date(),
        });
        return;
    }

    // Check for non-retriable errors
    const errorMessage = responseData?.message || error.message;
    const isRetriable = !errorMessage.includes('Təkrar satış');

    await updateJob({
        status: 'failed',
        error_message: errorMessage,
        response_data: responseData,
        retry_count: currentRetry + 1,
        next_retry_at: isRetriable ? addMinutes(new Date(), 5) : null,
        is_retriable: isRetriable,
    });
}
```

## Request Data Format

### Structure:
```json
{
    "method": "POST",
    "url": "http://192.168.0.45:5544/api/print",
    "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer {token}"
    },
    "body": {
        "operation": "sale",
        "username": "user",
        "password": "pass",
        "data": {
            "documentUUID": "...",
            "items": [...],
            "cashPayment": 100.0,
            "cardPayment": 0.0
        }
    }
}
```

### Important Data Type Rules:
- All numeric values (quantity, prices, payments) **MUST be floats**, not strings
- Example: `"salePrice": 150.0` ✅ NOT `"salePrice": "150.00"` ❌

## Caspos Response Format

### Sale Operation Success:
```json
{
    "document_number": "60",           // Short number (display to user)
    "document_id": "abc123def456...",  // Long hash (needed for returns)
    "status": "success"
}
```

### Return (moneyBack) Operation Success:
```json
{
    "document_number": "61",
    "document_id": "xyz789...",
    "parent_document_id": "abc123...",
    "status": "success"
}
```

### Error Response:
```json
{
    "message": "Təkrar satış",  // Or other error message
    "status": "error"
}
```

## Fiscal Number vs Fiscal Document ID

**IMPORTANT DISTINCTION:**

1. **fiscal_number** (Short)
   - Example: "60", "123", "SAT-2025-001"
   - For display to users
   - Printed on receipts
   - Caspos field: `document_number`

2. **fiscal_document_id** (Long Hash)
   - Example: "a1b2c3d4e5f6..."
   - Required for return (moneyBack) operations as `parentDocumentId`
   - Caspos field: `document_id`
   - NOT for display

**Both must be stored!** Returns will fail without fiscal_document_id.

## Return Operation Requirements

For Caspos `moneyBack` operations:
- `parentDocumentId` MUST be the long `fiscal_document_id` from original sale
- If original sale doesn't have `fiscal_document_id`, return job should not be created
- Laravel validates this before creating the job

## Retry Logic

### When to Retry:
- Network errors
- Timeout errors
- HTTP 5xx errors (except when response has fiscal data)
- Any error where `is_retriable` is not explicitly set to false

### When NOT to Retry:
- "Təkrar satış" (Duplicate sale) - set `is_retriable: false`
- Authentication failures after 3 attempts
- Invalid request format (4xx errors)

### Retry Schedule:
```
Attempt 1: immediate
Attempt 2: +5 minutes
Attempt 3: +15 minutes
Attempt 4: +30 minutes
Attempt 5+: mark as permanently failed
```

## Bridge Authentication

The bridge should use a token from `fiscal_printer_bridge_tokens` table:
- Poll jobs for `account_id` matching the token
- Update `last_seen_at` on each poll (heartbeat)
- Store bridge version and info in `bridge_info` JSON field

## Status Flow

```
pending → processing → completed
    ↓          ↓
    ↓       failed (retriable) → pending (retry)
    ↓          ↓
    ↓       failed (non-retriable) → stays failed
    ↓
 (stale after 5 minutes) → reset to pending
```

## Testing Checklist

- [ ] Bridge stores response_data on both success and error
- [ ] Bridge checks for fiscal data in 500 error responses
- [ ] Both fiscal_number and fiscal_document_id are extracted correctly
- [ ] Non-retriable errors ("Təkrar satış") don't retry forever
- [ ] Successful prints update the sale/return record in database
- [ ] Return operations send correct parentDocumentId (long hash)
- [ ] All numeric values in request are floats, not strings

## Debugging

If prints succeed but jobs stay failed:
1. Check `response_data` field in database
2. Verify fiscal data extraction logic
3. Check if HTTP status is 500 despite successful print
4. Ensure both `fiscal_number` AND `fiscal_document_id` are stored

---

**Version:** 1.0
**Last Updated:** 2025-11-27
