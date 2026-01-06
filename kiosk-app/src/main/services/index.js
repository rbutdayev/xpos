"use strict";
/**
 * Services Index
 * Export all services for easy importing
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIPCHandlers = exports.setupElectronIntegration = exports.initializeKioskApp = exports.stopSyncService = exports.checkConnectionStatus = exports.triggerManualSync = exports.initializeSyncService = exports.createSyncDatabase = exports.SyncDatabase = exports.syncLogger = exports.createLogger = exports.Logger = exports.createSyncService = exports.SyncService = exports.createApiClient = exports.ApiClient = void 0;
// API Client
var api_client_1 = require("./api-client");
Object.defineProperty(exports, "ApiClient", { enumerable: true, get: function () { return api_client_1.ApiClient; } });
Object.defineProperty(exports, "createApiClient", { enumerable: true, get: function () { return api_client_1.createApiClient; } });
// Sync Service
var sync_service_1 = require("./sync-service");
Object.defineProperty(exports, "SyncService", { enumerable: true, get: function () { return sync_service_1.SyncService; } });
Object.defineProperty(exports, "createSyncService", { enumerable: true, get: function () { return sync_service_1.createSyncService; } });
// Logger
var logger_1 = require("./logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return logger_1.Logger; } });
Object.defineProperty(exports, "createLogger", { enumerable: true, get: function () { return logger_1.createLogger; } });
Object.defineProperty(exports, "syncLogger", { enumerable: true, get: function () { return logger_1.syncLogger; } });
// Database
var sync_database_1 = require("../database/sync-database");
Object.defineProperty(exports, "SyncDatabase", { enumerable: true, get: function () { return sync_database_1.SyncDatabase; } });
Object.defineProperty(exports, "createSyncDatabase", { enumerable: true, get: function () { return sync_database_1.createSyncDatabase; } });
// Example Usage
var example_usage_1 = require("./example-usage");
Object.defineProperty(exports, "initializeSyncService", { enumerable: true, get: function () { return example_usage_1.initializeSyncService; } });
Object.defineProperty(exports, "triggerManualSync", { enumerable: true, get: function () { return example_usage_1.triggerManualSync; } });
Object.defineProperty(exports, "checkConnectionStatus", { enumerable: true, get: function () { return example_usage_1.checkConnectionStatus; } });
Object.defineProperty(exports, "stopSyncService", { enumerable: true, get: function () { return example_usage_1.stopSyncService; } });
Object.defineProperty(exports, "initializeKioskApp", { enumerable: true, get: function () { return example_usage_1.initializeKioskApp; } });
Object.defineProperty(exports, "setupElectronIntegration", { enumerable: true, get: function () { return example_usage_1.setupElectronIntegration; } });
Object.defineProperty(exports, "setupIPCHandlers", { enumerable: true, get: function () { return example_usage_1.setupIPCHandlers; } });
// Types
__exportStar(require("../../shared/types"), exports);
//# sourceMappingURL=index.js.map