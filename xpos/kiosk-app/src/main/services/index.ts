/**
 * Services Index
 * Export all services for easy importing
 */

// API Client
export { ApiClient, createApiClient } from './api-client';

// Sync Service
export { SyncService, createSyncService, ISyncDatabase } from './sync-service';

// Logger
export { Logger, createLogger, syncLogger } from './logger';

// Database
export { SyncDatabase, createSyncDatabase } from '../database/sync-database';

// Example Usage
export {
  initializeSyncService,
  triggerManualSync,
  checkConnectionStatus,
  stopSyncService,
  initializeKioskApp,
  setupElectronIntegration,
  setupIPCHandlers,
} from './example-usage';

// Types
export * from '../../shared/types';
