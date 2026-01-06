/**
 * Electron Main Process
 *
 * Entry point for the kiosk application.
 * - Creates BrowserWindow
 * - Loads React app (dev: localhost:5173, prod: file://)
 * - Setup IPC handlers
 * - Initialize services (database, sync, fiscal)
 * - Handle app lifecycle
 */

import { app, BrowserWindow, ipcMain, protocol } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { Database } from './database';
import { registerIPCHandlers } from './ipc-handlers';
import { createApiClient } from '../src/main/services/api-client';
import { createSyncService } from '../src/main/services/sync-service';
import { fiscalService } from '../src/main/services/fiscal-service';
import Store from 'electron-store';

// ============================================================================
// Global State
// ============================================================================

let mainWindow: BrowserWindow | null = null;
let database: Database | null = null;
let syncService: any = null;
let apiClient: any = null;

// Persistent config store
const configStore = new Store({
  name: 'kiosk-config',
  defaults: {
    token: '',
    api_url: '',
    account_id: 0,
    branch_id: 0,
    device_name: '',
    is_registered: false,
  },
});

// ============================================================================
// Protocol Registration (must be before app.ready)
// ============================================================================

// Register custom protocol as privileged (allows fetch, bypasses CSP)
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local',
    privileges: {
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      corsEnabled: true,
    },
  },
]);

// ============================================================================
// App Lifecycle
// ============================================================================

/**
 * Create main window
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false, // Security: Disable Node.js in renderer
      contextIsolation: true, // Security: Isolate context
      preload: path.join(__dirname, 'preload.js'), // Use compiled preload.js
      devTools: true, // Enable devTools for debugging
    },
    backgroundColor: '#1a1a1a',
    show: false, // Don't show until ready
    autoHideMenuBar: true, // Hide menu bar
  });

  // Load React app
  if (app.isPackaged) {
    // Production: Load from dist
    const indexPath = path.join(__dirname, '../../renderer/index.html');
    console.log('='.repeat(80));
    console.log('LOADING INDEX.HTML');
    console.log('__dirname:', __dirname);
    console.log('indexPath:', indexPath);
    console.log('File exists:', require('fs').existsSync(indexPath));
    console.log('='.repeat(80));

    mainWindow.loadFile(indexPath).then(() => {
      console.log('✓ Index.html loaded successfully');
    }).catch((error) => {
      console.error('✗ Failed to load index.html:', error);
    });

    // DevTools disabled for production
    // mainWindow.webContents.openDevTools();
  } else {
    // Development: Load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');

    // DevTools disabled
    // mainWindow.webContents.openDevTools();
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent external navigation (security)
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost:5173') && !url.startsWith('file://')) {
      event.preventDefault();
      console.warn('Prevented navigation to:', url);
    }
  });
}

/**
 * Initialize database
 */
async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database...');

    // Get database path (in userData directory)
    const dbPath = path.join(app.getPath('userData'), 'kiosk.db');
    console.log('Database path:', dbPath);

    // Create database instance
    database = new Database(dbPath);

    // Run migrations
    database.migrate();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Initialize services (sync, fiscal, etc.)
 */
async function initializeServices(): Promise<void> {
  try {
    console.log('Initializing services...');

    // Get config from store
    const config = configStore.store;

    if (!config.is_registered || !config.token || !config.api_url) {
      console.log('App not registered yet, skipping service initialization');
      return;
    }

    // Initialize API client
    apiClient = createApiClient({
      baseURL: config.api_url,
      token: config.token,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    });

    // Initialize sync service
    if (database) {
      syncService = createSyncService({
        apiClient,
        database,
        syncIntervalSeconds: 300, // 5 minutes
        heartbeatIntervalSeconds: 30, // 30 seconds
        maxRetryAttempts: 3,
      });

      // Listen to sync events
      syncService.on('connection:online', () => {
        console.log('Connection: ONLINE');
        mainWindow?.webContents.send('sync:connection-changed', { isOnline: true });
      });

      syncService.on('connection:offline', () => {
        console.log('Connection: OFFLINE');
        mainWindow?.webContents.send('sync:connection-changed', { isOnline: false });
      });

      syncService.on('sync:started', () => {
        console.log('Sync: STARTED');
        mainWindow?.webContents.send('sync:status-changed', { isSyncing: true });
      });

      syncService.on('sync:completed', (event: any) => {
        console.log('Sync: COMPLETED');
        mainWindow?.webContents.send('sync:status-changed', {
          isSyncing: false,
          lastSyncTime: event.timestamp,
        });
      });

      syncService.on('sync:failed', (event: any) => {
        console.error('Sync: FAILED', event.error);
        mainWindow?.webContents.send('sync:status-changed', {
          isSyncing: false,
          error: event.error,
        });
      });

      syncService.on('sync:progress', (progress: any) => {
        mainWindow?.webContents.send('sync:progress', progress);
      });

      // Start sync service
      syncService.start();
      console.log('Sync service started');
    }

    // Initialize fiscal service with config from database
    if (database) {
      const fiscalConfig = database.getFiscalConfig();
      if (fiscalConfig) {
        await fiscalService.initialize(fiscalConfig);
        console.log('Fiscal service initialized');
      } else {
        console.log('No fiscal config found, skipping fiscal service initialization');
      }
    }

    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    // Don't throw - app can still work without services
  }
}

