"use strict";
/**
 * Sync Service Test/Demo
 * This demonstrates the sync service functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSyncService = testSyncService;
const api_client_1 = require("./api-client");
const sync_service_1 = require("./sync-service");
const sync_database_1 = require("../database/sync-database");
const logger_1 = require("./logger");
/**
 * Demo: Initialize and test sync service
 */
async function testSyncService() {
    console.log('=== Sync Service Test ===\n');
    // Configuration
    const config = {
        apiUrl: process.env.API_URL || 'https://api.yourxpos.com',
        token: process.env.KIOSK_TOKEN || 'ksk_test_token',
    };
    console.log('Configuration:', config);
    console.log('');
    try {
        // 1. Create API client
        console.log('1. Creating API client...');
        const apiClient = (0, api_client_1.createApiClient)({
            baseURL: config.apiUrl,
            token: config.token,
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
        });
        console.log('   ✓ API client created\n');
        // 2. Create database
        console.log('2. Creating database...');
        const database = (0, sync_database_1.createSyncDatabase)();
        console.log('   ✓ Database created\n');
        // 3. Create logger
        console.log('3. Creating logger...');
        const logger = (0, logger_1.createLogger)('sync-service-test.log', 'debug');
        console.log('   ✓ Logger created');
        console.log('   Log file:', logger.getLogFilePath());
        console.log('');
        // 4. Create sync service
        console.log('4. Creating sync service...');
        const syncService = (0, sync_service_1.createSyncService)({
            apiClient,
            database,
            logger,
            syncIntervalSeconds: 300,
            heartbeatIntervalSeconds: 30,
            maxRetryAttempts: 3,
        });
        console.log('   ✓ Sync service created\n');
        // 5. Setup event listeners
        console.log('5. Setting up event listeners...');
        syncService.on('connection:online', (event) => {
            console.log('   📡 CONNECTION ONLINE:', event.timestamp);
        });
        syncService.on('connection:offline', (event) => {
            console.log('   📡 CONNECTION OFFLINE:', event.timestamp);
        });
        syncService.on('sync:started', (event) => {
            console.log('   🔄 SYNC STARTED:', event.timestamp);
        });
        syncService.on('sync:progress', (progress) => {
            console.log(`   📊 SYNC PROGRESS: ${progress.type} - ${progress.current}/${progress.total} (${progress.percentage}%)`);
        });
        syncService.on('sync:completed', (event) => {
            console.log('   ✅ SYNC COMPLETED:', event.timestamp);
            if (event.data.errors && event.data.errors.length > 0) {
                console.log('   ⚠️  Errors:', event.data.errors);
            }
        });
        syncService.on('sync:failed', (event) => {
            console.error('   ❌ SYNC FAILED:', event.data.error);
            if (event.data.errors && event.data.errors.length > 0) {
                console.error('   Errors:', event.data.errors);
            }
        });
        console.log('   ✓ Event listeners setup\n');
        // 6. Start sync service
        console.log('6. Starting sync service...');
        syncService.start();
        console.log('   ✓ Sync service started\n');
        // 7. Get initial status
        console.log('7. Checking status...');
        const status = syncService.getSyncStatus();
        console.log('   Status:', {
            isOnline: status.isOnline,
            isSyncing: status.isSyncing,
            lastSyncTime: status.lastSyncTime,
            errors: status.errors.length,
        });
        console.log('');
        // 8. Trigger manual sync (will fail without valid token, but demonstrates flow)
        console.log('8. Triggering manual sync (this will fail without valid token)...');
        try {
            await syncService.triggerFullSync();
            console.log('   ✓ Manual sync completed\n');
        }
        catch (error) {
            console.log('   ⚠️  Manual sync failed (expected):', error.message);
            console.log('   (This is normal without a valid API URL and token)\n');
        }
        // 9. Check database statistics
        console.log('9. Database statistics...');
        const stats = database.getStatistics();
        console.log('   Stats:', stats);
        console.log('');
        // 10. Demo: Add mock data
        console.log('10. Adding mock data to database...');
        // Add mock products
        database.upsertProducts([
            {
                id: 1,
                account_id: 1,
                name: 'Test Product 1',
                sku: 'TEST-001',
                barcode: '1234567890',
                sale_price: 29.99,
                purchase_price: 15.00,
                stock_quantity: 100,
                variant_id: null,
                variant_name: null,
                category_name: 'Test Category',
                type: 'product',
                is_active: true,
                updated_at: new Date().toISOString(),
            },
            {
                id: 2,
                account_id: 1,
                name: 'Test Product 2',
                sku: 'TEST-002',
                barcode: '0987654321',
                sale_price: 49.99,
                purchase_price: 25.00,
                stock_quantity: 50,
                variant_id: null,
                variant_name: null,
                category_name: 'Test Category',
                type: 'product',
                is_active: true,
                updated_at: new Date().toISOString(),
            },
        ]);
        // Add mock customers
        database.upsertCustomers([
            {
                id: 1,
                account_id: 1,
                name: 'John Doe',
                phone: '+1234567890',
                email: 'john@example.com',
                loyalty_card_number: 'LOYAL001',
                current_points: 100,
                customer_type: 'regular',
                updated_at: new Date().toISOString(),
            },
        ]);
        // Add mock queued sale
        database.addSaleToQueue({
            local_id: 1,
            account_id: 1,
            branch_id: 1,
            customer_id: 1,
            items: [
                {
                    product_id: 1,
                    variant_id: null,
                    product_name: 'Test Product 1',
                    quantity: 2,
                    unit_price: 29.99,
                    discount_amount: 0,
                },
            ],
            payments: [
                {
                    method: 'cash',
                    amount: 59.98,
                },
            ],
            subtotal: 59.98,
            tax_amount: 0,
            discount_amount: 0,
            total: 59.98,
            payment_status: 'paid',
            created_at: new Date().toISOString(),
            sync_status: 'queued',
            retry_count: 0,
        });
        console.log('   ✓ Mock data added\n');
        // 11. Check updated statistics
        console.log('11. Updated database statistics...');
        const updatedStats = database.getStatistics();
        console.log('   Stats:', updatedStats);
        console.log('');
        // 12. Search demo
        console.log('12. Search demo...');
        const productResults = database.searchProducts('test');
        console.log('   Product search results:', productResults.length, 'products');
        const customerResults = database.searchCustomers('john');
        console.log('   Customer search results:', customerResults.length, 'customers');
        console.log('');
        // 13. Wait a bit for heartbeat
        console.log('13. Waiting for heartbeat check (30 seconds)...');
        console.log('   (You can Ctrl+C to exit)\n');
        // Keep process running for demo
        await new Promise((resolve) => setTimeout(resolve, 35000));
        // 14. Stop sync service
        console.log('\n14. Stopping sync service...');
        syncService.stop();
        console.log('   ✓ Sync service stopped\n');
        console.log('=== Test Completed ===\n');
    }
    catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}
// Run test if executed directly
if (require.main === module) {
    testSyncService()
        .then(() => {
        console.log('Exiting...');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=sync-service.test.js.map