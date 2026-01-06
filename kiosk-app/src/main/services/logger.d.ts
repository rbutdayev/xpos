/**
 * Logger utility for sync service
 * Logs to both console and file
 */
import { LogLevel } from '../../shared/types';
export declare class Logger {
    private logFilePath;
    private logLevel;
    private maxFileSize;
    private maxBackups;
    constructor(logFileName?: string, level?: LogLevel);
    /**
     * Get platform-specific log directory
     */
    private getLogDirectory;
    /**
     * Get numeric log level for comparison
     */
    private getLogLevelValue;
    /**
     * Check if log level should be logged
     */
    private shouldLog;
    /**
     * Format log entry
     */
    private formatLogEntry;
    /**
     * Write log to file
     */
    private writeToFile;
    /**
     * Rotate logs if file size exceeds limit
     */
    private rotateLogsIfNeeded;
    /**
     * Log message
     */
    private log;
    /**
     * Log debug message
     */
    debug(message: string, context?: any): void;
    /**
     * Log info message
     */
    info(message: string, context?: any): void;
    /**
     * Log warning message
     */
    warn(message: string, context?: any): void;
    /**
     * Log error message
     */
    error(message: string, context?: any): void;
    /**
     * Get log file path
     */
    getLogFilePath(): string;
    /**
     * Clear log file
     */
    clearLogs(): void;
    /**
     * Read recent logs
     */
    readRecentLogs(lines?: number): string[];
}
/**
 * Create logger instance
 */
export declare function createLogger(logFileName?: string, level?: LogLevel): Logger;
export declare const syncLogger: Logger;
//# sourceMappingURL=logger.d.ts.map