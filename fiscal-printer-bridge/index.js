#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
// Check if running from Electron app (config path passed via env var)
// Otherwise use config.json in current directory
const configPath = process.env.BRIDGE_CONFIG_PATH || path.join(__dirname, 'config.json');

let config = {
    apiUrl: 'https://xpos.az',
    token: '',
    printerIp: '192.168.0.45',
    printerPort: 5544,
    pollInterval: 2000,
    heartbeatInterval: 30000,
    logLevel: 'info'
};

// Load config
if (!fs.existsSync(configPath)) {
    console.error('❌ config.json tapılmadı!');
    console.error('📋 Konfiqurasiya faylı: ' + configPath);
    console.error('📋 config.json.example faylını kopyalayın və düzəldin.');
    process.exit(1);
}

try {
    const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...config, ...userConfig };
} catch (e) {
    console.error('❌ config.json oxunmur:', e.message);
    console.error('📋 Fayl yolu: ' + configPath);
    process.exit(1);
}

// Validate config
if (!config.token) {
    console.error('❌ Token konfiqurasiyada yoxdur!');
    console.error('📋 Admin paneldən token yaradın və config.json-a əlavə edin.');
    process.exit(1);
}

if (!config.apiUrl) {
    console.error('❌ API URL konfiqurasiyada yoxdur!');
    process.exit(1);
}

// Global state
let accountId = null;
let bridgeName = 'Unknown';
let isRegistered = false;
let pollTimer = null;
let heartbeatTimer = null;
let statusCheckTimer = null;

// Logger
const log = {
    info: (...args) => {
        if (config.logLevel === 'info' || config.logLevel === 'debug') {
            console.log(`[${new Date().toISOString()}] [INFO]`, ...args);
        }
    },
    debug: (...args) => {
        if (config.logLevel === 'debug') {
            console.log(`[${new Date().toISOString()}] [DEBUG]`, ...args);
        }
    },
    error: (...args) => {
        console.error(`[${new Date().toISOString()}] [ERROR]`, ...args);
    },
    success: (...args) => {
        console.log(`[${new Date().toISOString()}] [SUCCESS]`, ...args);
    }
};

// Get system info
function getSystemInfo() {
    return {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        bridgeVersion: '2.0.0'
    };
}

// API Client
const api = axios.create({
    baseURL: config.apiUrl,
    headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    timeout: 30000
});

// Register bridge with server
async function registerBridge() {
    try {
        log.info('Bridge qeydiyyatdan keçir...');

        const response = await api.post('/api/bridge/register', {
            version: getSystemInfo().bridgeVersion,
            info: getSystemInfo()
        });

        if (response.data.success) {
            accountId = response.data.account_id;
            bridgeName = response.data.bridge_name;
            isRegistered = true;

            log.success('✓ Bridge qeydiyyatdan keçdi');
            log.info(`  Account ID: ${accountId}`);
            log.info(`  Bridge Adı: ${bridgeName}`);
            log.info(`  Poll Interval: ${response.data.poll_interval}ms`);

            // Update poll interval if server provides one
            if (response.data.poll_interval) {
                config.pollInterval = response.data.poll_interval;
            }

            return true;
        } else {
            log.error('Qeydiyyat uğursuz:', response.data.error);
            return false;
        }
    } catch (error) {
        if (error.response?.status === 401) {
            log.error('❌ Token yanlışdır və ya ləğv edilib!');
            log.error('📋 Admin paneldən yeni token yaradın.');
            process.exit(1);
        }

        log.error('Qeydiyyat xətası:', error.message);
        return false;
    }
}

// Send heartbeat
async function sendHeartbeat() {
    if (!isRegistered) return;

    try {
        await api.post('/api/bridge/heartbeat', {
            version: getSystemInfo().bridgeVersion,
            info: getSystemInfo()
        });

        log.debug('Heartbeat göndərildi');
    } catch (error) {
        log.error('Heartbeat xətası:', error.message);
    }
}

