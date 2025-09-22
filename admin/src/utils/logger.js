const winston = require('winston');
const config = require('../config/config');
const { getBaggage } = require('../middleware/baggage');

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

function logWithBaggage(level, message, meta = {}, req = null) {
  const logData = { ...meta };

  if (req && getBaggage(req)) {
    logData.baggage = getBaggage(req);
  }

  logger.log(level, message, logData);
}

function info(message, meta = {}, req = null) {
  logWithBaggage('info', message, meta, req);
}

function error(message, meta = {}, req = null) {
  logWithBaggage('error', message, meta, req);
}

function warn(message, meta = {}, req = null) {
  logWithBaggage('warn', message, meta, req);
}

function debug(message, meta = {}, req = null) {
  logWithBaggage('debug', message, meta, req);
}

module.exports = {
  info,
  error,
  warn,
  debug,
  logger
};