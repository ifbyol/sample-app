const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');

// Mock winston before importing logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

jest.mock('winston', () => ({
  createLogger: jest.fn(() => mockLogger),
  format: {
    combine: jest.fn(() => 'combined-format'),
    timestamp: jest.fn(() => 'timestamp-format'),
    errors: jest.fn(() => 'errors-format'),
    json: jest.fn(() => 'json-format')
  },
  transports: {
    Console: jest.fn()
  }
}));

const winston = require('winston');
const { createContextLogger } = require('../../../src/utils/logger');

describe('Logger Utility', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createContextLogger', () => {
    test('should create logger with baggage context', () => {
      const req = { baggage: 'trace-id=test123' };
      const logger = createContextLogger(req);

      logger.info('Test message', { extra: 'data' });

      expect(mockLogger.info).toHaveBeenCalledWith('Test message', {
        extra: 'data',
        baggage: 'trace-id=test123'
      });
    });

    test('should create logger without baggage when req has no baggage', () => {
      const req = {};
      const logger = createContextLogger(req);

      logger.info('Test message', { extra: 'data' });

      expect(mockLogger.info).toHaveBeenCalledWith('Test message', {
        extra: 'data'
      });
    });

    test('should create logger without baggage when req is undefined', () => {
      const logger = createContextLogger();

      logger.info('Test message', { extra: 'data' });

      expect(mockLogger.info).toHaveBeenCalledWith('Test message', {
        extra: 'data'
      });
    });

    test('should handle empty baggage string', () => {
      const req = { baggage: '' };
      const logger = createContextLogger(req);

      logger.info('Test message');

      expect(mockLogger.info).toHaveBeenCalledWith('Test message', {});
    });

    test('should log error with baggage context', () => {
      const req = { baggage: 'trace-id=error123' };
      const logger = createContextLogger(req);

      logger.error('Error message', { code: 500 });

      expect(mockLogger.error).toHaveBeenCalledWith('Error message', {
        code: 500,
        baggage: 'trace-id=error123'
      });
    });

    test('should log warn with baggage context', () => {
      const req = { baggage: 'trace-id=warn123' };
      const logger = createContextLogger(req);

      logger.warn('Warning message', { status: 'deprecated' });

      expect(mockLogger.warn).toHaveBeenCalledWith('Warning message', {
        status: 'deprecated',
        baggage: 'trace-id=warn123'
      });
    });

    test('should log debug with baggage context', () => {
      const req = { baggage: 'trace-id=debug123' };
      const logger = createContextLogger(req);

      logger.debug('Debug message', { details: 'verbose' });

      expect(mockLogger.debug).toHaveBeenCalledWith('Debug message', {
        details: 'verbose',
        baggage: 'trace-id=debug123'
      });
    });

    test('should not override existing baggage in meta', () => {
      const req = { baggage: 'trace-id=original' };
      const logger = createContextLogger(req);

      logger.info('Test message', { baggage: 'trace-id=override', other: 'data' });

      expect(mockLogger.info).toHaveBeenCalledWith('Test message', {
        baggage: 'trace-id=original',
        other: 'data'
      });
    });

    test('should handle meta parameter being undefined', () => {
      const req = { baggage: 'trace-id=test123' };
      const logger = createContextLogger(req);

      logger.info('Test message');

      expect(mockLogger.info).toHaveBeenCalledWith('Test message', {
        baggage: 'trace-id=test123'
      });
    });
  });
});