// Check shift status and push to server
async function checkAndPushShiftStatus() {
    if (!isRegistered) return;

    try {
        log.debug('Növbə statusu yoxlanılır...');

        // Get the shift status request from server
        const requestResponse = await api.get('/api/bridge/get-shift-status-request');

        if (!requestResponse.data.success) {
            log.debug('Növbə status yoxlaması konfiqurasiya edilməyib');
            return;
        }

        const requestData = requestResponse.data.request_data;

        // Execute the request on the printer
        const result = await printToFiscalPrinter(requestData);

        if (result.success) {
            // Parse shift status based on provider
            let shiftStatus = {
                shift_open: false,
                shift_opened_at: null,
                provider: requestData.provider
            };

            if (requestData.provider === 'omnitech') {
                // Omnitech check_type: 14 returns shift status
                const code = result.data.code ?? 999;
                if (code === 0 || code === '0') {
                    // Parse shift status from Omnitech response
                    shiftStatus.shift_open = result.data.data?.shiftStatus ?? false;
                    shiftStatus.shift_opened_at = result.data.data?.shift_open_time ?? null;
                }
            } else if (requestData.provider === 'caspos') {
                // Caspos getShiftStatus operation
                const code = result.data.code ?? 999;
                if (code === 0 || code === '0') {
                    shiftStatus.shift_open = result.data.data?.shift_open ?? result.data.data?.shiftStatus ?? false;
                    shiftStatus.shift_opened_at = result.data.data?.shift_open_time ?? null;
                }
            }

            // Push status to server
            await api.post('/api/bridge/push-status', shiftStatus);

            log.debug('Növbə statusu yeniləndi:', shiftStatus.shift_open ? 'Açıq' : 'Bağlı');
        } else {
            log.debug('Növbə statusu yoxlanılarkən xəta:', result.error);
        }
    } catch (error) {
        // Don't log errors too verbosely to avoid spam
        if (error.response?.status !== 404) {
            log.debug('Növbə status yoxlaması xətası:', error.message);
        }
    }
}

// Track login status per printer
const printerLoginStatus = {};

// Login to Caspos printer
async function loginToCasposPrinter(url, username, password) {
    try {
        log.info('🔐 Caspos printer-ə login edilir...', { url, username });

        const response = await axios({
            method: 'POST',
            url: url,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json'
            },
            data: {
                operation: 'toLogin',
                username: username,
                password: password
            },
            timeout: 10000,
            validateStatus: () => true
        });

        log.debug('Login cavabı:', {
            status: response.status,
            data: response.data
        });

        if (response.status === 200 && response.data && response.data.code === '0') {
            log.info('✅ Login uğurlu!', { access_token: response.data.data?.access_token?.substring(0, 10) + '...' });
            printerLoginStatus[url] = true;
            return { success: true, data: response.data };
        } else {
            log.error('❌ Login uğursuz:', response.data);
            return { success: false, error: response.data?.message || 'Login failed' };
        }
    } catch (error) {
        log.error('Login xətası:', error.message);
        return { success: false, error: error.message };
    }
}

// Login to Omnitech printer
async function loginToOmnitechPrinter(url, username, password) {
    try {
        log.info('🔐 Omnitech printer-ə login edilir...', { url, username });

        const response = await axios({
            method: 'POST',
            url: url,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: {
                requestData: {
                    checkData: {
                        check_type: 40 // Login operation
                    },
                    name: username,
                    password: password
                }
            },
            timeout: 10000,
            validateStatus: () => true
        });

        log.debug('Login cavabı:', {
            status: response.status,
            data: response.data
        });

        // Omnitech returns: { code: 1, access_token: "...", message: "login success" }
        if (response.status === 200 && response.data && response.data.access_token) {
            const accessToken = response.data.access_token;
            log.info('✅ Login uğurlu!', { access_token: accessToken.substring(0, 10) + '...' });
            printerLoginStatus[url] = {
                loggedIn: true,
                accessToken: accessToken,
                timestamp: Date.now()
            };
            return { success: true, accessToken: accessToken, data: response.data };
        } else {
            log.error('❌ Login uğursuz:', response.data);
            return { success: false, error: response.data?.message || 'Login failed' };
        }
    } catch (error) {
        log.error('Login xətası:', error.message);
        return { success: false, error: error.message };
    }
}

