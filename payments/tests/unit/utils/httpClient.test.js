const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');

// Mock axios and baggage middleware
jest.mock('axios');
jest.mock('../../../src/middleware/baggage');

const axios = require('axios');
const { getBaggageFromRequest } = require('../../../src/middleware/baggage');
const { createHttpClient, simulateStripePayment } = require('../../../src/utils/httpClient');

describe('HTTP Client Utility', () => {
  let mockAxiosInstance;

  beforeEach(() => {
    mockAxiosInstance = {
      defaults: { headers: {} },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      },
      post: jest.fn()
    };
    axios.create.mockReturnValue(mockAxiosInstance);
    getBaggageFromRequest.mockReturnValue('');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createHttpClient', () => {
    test('should create axios instance with default configuration', () => {
      const req = {};
      getBaggageFromRequest.mockReturnValue('');

      createHttpClient(req);

      expect(axios.create).toHaveBeenCalledWith({
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'payments-service/1.0.0'
        }
      });
    });

    test('should add baggage header when baggage is present', () => {
      const req = { baggage: 'trace-id=test123' };
      getBaggageFromRequest.mockReturnValue('trace-id=test123');

      createHttpClient(req);

      expect(mockAxiosInstance.defaults.headers.baggage).toBe('trace-id=test123');
    });

    test('should not add baggage header when baggage is empty', () => {
      const req = {};
      getBaggageFromRequest.mockReturnValue('');

      createHttpClient(req);

      expect(mockAxiosInstance.defaults.headers.baggage).toBeUndefined();
    });

    test('should setup request interceptor', () => {
      const req = { baggage: 'trace-id=test123' };
      getBaggageFromRequest.mockReturnValue('trace-id=test123');

      createHttpClient(req);

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    test('should setup response interceptor', () => {
      const req = {};

      createHttpClient(req);

      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('simulateStripePayment', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test('should return success result for successful payment', async () => {
      const req = { baggage: 'trace-id=payment123' };
      const paymentId = 'pay_test123';
      const cardNumber = '4242424242424242';

      getBaggageFromRequest.mockReturnValue('trace-id=payment123');
      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        headers: { 'content-type': 'application/json' }
      });

      const result = await simulateStripePayment(req, paymentId, cardNumber);

      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^txn_\d+$/);
      expect(result.status).toBe('completed');
      expect(result.externalResponse.status).toBe(200);
    });

    test('should mask card number in request payload', async () => {
      const req = {};
      const paymentId = 'pay_test123';
      const cardNumber = '4242424242424242';

      getBaggageFromRequest.mockReturnValue('');
      mockAxiosInstance.post.mockResolvedValue({ status: 200, headers: {} });

      await simulateStripePayment(req, paymentId, cardNumber);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'https://httpbin.org/post',
        expect.objectContaining({
          payment_intent_id: paymentId,
          card_number: '************4242',
          amount: 1000,
          currency: 'usd',
          source: 'payments-service'
        })
      );
    });

    test('should return failure result when axios throws error', async () => {
      const req = {};
      const paymentId = 'pay_test123';
      const cardNumber = '4242424242424242';

      getBaggageFromRequest.mockReturnValue('');
      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

      const result = await simulateStripePayment(req, paymentId, cardNumber);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.status).toBe('failed');
    });

    test('should call correct Stripe simulation endpoint', async () => {
      const req = {};
      const paymentId = 'pay_test123';
      const cardNumber = '4242424242424242';

      getBaggageFromRequest.mockReturnValue('');
      mockAxiosInstance.post.mockResolvedValue({ status: 200, headers: {} });

      await simulateStripePayment(req, paymentId, cardNumber);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'https://httpbin.org/post',
        expect.any(Object)
      );
    });

    test('should include baggage in HTTP client when present', async () => {
      const req = { baggage: 'trace-id=stripe123' };
      const paymentId = 'pay_test123';
      const cardNumber = '4242424242424242';

      getBaggageFromRequest.mockReturnValue('trace-id=stripe123');
      mockAxiosInstance.post.mockResolvedValue({ status: 200, headers: {} });

      await simulateStripePayment(req, paymentId, cardNumber);

      expect(getBaggageFromRequest).toHaveBeenCalledWith(req);
      expect(mockAxiosInstance.defaults.headers.baggage).toBe('trace-id=stripe123');
    });
  });
});