<?php

/**
 * CASPOS API Extensions for FiscalPrinterService
 * These methods should be added to the FiscalPrinterService.php file
 *
 * This file contains all the missing CASPOS API implementations
 */

// ============================================================
// CASH DRAWER OPERATIONS (Priority 2)
// ============================================================

/**
 * Print Deposit receipt (add money to cash drawer)
 * Caspos API: "deposit" operation
 */
public function printDepositReceipt(int $accountId, array $data): array
{
    $config = $this->getConfig($accountId);

    if (!$config) {
        return ['success' => false, 'error' => 'Fiscal printer not configured'];
    }

    if (!$config->isConfigured()) {
        return ['success' => false, 'error' => 'Fiscal printer is not active or IP address not set'];
    }

    try {
        $requestData = $this->formatDepositRequest($config, $data);

        FiscalPrinterJob::create([
            'account_id' => $accountId,
            'sale_id' => null,
            'return_id' => null,
            'status' => FiscalPrinterJob::STATUS_PENDING,
            'operation_type' => FiscalPrinterJob::OPERATION_DEPOSIT,
            'request_data' => $requestData,
            'provider' => $config->provider,
        ]);

        return [
            'success' => true,
            'message' => 'Kassaya pul əlavə edilməsi növbəyə əlavə edildi',
        ];
    } catch (\Exception $e) {
        Log::error('Deposit receipt failed', [
            'account_id' => $accountId,
            'error' => $e->getMessage(),
        ]);

        return ['success' => false, 'error' => 'Failed to print deposit receipt: ' . $e->getMessage()];
    }
}

/**
 * Print Withdraw receipt (remove money from cash drawer)
 * Caspos API: "withDraw" operation
 */
public function printWithdrawReceipt(int $accountId, array $data): array
{
    $config = $this->getConfig($accountId);

    if (!$config) {
        return ['success' => false, 'error' => 'Fiscal printer not configured'];
    }

    if (!$config->isConfigured()) {
        return ['success' => false, 'error' => 'Fiscal printer is not active or IP address not set'];
    }

    try {
        $requestData = $this->formatWithdrawRequest($config, $data);

        FiscalPrinterJob::create([
            'account_id' => $accountId,
            'sale_id' => null,
            'return_id' => null,
            'status' => FiscalPrinterJob::STATUS_PENDING,
            'operation_type' => FiscalPrinterJob::OPERATION_WITHDRAW,
            'request_data' => $requestData,
            'provider' => $config->provider,
        ]);

        return [
            'success' => true,
            'message' => 'Kassadan pul götürülməsi növbəyə əlavə edildi',
        ];
    } catch (\Exception $e) {
        Log::error('Withdraw receipt failed', [
            'account_id' => $accountId,
            'error' => $e->getMessage(),
        ]);

        return ['success' => false, 'error' => 'Failed to print withdraw receipt: ' . $e->getMessage()];
    }
}

/**
 * Open cash box (no receipt printed)
 * Caspos API: "openCashbox" operation
 */
public function openCashBox(int $accountId): array
{
    $config = $this->getConfig($accountId);

    if (!$config) {
        return ['success' => false, 'error' => 'Fiscal printer not configured'];
    }

    if (!$config->isConfigured()) {
        return ['success' => false, 'error' => 'Fiscal printer is not active or IP address not set'];
    }

    try {
        $requestData = $this->formatOpenCashBoxRequest($config);

        FiscalPrinterJob::create([
            'account_id' => $accountId,
            'sale_id' => null,
            'return_id' => null,
            'status' => FiscalPrinterJob::STATUS_PENDING,
            'operation_type' => FiscalPrinterJob::OPERATION_OPEN_CASHBOX,
            'request_data' => $requestData,
            'provider' => $config->provider,
        ]);

        return [
            'success' => true,
            'message' => 'Kassa açma əməliyyatı növbəyə əlavə edildi',
        ];
    } catch (\Exception $e) {
        Log::error('Open cashbox failed', [
            'account_id' => $accountId,
            'error' => $e->getMessage(),
        ]);

        return ['success' => false, 'error' => 'Failed to open cashbox: ' . $e->getMessage()];
    }
}

// ============================================================
// UTILITY OPERATIONS (Priority 3)
// ============================================================

/**
 * Print Correction receipt (for offline transactions)
 * Caspos API: "correction" operation
 */
public function printCorrectionReceipt(int $accountId, array $data): array
{
    $config = $this->getConfig($accountId);

    if (!$config) {
        return ['success' => false, 'error' => 'Fiscal printer not configured'];
    }

    if (!$config->isConfigured()) {
        return ['success' => false, 'error' => 'Fiscal printer is not active or IP address not set'];
    }

    try {
        $requestData = $this->formatCorrectionRequest($config, $data);

        FiscalPrinterJob::create([
            'account_id' => $accountId,
            'sale_id' => null,
            'return_id' => null,
            'status' => FiscalPrinterJob::STATUS_PENDING,
            'operation_type' => FiscalPrinterJob::OPERATION_CORRECTION,
            'request_data' => $requestData,
            'provider' => $config->provider,
        ]);

        return [
            'success' => true,
            'message' => 'Düzəliş qəbzi növbəyə əlavə edildi',
        ];
    } catch (\Exception $e) {
        Log::error('Correction receipt failed', [
            'account_id' => $accountId,
            'error' => $e->getMessage(),
        ]);

        return ['success' => false, 'error' => 'Failed to print correction receipt: ' . $e->getMessage()];
    }
}

