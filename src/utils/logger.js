/**
 * Simple logger utility with different log levels
 */

// Logger utility for conditional logging
const isDev = process.env.NODE_ENV === 'development';

const logger = {
  debug: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },
  error: (...args) => {
    if (isDev) {
      console.error(...args);
    }
  },
  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  log: (...args) => {
    console.log('[INFO]', ...args);
  },
  info: (...args) => {
    console.info('[INFO]', ...args);
  }
};

export default logger;
