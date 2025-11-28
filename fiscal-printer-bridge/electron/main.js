const { app, BrowserWindow, Tray, Menu, ipcMain, dialog } = require('electron');
const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const AutoLaunch = require('auto-launch');

const store = new Store();
let mainWindow = null;
let tray = null;
let trayMenu = null;
let bridgeProcess = null;
let isQuitting = false;

// Auto-launch configuration
const autoLauncher = new AutoLaunch({
    name: 'XPOS Printer Bridge',
    path: app.getPath('exe')
});

// Path to bridge script and config
const bridgeScriptPath = path.join(__dirname, '..', 'index.js');
const configPath = path.join(app.getPath('userData'), 'config.json');

// Initialize config
function initializeConfig() {
    // Create config in user data directory if it doesn't exist
    if (!fs.existsSync(configPath)) {
        const defaultConfig = {
            apiUrl: 'https://xpos.az',
            token: '',
            printerIp: '192.168.0.45',
            printerPort: 5544,
            pollInterval: 2000,
            heartbeatInterval: 30000,
            logLevel: 'info'
        };
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    }
}

// Get current config
function getConfig() {
    if (!fs.existsSync(configPath)) {
        initializeConfig();
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// Save config
function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// Create main window
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        icon: getIconPath(),
        title: 'XPOS Printer Bridge',
        show: false
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Handle window close - minimize to tray instead
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Get icon path based on platform
function getIconPath() {
    if (process.platform === 'win32') {
        return path.join(__dirname, 'assets', 'icon.ico');
    } else if (process.platform === 'darwin') {
        return path.join(__dirname, 'assets', 'icon.png');
    } else {
        return path.join(__dirname, 'assets', 'icon.png');
    }
}

// Create system tray
function createTray() {
    const iconPath = process.platform === 'darwin'
        ? path.join(__dirname, 'assets', 'tray-icon-Template.png')
        : path.join(__dirname, 'assets', 'tray-icon.png');

    tray = new Tray(iconPath);

    trayMenu = Menu.buildFromTemplate([
        {
            label: 'XPOS Printer Bridge',
            enabled: false,
            icon: path.join(__dirname, 'assets', 'icon-16.png')
        },
        { type: 'separator' },
        {
            label: 'Status: Bağlanır...',
            enabled: false,
            id: 'status'
        },
        { type: 'separator' },
        {
            label: 'Göstər',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                } else {
                    createWindow();
                }
            }
        },
        {
            label: 'Parametrlər',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                    mainWindow.webContents.send('show-settings');
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Çıxış',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(trayMenu);
    tray.setToolTip('XPOS Printer Bridge - Bağlanır...');

    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        } else {
            createWindow();
        }
    });
}

// Update tray status
function updateTrayStatus(status, message) {
    if (!tray || !trayMenu) return;

    const statusItem = trayMenu.getMenuItemById('status');

    if (statusItem) {
        statusItem.label = `Status: ${message}`;
    }

    tray.setToolTip(`XPOS Printer Bridge - ${message}`);
}

// Start bridge process
function startBridge() {
    if (bridgeProcess) {
        console.log('Bridge already running');
        return;
    }

    const config = getConfig();

    // Check if token is configured
    if (!config.token) {
        if (mainWindow) {
            mainWindow.webContents.send('bridge-log', {
                level: 'error',
                message: 'Token konfiqurasiya edilməyib! Parametrlərə gedin və token əlavə edin.'
            });
        }
        updateTrayStatus('error', 'Token yoxdur');
        return;
    }

    console.log('Starting bridge process...');
    updateTrayStatus('starting', 'Başlayır...');

    // Use fork() which uses Electron's Node.js for child processes
    // This works in packaged apps without needing system Node.js
    bridgeProcess = fork(bridgeScriptPath, [], {
        cwd: app.getPath('userData'),
        env: {
            ...process.env,
            BRIDGE_CONFIG_PATH: configPath
        },
        silent: true // Capture stdout/stderr
    });

    bridgeProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Bridge:', output);

        if (mainWindow) {
            mainWindow.webContents.send('bridge-output', output);
        }

        // Parse log level and update status
        if (output.includes('[SUCCESS]') || output.includes('✓ Bridge işə başladı')) {
            updateTrayStatus('connected', 'Bağlıdır');
        } else if (output.includes('[ERROR]')) {
            updateTrayStatus('error', 'Xəta');
        }
    });

    bridgeProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.error('Bridge Error:', output);

        if (mainWindow) {
            mainWindow.webContents.send('bridge-output', output);
        }

        updateTrayStatus('error', 'Xəta');
    });

    bridgeProcess.on('exit', (code) => {
        console.log(`Bridge process exited with code ${code}`);
        bridgeProcess = null;
        updateTrayStatus('disconnected', 'Əlaqə kəsildi');

        if (mainWindow) {
            mainWindow.webContents.send('bridge-stopped', code);
        }

        // Auto-restart after 5 seconds if not quitting
        if (!isQuitting && code !== 0) {
            setTimeout(() => {
                console.log('Auto-restarting bridge...');
                startBridge();
            }, 5000);
        }
    });

    bridgeProcess.on('error', (error) => {
        console.error('Failed to start bridge:', error);
        bridgeProcess = null;

        if (mainWindow) {
            mainWindow.webContents.send('bridge-log', {
                level: 'error',
                message: `Bridge başladılmadı: ${error.message}`
            });
        }
        updateTrayStatus('error', 'Başladılmadı');
    });
}

// Stop bridge process
function stopBridge() {
    if (bridgeProcess) {
        console.log('Stopping bridge process...');
        bridgeProcess.kill('SIGTERM');
        bridgeProcess = null;
        updateTrayStatus('disconnected', 'Dayandırıldı');
    }
}

// Restart bridge process
function restartBridge() {
    stopBridge();
    setTimeout(() => {
        startBridge();
    }, 1000);
}

// IPC Handlers
ipcMain.handle('get-config', () => {
    return getConfig();
});

ipcMain.handle('save-config', (event, newConfig) => {
    try {
        saveConfig(newConfig);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('restart-bridge', () => {
    restartBridge();
    return { success: true };
});

ipcMain.handle('get-auto-launch', async () => {
    return await autoLauncher.isEnabled();
});

ipcMain.handle('set-auto-launch', async (event, enable) => {
    try {
        if (enable) {
            await autoLauncher.enable();
        } else {
            await autoLauncher.disable();
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// App ready
app.whenReady().then(() => {
    initializeConfig();
    createWindow();
    createTray();

    // Enable auto-launch by default on first run
    autoLauncher.isEnabled().then((isEnabled) => {
        if (!isEnabled && !store.get('autoLaunchConfigured')) {
            autoLauncher.enable();
            store.set('autoLaunchConfigured', true);
        }
    });

    // Start bridge
    startBridge();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    // On macOS, keep app running in tray
    if (process.platform !== 'darwin') {
        // Don't quit, just hide
    }
});

app.on('before-quit', () => {
    isQuitting = true;
});

// Clean up on quit
app.on('quit', () => {
    stopBridge();
});
