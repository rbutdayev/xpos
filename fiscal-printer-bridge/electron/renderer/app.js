// State
let config = null;
let autoScroll = true;
let bridgeInfo = {
    accountId: null,
    bridgeName: null,
    lastSeen: null
};

// DOM Elements
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const apiUrlEl = document.getElementById('apiUrl');
const accountIdEl = document.getElementById('accountId');
const bridgeNameEl = document.getElementById('bridgeName');
const lastSeenEl = document.getElementById('lastSeen');
const logsContainer = document.getElementById('logsContainer');
const connectionStatus = document.getElementById('connectionStatus');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const settingsForm = document.getElementById('settingsForm');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const scrollToggleBtn = document.getElementById('scrollToggleBtn');
const toggleTokenBtn = document.getElementById('toggleTokenBtn');

// Initialize
async function init() {
    // Load config
    config = await window.electronAPI.getConfig();
    updateInfoCards();

    // Load auto-launch setting
    const autoLaunchEnabled = await window.electronAPI.getAutoLaunch();
    document.getElementById('autoLaunchInput').checked = autoLaunchEnabled;

    // Set up event listeners
    setupEventListeners();

    // Listen to bridge output
    window.electronAPI.onBridgeOutput((data) => {
        handleBridgeOutput(data);
    });

    window.electronAPI.onBridgeStopped((code) => {
        updateStatus('disconnected', 'Əlaqə kəsildi');
        addLog('system', `Bridge dayandı (exit code: ${code})`);
    });

    window.electronAPI.onBridgeLog((log) => {
        addLog(log.level, log.message);
    });

    window.electronAPI.onShowSettings(() => {
        showSettings();
    });
}

// Update info cards
function updateInfoCards() {
    apiUrlEl.textContent = config.apiUrl || '-';
    accountIdEl.textContent = bridgeInfo.accountId || '-';
    bridgeNameEl.textContent = bridgeInfo.bridgeName || '-';
    lastSeenEl.textContent = bridgeInfo.lastSeen || '-';
}

// Handle bridge output
function handleBridgeOutput(data) {
    const lines = data.split('\n').filter(line => line.trim());

    lines.forEach(line => {
        // Parse log level
        let level = 'info';
        if (line.includes('[ERROR]')) {
            level = 'error';
        } else if (line.includes('[SUCCESS]')) {
            level = 'success';
        } else if (line.includes('[DEBUG]')) {
            level = 'debug';
        } else if (line.includes('[INFO]')) {
            level = 'info';
        }

        // Extract account info
        if (line.includes('Account ID:')) {
            const match = line.match(/Account ID:\s*(\d+)/);
            if (match) {
                bridgeInfo.accountId = match[1];
                updateInfoCards();
            }
        }

        if (line.includes('Bridge Adı:')) {
            const match = line.match(/Bridge Adı:\s*(.+)/);
            if (match) {
                bridgeInfo.bridgeName = match[1].trim();
                updateInfoCards();
            }
        }

        // Update status based on log content
        if (line.includes('✓ Bridge qeydiyyatdan keçdi')) {
            updateStatus('connected', 'Qeydiyyatdan keçdi');
        } else if (line.includes('✓ Bridge işə başladı')) {
            updateStatus('connected', 'Bağlıdır');
            bridgeInfo.lastSeen = new Date().toLocaleString('az-AZ');
            updateInfoCards();
        } else if (line.includes('Bridge qeydiyyatdan keçir')) {
            updateStatus('starting', 'Qeydiyyatdan keçir...');
        } else if (line.includes('[ERROR]') && line.includes('Token')) {
            updateStatus('disconnected', 'Token xətası');
        }

        // Add to logs
        addLog(level, line);
    });
}

// Update status indicator
function updateStatus(status, text) {
    statusDot.className = `status-dot ${status}`;
    statusText.textContent = text;
    connectionStatus.textContent = text;
}

// Add log line
function addLog(level, message) {
    const logLine = document.createElement('div');
    logLine.className = `log-line ${level}`;
    logLine.textContent = message;
    logsContainer.appendChild(logLine);

    // Auto-scroll to bottom if enabled
    if (autoScroll) {
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    // Limit log lines to 1000
    while (logsContainer.children.length > 1000) {
        logsContainer.removeChild(logsContainer.firstChild);
    }
}

// Show settings modal
async function showSettings() {
    config = await window.electronAPI.getConfig();

    // Populate form
    document.getElementById('apiUrlInput').value = config.apiUrl || 'https://xpos.az';
    document.getElementById('tokenInput').value = config.token || '';
    document.getElementById('logLevelInput').value = config.logLevel || 'info';

    const autoLaunchEnabled = await window.electronAPI.getAutoLaunch();
    document.getElementById('autoLaunchInput').checked = autoLaunchEnabled;

    // Show modal
    settingsModal.classList.add('active');
}

// Hide settings modal
function hideSettings() {
    settingsModal.classList.remove('active');
}

// Save settings
async function saveSettings(e) {
    e.preventDefault();

    const newConfig = {
        ...config,
        apiUrl: document.getElementById('apiUrlInput').value,
        token: document.getElementById('tokenInput').value.trim(),
        logLevel: document.getElementById('logLevelInput').value
    };

    // Validate token
    if (!newConfig.token) {
        alert('Token daxil edilməlidir!');
        return;
    }

    // Save config
    const result = await window.electronAPI.saveConfig(newConfig);

    if (result.success) {
        // Update auto-launch
        const autoLaunch = document.getElementById('autoLaunchInput').checked;
        await window.electronAPI.setAutoLaunch(autoLaunch);

        // Restart bridge
        await window.electronAPI.restartBridge();

        // Update local config
        config = newConfig;
        updateInfoCards();

        // Close modal
        hideSettings();

        // Show success message
        addLog('success', 'Parametrlər yadda saxlanıldı. Bridge yenidən başladılır...');
    } else {
        alert('Parametrlər yadda saxlanmadı: ' + result.error);
    }
}

// Clear logs
function clearLogs() {
    logsContainer.innerHTML = '';
    addLog('system', 'Loglar təmizləndi');
}

// Toggle auto-scroll
function toggleAutoScroll() {
    autoScroll = !autoScroll;
    scrollToggleBtn.textContent = `Auto-scroll: ${autoScroll ? 'ON' : 'OFF'}`;
}

// Toggle token visibility
function toggleTokenVisibility() {
    const tokenInput = document.getElementById('tokenInput');
    if (tokenInput.type === 'password') {
        tokenInput.type = 'text';
        toggleTokenBtn.textContent = 'Gizlət';
    } else {
        tokenInput.type = 'password';
        toggleTokenBtn.textContent = 'Göstər';
    }
}

// Set up event listeners
function setupEventListeners() {
    settingsBtn.addEventListener('click', showSettings);
    closeModalBtn.addEventListener('click', hideSettings);
    cancelBtn.addEventListener('click', hideSettings);
    settingsForm.addEventListener('submit', saveSettings);
    clearLogsBtn.addEventListener('click', clearLogs);
    scrollToggleBtn.addEventListener('click', toggleAutoScroll);
    toggleTokenBtn.addEventListener('click', toggleTokenVisibility);

    // Close modal on background click
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            hideSettings();
        }
    });
}

// Update last seen every minute
setInterval(() => {
    if (bridgeInfo.lastSeen) {
        lastSeenEl.textContent = bridgeInfo.lastSeen;
    }
}, 60000);

// Initialize app
init();
