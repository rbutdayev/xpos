/**
 * Logger utility for sync service
 * Logs to both console and file
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { LogLevel, LogEntry } from '../../shared/types';

export class Logger {
  private logFilePath: string;
  private logLevel: LogLevel;
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private maxBackups: number = 5;

  constructor(logFileName: string = 'sync-service.log', level: LogLevel = 'info') {
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
  private getLogDirectory(): string {
    // Use Electron's app.getPath('userData') for proper app data directory
    // This works in both development and production
    try {
      // In packaged app or when app is ready
      const userDataPath = app.getPath('userData');
      return path.join(userDataPath, 'logs');
    } catch (error) {
      // Fallback for development when app might not be ready yet
      return path.resolve(process.cwd(), 'logs');
    }
  }

  /**
   * Get numeric log level for comparison
   */
  private getLogLevelValue(level: LogLevel): number {
    const levels: Record<LogLevel, number> = {
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
  private shouldLog(level: LogLevel): boolean {
    return this.getLogLevelValue(level) >= this.getLogLevelValue(this.logLevel);
  }

  /**
   * Format log entry
   */
  private formatLogEntry(level: LogLevel, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);

    let logMessage = `[${timestamp}] ${levelStr} ${message}`;

    if (context) {
      try {
        logMessage += ` ${JSON.stringify(context)}`;
      } catch (error) {
        logMessage += ` [Context serialization error]`;
      }
    }

    return logMessage;
  }

  /**
   * Write log to file
   */
  private writeToFile(logMessage: string): void {
    try {
      // Check file size and rotate if needed
      this.rotateLogsIfNeeded();

      // Append to log file
      fs.appendFileSync(this.logFilePath, logMessage + '\n', 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Rotate logs if file size exceeds limit
   */
  private rotateLogsIfNeeded(): void {
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
            } else {
              fs.renameSync(oldPath, newPath);
            }
          }
        }

        // Move current log to .1
        fs.renameSync(this.logFilePath, `${this.logFilePath}.1`);

        // Create new empty log file
        fs.writeFileSync(this.logFilePath, '');
      }
    } catch (error) {
      console.error('Failed to rotate logs:', error);
    }
  }

  /**
   * Log message
   */
  private log(level: LogLevel, message: string, context?: any): void {
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
  debug(message: string, context?: any): void {
    this.log('debug', message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: any): void {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: any): void {
    this.log('warn', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: any): void {
    this.log('error', message, context);
  }

  /**
   * Get log file path
   */
  getLogFilePath(): string {
    return this.logFilePath;
  }

  /**
   * Clear log file
   */
  clearLogs(): void {
    try {
      fs.writeFileSync(this.logFilePath, '');
      this.info('Log file cleared');
    } catch (error) {
      console.error('Failed to clear log file:', error);
    }
  }

  /**
   * Read recent logs
   */
  readRecentLogs(lines: number = 100): string[] {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return [];
      }

      const content = fs.readFileSync(this.logFilePath, 'utf8');
      const allLines = content.split('\n').filter((line) => line.trim() !== '');

      // Return last N lines
      return allLines.slice(-lines);
    } catch (error) {
      console.error('Failed to read log file:', error);
      return [];
    }
  }
}

/**
 * Create logger instance
 */
export function createLogger(logFileName?: string, level?: LogLevel): Logger {
  return new Logger(logFileName, level);
}

// Export default logger for sync service
export const syncLogger = new Logger('sync-service.log', 'info');