/**
 * Shutdown services gracefully
 */
async function shutdownServices(): Promise<void> {
  try {
    console.log('Shutting down services...');

    // Stop sync service
    if (syncService) {
      syncService.stop();
      syncService = null;
      console.log('Sync service stopped');
    }

    // Close database
    if (database) {
      database.close();
      database = null;
      console.log('Database closed');
    }

    console.log('Services shutdown complete');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
}

/**
 * Restart services only (keep database open)
 */
async function restartServicesOnly(): Promise<void> {
  try {
    console.log('Restarting services...');

    // Stop sync service
    if (syncService) {
      syncService.stop();
      syncService = null;
      console.log('Sync service stopped');
    }

    // Reinitialize services
    await initializeServices();

    console.log('Services restarted successfully');
  } catch (error) {
    console.error('Error restarting services:', error);
    throw error;
  }
}

/**
 * Register custom protocol to serve local files
 */
function registerLocalFileProtocol(): void {
  protocol.registerFileProtocol('local', (request, callback) => {
    try {
      const url = request.url.replace('local://', '');
      const decodedPath = decodeURIComponent(url);

      // Security: Only allow files from userData directory
      const userDataPath = app.getPath('userData');
      const absolutePath = path.isAbsolute(decodedPath) ? decodedPath : path.join(userDataPath, decodedPath);

      // Verify the file is within userData directory
      if (!absolutePath.startsWith(userDataPath)) {
        console.error('Rejected file access outside userData:', absolutePath);
        callback({ error: -10 }); // ACCESS_DENIED
        return;
      }

      // Check if file exists
      if (!fs.existsSync(absolutePath)) {
        console.error('File not found:', absolutePath);
        callback({ error: -6 }); // FILE_NOT_FOUND
        return;
      }

      callback({ path: absolutePath });
    } catch (error) {
      console.error('Error serving local file:', error);
      callback({ error: -2 }); // FAILED
    }
  });
}

/**
 * App ready handler
 */
app.whenReady().then(async () => {
  try {
    console.log('App starting...');
    console.log('Version:', app.getVersion());
    console.log('User data path:', app.getPath('userData'));
    console.log('Environment:', app.isPackaged ? 'production' : 'development');

    // Register custom protocol for local files
    registerLocalFileProtocol();
    console.log('Local file protocol registered');

    // Initialize database
    await initializeDatabase();

    // Register IPC handlers
    if (database) {
      registerIPCHandlers({
        database,
        configStore,
        getApiClient: () => apiClient,
        getSyncService: () => syncService,
        getFiscalService: () => fiscalService,
        restartServices: restartServicesOnly,
      });
    }

    // Create window
    createWindow();

    // Initialize services
    await initializeServices();

    console.log('App started successfully');
  } catch (error) {
    console.error('Failed to start app:', error);
    app.quit();
  }
});

/**
 * Activate handler (macOS)
 */
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

/**
 * Window all closed handler
 */
app.on('window-all-closed', () => {
  // On macOS, apps stay active until Cmd+Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Before quit handler
 */
app.on('before-quit', async (event) => {
  event.preventDefault();

  // Shutdown services gracefully
  await shutdownServices();

  // Quit for real
  app.exit(0);
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);

  // Send to renderer for error reporting
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('app:error', {
      type: 'uncaught-exception',
      error: error.message,
      stack: error.stack,
    });
  }
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);

  // Send to renderer for error reporting
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('app:error', {
      type: 'unhandled-rejection',
      error: String(reason),
    });
  }
});

// ============================================================================
// Exports (for testing)
// ============================================================================

export {
  mainWindow,
  database,
  syncService,
  apiClient,
  configStore,
};
