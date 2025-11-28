
  Complete Implementation Plan

  Phase 1: Agent Side - Automatic Status Checking

  File: fiscal-printer-bridge/index.js

  1. Add separate background loop (runs independently from job polling)
  2. Every 60 seconds (1 minute):
    - Check actual printer shift status
    - Push to server via POST /api/bridge/push-status
    - Include: { shift_open: boolean, shift_opened_at: timestamp, provider: string }
  3. Handle errors gracefully (don't crash if server unreachable)

  Phase 2: Server Side - Real-time Status API

  New Endpoint 1: POST /api/bridge/push-status (Bridge authentication)
  - Controller: FiscalPrinterBridgeController::pushStatus()
  - Store in Redis: shift_status:{account_id} with TTL of 2 minutes
  - Data: { shift_open, shift_opened_at, last_updated, provider }

  New Endpoint 2: GET /api/shift-status (Sanctum auth)
  - Controller: ShiftStatusController::getStatus()
  - Read from Redis for user's account_id
  - Return: { online: true/false, shift_open: true/false/null, shift_opened_at, last_updated }
  - If Redis key expired/missing: { online: false, shift_open: null }

  Files to modify:
  - routes/api.php - Add 2 routes
  - app/Http/Controllers/Api/FiscalPrinterBridgeController.php - Add pushStatus() method
  - app/Http/Controllers/Api/ShiftStatusController.php - NEW controller
  - Ensure Redis configured in .env

  Phase 3: Frontend - Modal Warning System

  Before Creating Sale (in POS pages):

  1. Check shift status via GET /api/shift-status
  2. If agent offline (online: false):
    - Show modal: "⚠️ Fiskal printer agent offline. Davam etmək istəyirsiniz?"
    - Buttons: "Davam Et" | "Ləğv Et"
  3. If shift closed (shift_open: false):
    - Show modal: "⚠️ Növbə bağlıdır! Satış etmək üçün növbəni açmalısınız"
    - Buttons: "Növbəni Aç" | "Davam Et" | "Ləğv Et"
    - "Növbəni Aç": Send open command → Show spinner → Wait for confirmation → Continue sale
    - "Davam Et": Override and create sale anyway
    - "Ləğv Et": Cancel operation

  New Component: ShiftStatusWarningModal.tsx
  - Modal (not dismissible by clicking outside)
  - Different layouts for offline vs closed scenarios
  - Action buttons styled prominently

  Files to modify:
  - resources/js/Pages/POS/Index.tsx - Add check in sale creation
  - resources/js/Pages/POS/Create.tsx - Same check
  - resources/js/Components/Modals/ShiftStatusWarningModal.tsx - NEW
  - Any other pages with fiscal operations

  Phase 4: Status Indicator (Bonus)

  Add small status badge in POS layout header:
  - 🟢 Green: "Növbə açıq" - All good
  - 🔴 Red: "Növbə bağlı" - Needs attention
  - ⚪ Gray: "Agent offline" - Warning

  Updates automatically via polling or websockets

  Phase 5: Configuration

  Environment:
  - Ensure Redis is running and configured
  - Check Redis connection in Laravel

  Agent Configuration:
  - Add status check interval setting (default: 60 seconds)
  - Can be adjusted if system load is too high

  ---
  Summary of Changes:

  Agent (fiscal-printer-bridge):
  - Add background status checking loop
  - Push status to server every minute

  Backend (Laravel):
  - 2 new API endpoints (push-status, shift-status)
  - Redis integration for caching real-time status
  - New ShiftStatusController

  Frontend (React/Inertia):
  - Modal warning before sales
  - Shift status checking logic
  - Optional status indicator widget

  Testing Scenarios:
  1. ✅ Agent online + shift open → Normal sale
  2. ⚠️ Agent online + shift closed → Show modal with open option
  3. ⚠️ Agent offline → Show warning, allow override
  4. ✅ Open shift from modal → Wait confirmation → Continue

  Should I proceed with this implementation?
