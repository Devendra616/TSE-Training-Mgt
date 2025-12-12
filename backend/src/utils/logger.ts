import winston from 'winston';
import path from 'path';
import { config } from '../config/index.js';

const logDir = path.resolve(__dirname, '../../logs');

/**
 * Winston logger configuration
 * - Console output for development
 * - File output for all environments
 * - Structured JSON format for production
 */
export const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'training-mgt' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
});

// Console output for development
if (config.env === 'development') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          return `${timestamp} [${level}]: ${stack || message}`;
        })
      ),
    })
  );
}

/**
 * Log user actions for audit trail
 */
export function logUserAction(
  userId: number,
  action: string,
  resource: string,
  resourceId?: number | string,
  details?: Record<string, unknown>
): void {
  logger.info('User action', {
    userId,
    action,
    resource,
    resourceId,
    details,
    type: 'audit',
  });
}

export default logger;
