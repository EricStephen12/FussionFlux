/**
 * Simple logger utility for consistent logging across the application
 */

// Define log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Logger configuration
const config = {
  // Can be set to false in production to disable debug logs
  enableDebugLogs: process.env.NODE_ENV !== 'production',
  // Can be enabled for specific client-side logging needs
  enableClientSideLogs: true
};

/**
 * Generic logger function that handles different log levels
 */
const log = (level: LogLevel, message: string, ...args: any[]) => {
  // In browser environment, check if we should log
  if (typeof window !== 'undefined' && !config.enableClientSideLogs) {
    return;
  }

  // Skip debug logs in production unless explicitly enabled
  if (level === 'debug' && !config.enableDebugLogs) {
    return;
  }

  const timestamp = new Date().toISOString();
  
  switch (level) {
    case 'debug':
      console.debug(`[${timestamp}] [DEBUG]`, message, ...args);
      break;
    case 'info':
      console.info(`[${timestamp}] [INFO]`, message, ...args);
      break;
    case 'warn':
      console.warn(`[${timestamp}] [WARN]`, message, ...args);
      break;
    case 'error':
      console.error(`[${timestamp}] [ERROR]`, message, ...args);
      break;
    default:
      console.log(`[${timestamp}] [LOG]`, message, ...args);
  }
};

/**
 * Logger object with methods for different log levels
 */
export const logger = {
  debug: (message: string, ...args: any[]) => log('debug', message, ...args),
  info: (message: string, ...args: any[]) => log('info', message, ...args),
  warn: (message: string, ...args: any[]) => log('warn', message, ...args),
  error: (message: string, ...args: any[]) => log('error', message, ...args),
}; 