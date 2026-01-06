"use strict";
/**
 * Logger utility for sync service
 * Logs to both console and file
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncLogger = exports.Logger = void 0;
exports.createLogger = createLogger;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class Logger {
    constructor(logFileName = 'sync-service.log', level = 'info') {
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.maxBackups = 5;
        // Determine log directory based on environment
        const logDir = this.getLogDirectory();
        // Ensure log directory exists
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        this.logFilePath = path.join(logDir, logFileName);
        this.logLevel = level;
        // Create log file if it doesn't exist
        if (!fs.existsSync(this.logFilePath)) {
            fs.writeFileSync(this.logFilePath, '');
        }
    }
    /**
     * Get platform-specific log directory
     */
    getLogDirectory() {
        const platform = process.platform;
        // In Electron/production, use app data directory
        // For development, use relative logs directory
        if (process.env.NODE_ENV === 'production') {
            if (platform === 'win32') {
                // Windows: %APPDATA%\kiosk-pos\logs
                return path.join(process.env.APPDATA || '', 'kiosk-pos', 'logs');
            }
            else if (platform === 'darwin') {
                // macOS: ~/Library/Application Support/kiosk-pos/logs
                return path.join(process.env.HOME || '', 'Library', 'Application Support', 'kiosk-pos', 'logs');
            }
            else {
                // Linux: ~/.config/kiosk-pos/logs
                return path.join(process.env.HOME || '', '.config', 'kiosk-pos', 'logs');
            }
        }
        // Development: use relative path
        return path.resolve(process.cwd(), 'logs');
    }
    /**
     * Get numeric log level for comparison
     */
    getLogLevelValue(level) {
        const levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
        };
        return levels[level];
    }
    /**
     * Check if log level should be logged
     */
    shouldLog(level) {
        return this.getLogLevelValue(level) >= this.getLogLevelValue(this.logLevel);
    }
    /**
     * Format log entry
     */
    formatLogEntry(level, message, context) {
        const timestamp = new Date().toISOString();
        const levelStr = level.toUpperCase().padEnd(5);
        let logMessage = `[${timestamp}] ${levelStr} ${message}`;
        if (context) {
            try {
                logMessage += ` ${JSON.stringify(context)}`;
            }
            catch (error) {
                logMessage += ` [Context serialization error]`;
            }
        }
        return logMessage;
    }
    /**
     * Write log to file
     */
    writeToFile(logMessage) {
        try {
            // Check file size and rotate if needed
            this.rotateLogsIfNeeded();
            // Append to log file
            fs.appendFileSync(this.logFilePath, logMessage + '\n', 'utf8');
        }
        catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    /**
     * Rotate logs if file size exceeds limit
     */
    rotateLogsIfNeeded() {
        try {
            if (!fs.existsSync(this.logFilePath)) {
                return;
            }
            const stats = fs.statSync(this.logFilePath);
            if (stats.size >= this.maxFileSize) {
                // Rotate existing backups
                for (let i = this.maxBackups - 1; i >= 1; i--) {
                    const oldPath = `${this.logFilePath}.${i}`;
                    const newPath = `${this.logFilePath}.${i + 1}`;
                    if (fs.existsSync(oldPath)) {
                        if (i === this.maxBackups - 1) {
                            // Delete oldest backup
                            fs.unlinkSync(oldPath);
                        }
                        else {
                            fs.renameSync(oldPath, newPath);
                        }
                    }
                }
                // Move current log to .1
                fs.renameSync(this.logFilePath, `${this.logFilePath}.1`);
                // Create new empty log file
                fs.writeFileSync(this.logFilePath, '');
            }
        }
        catch (error) {
            console.error('Failed to rotate logs:', error);
        }
    }
    /**
     * Log message
     */
    log(level, message, context) {
        if (!this.shouldLog(level)) {
            return;
        }
        const logMessage = this.formatLogEntry(level, message, context);
        // Write to console
        switch (level) {
            case 'debug':
                console.debug(logMessage);
                break;
            case 'info':
                console.info(logMessage);
                break;
            case 'warn':
                console.warn(logMessage);
                break;
            case 'error':
                console.error(logMessage);
                break;
        }
        // Write to file
        this.writeToFile(logMessage);
    }
    /**
     * Log debug message
     */
    debug(message, context) {
        this.log('debug', message, context);
    }
    /**
     * Log info message
     */
    info(message, context) {
        this.log('info', message, context);
    }
    /**
     * Log warning message
     */
    warn(message, context) {
        this.log('warn', message, context);
    }
    /**
     * Log error message
     */
    error(message, context) {
        this.log('error', message, context);
    }
    /**
     * Get log file path
     */
    getLogFilePath() {
        return this.logFilePath;
    }
    /**
     * Clear log file
     */
    clearLogs() {
        try {
            fs.writeFileSync(this.logFilePath, '');
            this.info('Log file cleared');
        }
        catch (error) {
            console.error('Failed to clear log file:', error);
        }
    }
    /**
     * Read recent logs
     */
    readRecentLogs(lines = 100) {
        try {
            if (!fs.existsSync(this.logFilePath)) {
                return [];
            }
            const content = fs.readFileSync(this.logFilePath, 'utf8');
            const allLines = content.split('\n').filter((line) => line.trim() !== '');
            // Return last N lines
            return allLines.slice(-lines);
        }
        catch (error) {
            console.error('Failed to read log file:', error);
            return [];
        }
    }
}
exports.Logger = Logger;
/**
 * Create logger instance
 */
function createLogger(logFileName, level) {
    return new Logger(logFileName, level);
}
// Export default logger for sync service
exports.syncLogger = new Logger('sync-service.log', 'info');
//# sourceMappingURL=logger.js.map