/**
 * Print RollBack receipt (cancel receipt from current shift)
 * Caspos API: "rollBack" operation
 */
public function printRollBackReceipt(int $accountId, array $data): array
{
    $config = $this->getConfig($accountId);

    if (!$config) {
        return ['success' => false, 'error' => 'Fiscal printer not configured'];
    }

    if (!$config->isConfigured()) {
        return ['success' => false, 'error' => 'Fiscal printer is not active or IP address not set'];
    }

    try {
        $requestData = $this->formatRollBackRequest($config, $data);

        FiscalPrinterJob::create([
            'account_id' => $accountId,
            'sale_id' => null,
            'return_id' => null,
            'status' => FiscalPrinterJob::STATUS_PENDING,
            'operation_type' => FiscalPrinterJob::OPERATION_ROLLBACK,
            'request_data' => $requestData,
            'provider' => $config->provider,
        ]);

        return [
            'success' => true,
            'message' => 'Ləğv qəbzi növbəyə əlavə edildi',
        ];
    } catch (\Exception $e) {
        Log::error('RollBack receipt failed', [
            'account_id' => $accountId,
            'error' => $e->getMessage(),
        ]);

        return ['success' => false, 'error' => 'Failed to print rollback receipt: ' . $e->getMessage()];
    }
}

/**
 * Print last receipt (reprint)
 * Caspos API: "printLastCheque" operation
 */
public function printLastReceipt(int $accountId): array
{
    $config = $this->getConfig($accountId);

    if (!$config) {
        return ['success' => false, 'error' => 'Fiscal printer not configured'];
    }

    if (!$config->isConfigured()) {
        return ['success' => false, 'error' => 'Fiscal printer is not active or IP address not set'];
    }

    try {
        $requestData = $this->formatPrintLastRequest($config);

        FiscalPrinterJob::create([
            'account_id' => $accountId,
            'sale_id' => null,
            'return_id' => null,
            'status' => FiscalPrinterJob::STATUS_PENDING,
            'operation_type' => FiscalPrinterJob::OPERATION_PRINT_LAST,
            'request_data' => $requestData,
            'provider' => $config->provider,
        ]);

        return [
            'success' => true,
            'message' => 'Son qəbzin təkrar çapı növbəyə əlavə edildi',
        ];
    } catch (\Exception $e) {
        Log::error('Print last receipt failed', [
            'account_id' => $accountId,
            'error' => $e->getMessage(),
        ]);

        return ['success' => false, 'error' => 'Failed to print last receipt: ' . $e->getMessage()];
    }
}

// ============================================================
// REPORT OPERATIONS (Priority 4)
// ============================================================

/**
 * Get periodic report (for date range)
 * Caspos API: "getPeriodicZReport" operation
 */
public function getPeriodicReport(int $accountId, string $startDate, string $endDate): array
{
    $config = $this->getConfig($accountId);

    if (!$config) {
        return ['success' => false, 'error' => 'Fiscal printer not configured'];
    }

    if (!$config->isConfigured()) {
        return ['success' => false, 'error' => 'Fiscal printer is not active or IP address not set'];
    }

    try {
        $requestData = $this->formatPeriodicReportRequest($config, $startDate, $endDate);

        FiscalPrinterJob::create([
            'account_id' => $accountId,
            'sale_id' => null,
            'return_id' => null,
            'status' => FiscalPrinterJob::STATUS_PENDING,
            'operation_type' => FiscalPrinterJob::OPERATION_PERIODIC_REPORT,
            'request_data' => $requestData,
            'provider' => $config->provider,
        ]);

        return [
            'success' => true,
            'message' => 'Dövri hesabat növbəyə əlavə edildi',
        ];
    } catch (\Exception $e) {
        Log::error('Periodic report failed', [
            'account_id' => $accountId,
            'error' => $e->getMessage(),
        ]);

        return ['success' => false, 'error' => 'Failed to get periodic report: ' . $e->getMessage()];
    }
}

/**
 * Get control tape (detailed shift transactions)
 * Caspos API: "getControlTape" operation
 */
public function getControlTape(int $accountId): array
{
    $config = $this->getConfig($accountId);

    if (!$config) {
        return ['success' => false, 'error' => 'Fiscal printer not configured'];
    }

    if (!$config->isConfigured()) {
        return ['success' => false, 'error' => 'Fiscal printer is not active or IP address not set'];
    }

    try {
        $requestData = $this->formatControlTapeRequest($config);

        FiscalPrinterJob::create([
            'account_id' => $accountId,
            'sale_id' => null,
            'return_id' => null,
            'status' => FiscalPrinterJob::STATUS_PENDING,
            'operation_type' => FiscalPrinterJob::OPERATION_CONTROL_TAPE,
            'request_data' => $requestData,
            'provider' => $config->provider,
        ]);

        return [
            'success' => true,
            'message' => 'Kontrol lenti növbəyə əlavə edildi',
        ];
    } catch (\Exception $e) {
        Log::error('Control tape failed', [
            'account_id' => $accountId,
            'error' => $e->getMessage(),
        ]);

        return ['success' => false, 'error' => 'Failed to get control tape: ' . $e->getMessage()];
    }
}
