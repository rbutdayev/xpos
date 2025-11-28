#!/usr/bin/env node

/**
 * Fiscal Printer Connection Test
 *
 * Tests connectivity to the fiscal printer and validates the configuration
 */

const axios = require('axios');
const fs = require('fs');

// Load config
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const printerUrl = `http://${config.printerIp}:${config.printerPort}`;

console.log('🔧 Fiscal Printer Connection Test\n');
console.log('Configuration:');
console.log(`  Printer URL: ${printerUrl}`);
console.log(`  API URL: ${config.apiUrl}`);
console.log('');

// Test 1: Check if printer is reachable
async function testConnection() {
    console.log('Test 1: Testing printer connectivity...');
    try {
        const response = await axios({
            method: 'GET',
            url: printerUrl,
            timeout: 5000,
            validateStatus: () => true
        });

        console.log(`✅ Printer responded with status: ${response.status}`);
        return true;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Connection refused - printer app is not running or wrong port');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('❌ Connection timeout - printer not reachable');
        } else {
            console.log(`❌ Connection error: ${error.message}`);
        }
        return false;
    }
}

// Test 2: Send a test request (status check or similar)
async function testPrinterAPI() {
    console.log('\nTest 2: Testing printer API...');

    // Try to get status or info (common endpoint)
    try {
        const response = await axios({
            method: 'POST',
            url: printerUrl,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json'
            },
            data: {
                operation: 'status', // or 'getStatus', 'info', etc.
                username: 'test',
                password: 'test'
            },
            timeout: 5000,
            validateStatus: () => true
        });

        console.log(`✅ API responded with status: ${response.status}`);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log(`❌ API error: ${error.message}`);
        return false;
    }
}

// Test 3: Check backend connection
async function testBackend() {
    console.log('\nTest 3: Testing backend API...');
    try {
        const response = await axios({
            method: 'POST',
            url: `${config.apiUrl}/api/bridge/register`,
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Content-Type': 'application/json'
            },
            data: {
                version: '2.0.0-test',
                info: {
                    test: true
                }
            },
            timeout: 5000
        });

        console.log('✅ Backend API working');
        console.log('Account ID:', response.data.account_id);
        console.log('Bridge Name:', response.data.bridge_name);
        return true;
    } catch (error) {
        console.log(`❌ Backend error: ${error.message}`);
        if (error.response) {
            console.log('Response:', error.response.data);
        }
        return false;
    }
}

// Run all tests
async function runTests() {
    const test1 = await testConnection();

    if (test1) {
        await testPrinterAPI();
    } else {
        console.log('\n⚠️ Skipping API test - connection failed');
        console.log('\nTroubleshooting:');
        console.log('  1. Make sure the fiscal printer app is running on the Android device');
        console.log('  2. Check if the printer app is listening on port', config.printerPort);
        console.log('  3. Verify the IP address is correct:', config.printerIp);
        console.log('  4. Check if firewall is blocking connections');
        console.log('  5. Make sure both devices are on the same network');
    }

    await testBackend();

    console.log('\n📋 Summary:');
    console.log('  Printer URL:', printerUrl);
    console.log('  Backend URL:', config.apiUrl);
    console.log('\nNext steps:');
    console.log('  1. Fix printer connectivity issues (if any)');
    console.log('  2. Run the bridge: npm start');
    console.log('  3. Create a test sale in the POS');
    console.log('  4. Watch the bridge logs for processing');
}

runTests().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
