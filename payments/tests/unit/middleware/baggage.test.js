const { describe, test, expect, beforeEach } = require('@jest/globals');
const { baggageMiddleware, getBaggageFromRequest } = require('../../../src/middleware/baggage');

describe('Baggage Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      set: jest.fn()
    };
    next = jest.fn();
  });

  describe('baggageMiddleware', () => {
    test('should extract baggage header and store in request', () => {
      req.headers.baggage = 'trace-id=abc123,span-id=def456';

      baggageMiddleware(req, res, next);

      expect(req.baggage).toBe('trace-id=abc123,span-id=def456');
      expect(next).toHaveBeenCalled();
    });

    test('should handle case-insensitive baggage header', () => {
      req.headers.Baggage = 'trace-id=xyz789';

      baggageMiddleware(req, res, next);

      expect(req.baggage).toBe('trace-id=xyz789');
      expect(next).toHaveBeenCalled();
    });

    test('should set empty string when no baggage header present', () => {
      baggageMiddleware(req, res, next);

      expect(req.baggage).toBe('');
      expect(next).toHaveBeenCalled();
    });

    test('should set X-Baggage-Received response header when baggage is present', () => {
      req.headers.baggage = 'trace-id=test123';

      baggageMiddleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith('X-Baggage-Received', 'trace-id=test123');
    });

    test('should not set response header when baggage is empty', () => {
      baggageMiddleware(req, res, next);

      expect(res.set).not.toHaveBeenCalled();
    });
  });

  describe('getBaggageFromRequest', () => {
    test('should return baggage from request object', () => {
      req.baggage = 'trace-id=test456';

      const result = getBaggageFromRequest(req);

      expect(result).toBe('trace-id=test456');
    });

    test('should return empty string when no baggage in request', () => {
      const result = getBaggageFromRequest(req);

      expect(result).toBe('');
    });

    test('should return empty string for undefined request', () => {
      const result = getBaggageFromRequest(undefined);

      expect(result).toBe('');
    });
  });
});