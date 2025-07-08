import pino from 'pino';

/**
 * Structured logger using pino with configurable log level.
 * Set LOG_LEVEL environment variable to control verbosity (debug, info, warn, error).
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
}); 