// Print to fiscal printer
async function printToFiscalPrinter(requestData) {
    try {
        // Check if we need to login first (for Caspos)
        if (requestData.provider === 'caspos' && !printerLoginStatus[requestData.url]) {
            log.info('⚠️  Printer-ə login olunmayıb. Əvvəlcə login edilir...');

            // Extract credentials from request body
            const { username, password } = requestData.body;

            if (!username || !password) {
                log.error('❌ Username və ya password tapılmadı!');
                return {
                    success: false,
                    error: 'Username və password məcburidir'
                };
            }

            // Login first
            const loginResult = await loginToCasposPrinter(requestData.url, username, password);

            if (!loginResult.success) {
                return {
                    success: false,
                    error: `Login uğursuz: ${loginResult.error}`
                };
            }
        }

        // Check if we need to login first (for Omnitech)
        if (requestData.provider === 'omnitech' && !printerLoginStatus[requestData.url]) {
            log.info('⚠️  Omnitech printer-ə login olunmayıb. Əvvəlcə login edilir...');

            // Extract credentials from request body
            const reqData = requestData.body?.requestData;
            if (!reqData?.tokenData?.parameters?.data) {
                log.error('❌ Omnitech sorğu strukturu düzgün deyil!');
                return {
                    success: false,
                    error: 'Sorğu strukturu düzgün deyil'
                };
            }

            // Get credentials (they're in the data object for Omnitech)
            const credentials = {
                username: requestData.body.username || requestData.body.requestData?.name,
                password: requestData.body.password || requestData.body.requestData?.password
            };

            if (!credentials.username || !credentials.password) {
                log.error('❌ Username və ya password tapılmadı!');
                return {
                    success: false,
                    error: 'Username və password məcburidir'
                };
            }

            // Login first
            const loginResult = await loginToOmnitechPrinter(requestData.url, credentials.username, credentials.password);

            if (!loginResult.success) {
                return {
                    success: false,
                    error: `Login uğursuz: ${loginResult.error}`
                };
            }

            // Store access_token for subsequent requests
            requestData.accessToken = loginResult.accessToken;
        }

        // For Omnitech, inject access_token into request if available
        if (requestData.provider === 'omnitech' && requestData.accessToken) {
            if (requestData.body?.requestData) {
                requestData.body.requestData.access_token = requestData.accessToken;
            }
        } else if (requestData.provider === 'omnitech' && printerLoginStatus[requestData.url]?.accessToken) {
            // Use cached access_token
            if (requestData.body?.requestData) {
                requestData.body.requestData.access_token = printerLoginStatus[requestData.url].accessToken;
            }
        }

        log.debug('Printer-ə sorğu göndərilir:', {
            url: requestData.url,
            provider: requestData.provider
        });

        const response = await axios({
            method: 'POST',
            url: requestData.url,
            headers: requestData.headers,
            data: requestData.body,
            timeout: 30000,
            validateStatus: () => true // Don't throw on any status
        });

        log.debug('Printer cavabı:', {
            status: response.status,
            data: response.data
        });

        // Check for authentication errors (code 401, 403)
        if (response.data && (response.data.code === '401' || response.data.code === '403')) {
            log.warn('⚠️  Autentifikasiya xətası. Login yenidən edilir...');
            printerLoginStatus[requestData.url] = false; // Reset login status

            // Retry login and operation based on provider
            if (requestData.provider === 'caspos') {
                const { username, password } = requestData.body;
                const loginResult = await loginToCasposPrinter(requestData.url, username, password);

                if (loginResult.success) {
                    // Retry the operation
                    const retryResponse = await axios({
                        method: 'POST',
                        url: requestData.url,
                        headers: requestData.headers,
                        data: requestData.body,
                        timeout: 30000,
                        validateStatus: () => true
                    });

                    return {
                        success: retryResponse.status >= 200 && retryResponse.status < 300,
                        data: retryResponse.data,
                        status: retryResponse.status
                    };
                }
            } else if (requestData.provider === 'omnitech') {
                const credentials = {
                    username: requestData.body.username || requestData.body.requestData?.name,
                    password: requestData.body.password || requestData.body.requestData?.password
                };
                const loginResult = await loginToOmnitechPrinter(requestData.url, credentials.username, credentials.password);

                if (loginResult.success) {
                    // Inject new access_token and retry
                    if (requestData.body?.requestData) {
                        requestData.body.requestData.access_token = loginResult.accessToken;
                    }

                    // Retry the operation
                    const retryResponse = await axios({
                        method: 'POST',
                        url: requestData.url,
                        headers: requestData.headers,
                        data: requestData.body,
                        timeout: 30000,
                        validateStatus: () => true
                    });

                    return {
                        success: retryResponse.status >= 200 && retryResponse.status < 300,
                        data: retryResponse.data,
                        status: retryResponse.status
                    };
                }
            }
        }

        // IMPORTANT: Caspos sometimes returns HTTP 500 even when printing succeeds
        // Check if response contains fiscal data (code: '0') regardless of HTTP status
        const hasSuccessData = response.data && (response.data.code === 0 || response.data.code === '0');
        const isHttpSuccess = response.status >= 200 && response.status < 300;

        return {
            success: isHttpSuccess || hasSuccessData,
            data: response.data,
            status: response.status
        };
    } catch (error) {
        log.error('Printer xətası:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Process a single job
async function processJob(job) {
    const operationType = job.operation_type || 'sale';

    // Operations that don't return fiscal numbers (like shift operations)
    const nonFiscalOperations = [
        'shift_open', 'shift_close', 'shift_status', 'shift_x_report',
        'deposit', 'withdraw', 'open_cashbox',
        'print_last', 'rollback',
        'periodic_report', 'control_tape',
        'printer_connection', 'logout'
    ];

    const isNonFiscalOperation = nonFiscalOperations.includes(operationType);
    const isShiftOperation = ['shift_open', 'shift_close', 'shift_status', 'shift_x_report'].includes(operationType);

    if (isNonFiscalOperation) {
        log.info(`📝 Əməliyyat işlənir: #${job.id} (${operationType})`);
    } else {
        log.info(`📝 İş işlənir: #${job.id} (Satış #${job.sale_id})`);
    }

    try {
        // Print to fiscal printer
        const result = await printToFiscalPrinter(job.request_data);

        if (result.success) {
            // Handle non-fiscal operations - they don't have fiscal numbers
            if (isNonFiscalOperation) {
                // For non-fiscal operations, just send the response data
                const completionData = {
                    response: result.data,
                    response_data: result.data
                };

                // Report success to server
                await api.post(`/api/bridge/job/${job.id}/complete-shift`, completionData);

                log.success(`✓ Əməliyyat tamamlandı: #${job.id} (${operationType})`);

                // For shift operations, immediately push updated shift status
                if (isShiftOperation) {
                    await checkAndPushShiftStatus();
                }

                return true;
            }

            // Extract fiscal number and document ID based on provider (for sales/returns)
            let fiscalNumber = null;
            let fiscalDocumentId = null;

            if (job.provider === 'caspos') {
                const code = result.data.code ?? 999;
                if (code === 0 || code === '0') {
                    // Extract both fields from Caspos response
                    fiscalNumber = result.data.data?.number || result.data.data?.document_number;
                    fiscalDocumentId = result.data.data?.document_id;

                    if (!fiscalDocumentId) {
                        log.warn('⚠️  Caspos cavabında document_id tapılmadı!');
                    }
                } else {
                    // Extract the actual error message from Caspos response
                    const errorMsg = result.data.message || result.data.msg || result.data.error || `Xəta kodu: ${code}`;
                    throw new Error(errorMsg);
                }
            } else if (job.provider === 'omnitech') {
                // Omnitech response structure: { code: 0, message: "...", data: { fiscalId: "...", document_id: "..." } }
                const code = result.data.code ?? 999;
                if (code === 0 || code === '0') {
                    // Extract fiscal ID (long document ID)
                    fiscalDocumentId = result.data.data?.fiscalId || result.data.data?.document_id || result.data.data?.long_id;

                    // Extract document number (short number displayed on receipt)
                    fiscalNumber = result.data.data?.document_number || result.data.data?.documentNumber || result.data.data?.number;

                    if (!fiscalDocumentId) {
                        log.warn('⚠️  Omnitech cavabında fiscalId tapılmadı!');
                    }

                    if (!fiscalNumber) {
                        log.warn('⚠️  Omnitech cavabında document_number tapılmadı!');
                    }
                } else {
                    // Extract the actual error message from Omnitech response
                    const errorMsg = result.data.message || result.data.msg || result.data.error || result.data.info || `Xəta kodu: ${code}`;
                    throw new Error(errorMsg);
                }
            } else {
                fiscalNumber = result.data.fiscal_number || result.data.fiscalNumber;
            }

            if (!fiscalNumber) {
                throw new Error('Fiskal nömrə tapılmadı');
            }

            // Convert fiscal_number to string (API expects string, not number)
            const fiscalNumberStr = String(fiscalNumber);

            // Prepare completion payload
            const completionData = {
                fiscal_number: fiscalNumberStr,
                response: result.data,
                response_data: result.data // Store full response for debugging
            };

            // Add fiscal_document_id if available (required for Caspos returns)
            if (fiscalDocumentId) {
                completionData.fiscal_document_id = fiscalDocumentId;
            }

            // Report success to server
            await api.post(`/api/bridge/job/${job.id}/complete`, completionData);

            log.success(`✓ İş tamamlandı: #${job.id} - Fiskal №${fiscalNumber}`);
            if (fiscalDocumentId) {
                log.info(`  Document ID: ${fiscalDocumentId}`);
            }
            return true;

        } else {
            throw new Error(result.error || 'Printer xətası');
        }

    } catch (error) {
        log.error(`❌ İş uğursuz: #${job.id} -`, error.message);

        // Report failure to server
        try {
            const response = await api.post(`/api/bridge/job/${job.id}/fail`, {
                error: error.message,
                response_data: error.response?.data || null // Store error response for debugging
            });

            if (response.data.is_retriable === false) {
                log.warn(`⚠️  İş təkrar edilməyəcək (non-retriable error): #${job.id}`);
            } else if (response.data.can_retry) {
                log.info(`🔄 İş təkrar ediləcək: #${job.id}`);
            } else {
                log.warn(`⛔ Maksimum təkrar sayına çatıldı: #${job.id}`);
            }
        } catch (reportError) {
            log.error('Xəta bildirişi göndərilmədi:', reportError.message);
        }

        return false;
    }
}

// Poll for jobs
async function pollForJobs() {
    if (!isRegistered) {
        log.debug('Bridge qeydiyyatdan keçməyib, polling keçildi');
        return;
    }

    try {
        log.debug('İşlər yoxlanılır...');

        const response = await api.get('/api/bridge/poll');

        if (response.data.success && response.data.jobs.length > 0) {
            log.info(`📦 ${response.data.jobs.length} iş tapıldı`);

            // Process jobs sequentially
            for (const job of response.data.jobs) {
                await processJob(job);
            }
        } else {
            log.debug('Yeni iş yoxdur');
        }

    } catch (error) {
        if (error.response?.status === 401) {
            log.error('❌ Token ləğv edilib!');
            stopBridge();
            process.exit(1);
        }

        log.error('Polling xətası:', error.message);
    }
}

// Start polling
function startPolling() {
    log.info(`🔄 Polling başladı (hər ${config.pollInterval}ms)`);

    // Initial poll
    pollForJobs();

    // Set up interval
    pollTimer = setInterval(pollForJobs, config.pollInterval);
}

// Start heartbeat
function startHeartbeat() {
    log.info(`💓 Heartbeat başladı (hər ${config.heartbeatInterval}ms)`);

    // Initial heartbeat
    sendHeartbeat();

    // Set up interval
    heartbeatTimer = setInterval(sendHeartbeat, config.heartbeatInterval);
}

// Start status checking (every 60 seconds)
function startStatusChecking() {
    const statusCheckInterval = 60000; // 60 seconds
    log.info(`📊 Status yoxlaması başladı (hər ${statusCheckInterval / 1000} saniyə)`);

    // Initial check
    checkAndPushShiftStatus();

    // Set up interval
    statusCheckTimer = setInterval(checkAndPushShiftStatus, statusCheckInterval);
}

// Stop bridge
function stopBridge() {
    log.info('🛑 Bridge dayanır...');

    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }

    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }

    if (statusCheckTimer) {
        clearInterval(statusCheckTimer);
        statusCheckTimer = null;
    }

    isRegistered = false;
}

// Main
async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                                                          ║');
    console.log('║       🖨️  XPOS Fiscal Printer Bridge Service v2.0       ║');
    console.log('║                  (Polling Mode)                          ║');
    console.log('║                                                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`API URL: ${config.apiUrl}`);
    console.log(`Printer: ${config.printerIp}:${config.printerPort}`);
    console.log(`Token: ${config.token.substring(0, 15)}...`);
    console.log('');

    // Register bridge
    const registered = await registerBridge();

    if (!registered) {
        log.error('Qeydiyyat uğursuz oldu. 5 saniyə sonra yenidən cəhd ediləcək...');
        setTimeout(main, 5000);
        return;
    }

    // Start polling, heartbeat, and status checking
    startPolling();
    startHeartbeat();
    startStatusChecking();

    log.info('');
    log.info('✓ Bridge işə başladı!');
    log.info('✓ İşlər gözlənilir...');
    log.info('');
    log.info('Dayandırmaq üçün Ctrl+C basın');
    console.log('');
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('');
    console.log('');
    log.info('⚠️  Dayanma siqnalı alındı...');
    stopBridge();
    log.success('✓ Bridge dayandı');
    console.log('');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('');
    log.info('⚠️  Dayanma siqnalı alındı...');
    stopBridge();
    log.success('✓ Bridge dayandı');
    process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    log.error('Kritik xəta:', error.message);
    log.error(error.stack);
    stopBridge();
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    log.error('İşlənməmiş promise rejection:', reason);
    stopBridge();
    process.exit(1);
});

// Start the bridge
main().catch((error) => {
    log.error('Bridge başladılmadı:', error.message);
    process.exit(1);
});
