const winston = require('winston');

// Create Winston logger with JSON format
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

/**
 * Create a logger instance with baggage context
 * @param {Object} req - Express request object (optional)
 * @returns {Object} - Logger instance with baggage context
 */
const createContextLogger = (req) => {
  const baggage = req?.baggage || '';

  return {
    info: (message, meta = {}) => {
      const logData = { ...meta };
      if (baggage) {
        logData.baggage = baggage;
      }
      logger.info(message, logData);
    },

    error: (message, meta = {}) => {
      const logData = { ...meta };
      if (baggage) {
        logData.baggage = baggage;
      }
      logger.error(message, logData);
    },

    warn: (message, meta = {}) => {
      const logData = { ...meta };
      if (baggage) {
        logData.baggage = baggage;
      }
      logger.warn(message, logData);
    },

    debug: (message, meta = {}) => {
      const logData = { ...meta };
      if (baggage) {
        logData.baggage = baggage;
      }
      logger.debug(message, logData);
    }
  };
};

module.exports = {
  logger,
  createContextLogger
};