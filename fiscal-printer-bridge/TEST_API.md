# Testing Bridge API with curl

## Prerequisites

1. Create a token in admin panel:
   - Login to https://app.xpos.az
   - Go to: Parametrlər → Bridge Tokenlər
   - Create token: "Test Terminal"
   - Copy the token

2. Set token as environment variable:
   ```bash
   export TOKEN="xpos_STzbwOWA8n6x5GalZeZPfAzmE91IYQfG4BymsGvkB1BwJTgDSmzgR7wP"
   ```

---

## 1. Test Registration

```bash
curl -X POST https://app.xpos.az/api/bridge/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "2.0.0",
    "info": {
      "hostname": "test-machine",
      "platform": "darwin",
      "arch": "x64"
    }
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "account_id": 123,
  "bridge_name": "Test Terminal",
  "poll_interval": 2000
}
```

**Expected Response (Invalid Token):**
```json
{
  "success": false,
  "error": "Invalid or revoked token"
}
```
HTTP Status: 401

---

## 2. Test Polling (Get Jobs)

```bash
curl -X GET https://app.xpos.az/api/bridge/poll \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Expected Response (No Jobs):**
```json
{
  "success": true,
  "jobs": []
}
```

**Expected Response (With Jobs):**
```json
{
  "success": true,
  "jobs": [
    {
      "id": 1,
      "sale_id": 456,
      "provider": "caspos",
      "request_data": {
        "url": "http://192.168.0.45:5544",
        "headers": {
          "Content-Type": "application/json; charset=utf-8",
          "Accept": "application/json"
        },
        "body": {
          "operation": "printReceipt",
          "username": "admin",
          "password": "1234"
        }
      },
      "retry_count": 0
    }
  ]
}
```

---

## 3. Test Heartbeat

```bash
curl -X POST https://app.xpos.az/api/bridge/heartbeat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "2.0.0",
    "info": {
      "hostname": "test-machine"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "timestamp": "2025-11-26T20:00:00.000000Z"
}
```

---

## 4. Test Complete Job

First, get a job ID from polling, then:

```bash
curl -X POST https://app.xpos.az/api/bridge/job/1/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fiscal_number": "123456789",
    "response": {
      "code": 0,
      "message": "Success"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Job marked as completed"
}
```

---

## 5. Test Fail Job

```bash
curl -X POST https://app.xpos.az/api/bridge/job/1/fail \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "error": "Printer offline"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Job marked as failed",
  "can_retry": true
}
```

---

## Quick Test Script

Save this as `test_bridge_api.sh`:

```bash
#!/bin/bash

# Configuration
API_URL="https://app.xpos.az"
TOKEN="$1"

if [ -z "$TOKEN" ]; then
    echo "Usage: ./test_bridge_api.sh YOUR_TOKEN"
    exit 1
fi

echo "🧪 Testing Bridge API..."
echo "API: $API_URL"
echo "Token: ${TOKEN:0:15}..."
echo ""

# Test 1: Registration
echo "1️⃣  Testing Registration..."
RESPONSE=$(curl -s -X POST "$API_URL/api/bridge/register" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"version":"2.0.0","info":{"hostname":"test"}}')

echo "$RESPONSE" | jq .

if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ Registration: PASS"
else
    echo "❌ Registration: FAIL"
    exit 1
fi
echo ""

# Test 2: Polling
echo "2️⃣  Testing Polling..."
RESPONSE=$(curl -s -X GET "$API_URL/api/bridge/poll" \
  -H "Authorization: Bearer $TOKEN")

echo "$RESPONSE" | jq .

if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ Polling: PASS"
else
    echo "❌ Polling: FAIL"
    exit 1
fi
echo ""

# Test 3: Heartbeat
echo "3️⃣  Testing Heartbeat..."
RESPONSE=$(curl -s -X POST "$API_URL/api/bridge/heartbeat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"version":"2.0.0"}')

echo "$RESPONSE" | jq .

if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ Heartbeat: PASS"
else
    echo "❌ Heartbeat: FAIL"
    exit 1
fi
echo ""

echo "🎉 All tests passed!"
```

**Usage:**
```bash
chmod +x test_bridge_api.sh
./test_bridge_api.sh xpos_your_token_here
```

---

## Check Admin Panel Status

After testing, verify in admin panel:
1. Go to: Parametrlər → Bridge Tokenlər
2. Your test token should show:
   - Status: 🟢 Onlayn
   - Last seen: "a few seconds ago"
   - Bridge version: "2.0.0"

---

## Common HTTP Status Codes

| Code | Meaning | Reason |
|------|---------|--------|
| 200 | OK | Request successful |
| 401 | Unauthorized | Invalid/revoked token |
| 404 | Not Found | Job ID doesn't exist |
| 419 | CSRF Token Mismatch | API routes not configured (should not happen) |
| 422 | Validation Error | Missing required fields |
| 500 | Server Error | Check Laravel logs |

---

## Debugging

### Enable Verbose Output:
```bash
curl -v -X POST https://app.xpos.az/api/bridge/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"version":"2.0.0"}'
```

### Check Response Headers:
```bash
curl -i -X GET https://app.xpos.az/api/bridge/poll \
  -H "Authorization: Bearer $TOKEN"
```

### Test from Bridge Directory:
```bash
cd fiscal-printer-bridge

# Load token from config
TOKEN=$(cat config.json | grep token | cut -d'"' -f4)

# Test registration
curl -X POST https://app.xpos.az/api/bridge/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"version":"2.0.0"}'
```

---

## Integration Test

Full workflow test:

```bash
#!/bin/bash
TOKEN="your_token_here"
API="https://app.xpos.az"

# 1. Register
echo "Registering bridge..."
curl -s -X POST "$API/api/bridge/register" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"version":"2.0.0"}' | jq .

# 2. Send heartbeat
echo "Sending heartbeat..."
curl -s -X POST "$API/api/bridge/heartbeat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"version":"2.0.0"}' | jq .

# 3. Poll for jobs
echo "Polling for jobs..."
JOBS=$(curl -s -X GET "$API/api/bridge/poll" \
  -H "Authorization: Bearer $TOKEN")

echo "$JOBS" | jq .

# 4. If jobs exist, get first job ID
JOB_ID=$(echo "$JOBS" | jq -r '.jobs[0].id // empty')

if [ -n "$JOB_ID" ]; then
    echo "Found job #$JOB_ID, marking as completed..."
    curl -s -X POST "$API/api/bridge/job/$JOB_ID/complete" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"fiscal_number":"TEST123"}' | jq .
else
    echo "No jobs pending"
fi
```

---

## Pre-Deployment Checklist

- [ ] Test registration endpoint
- [ ] Test polling endpoint
- [ ] Test heartbeat endpoint
- [ ] Test with invalid token (should return 401)
- [ ] Test with revoked token (should return 401)
- [ ] Check admin panel shows bridge online
- [ ] Create test sale and verify job appears in polling
- [ ] Test complete job endpoint
- [ ] Test fail job endpoint
- [ ] Verify job status updates in database

---

## Quick One-Liner Tests

**Test registration:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d '{"version":"2.0"}' https://app.xpos.az/api/bridge/register
```

**Test polling:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://app.xpos.az/api/bridge/poll
```

**Test heartbeat:**
```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d '{"version":"2.0"}' https://app.xpos.az/api/bridge/heartbeat
```
