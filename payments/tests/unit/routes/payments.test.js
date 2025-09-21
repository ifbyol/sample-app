const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const request = require('supertest');

// Mock dependencies
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/httpClient');

const { createContextLogger } = require('../../../src/utils/logger');
const { simulateStripePayment } = require('../../../src/utils/httpClient');

// Import and setup app
const express = require('express');
const paymentsRoutes = require('../../../src/routes/payments');

const app = express();
app.use(express.json());

// Mock baggage middleware
app.use((req, res, next) => {
  req.baggage = req.headers.baggage || '';
  next();
});

app.use('/', paymentsRoutes);

describe('Payment Routes', () => {
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };
    createContextLogger.mockReturnValue(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    test('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        service: 'payments-service',
        timestamp: expect.any(String)
      });
    });

    test('should log health check request', async () => {
      await request(app)
        .get('/health')
        .expect(200);

      expect(mockLogger.info).toHaveBeenCalledWith('Health check requested');
      expect(mockLogger.info).toHaveBeenCalledWith('Health check completed successfully');
    });

    test('should work with baggage header', async () => {
      await request(app)
        .get('/health')
        .set('baggage', 'trace-id=health123')
        .expect(200);

      expect(createContextLogger).toHaveBeenCalledWith(
        expect.objectContaining({ baggage: 'trace-id=health123' })
      );
    });
  });

  describe('POST /process-payment', () => {
    const validPayment = {
      paymentId: 'pay_test123',
      cardNumber: '4242424242424242'
    };

    test('should process valid payment successfully', async () => {
      simulateStripePayment.mockResolvedValue({
        success: true,
        transactionId: 'txn_1234567890',
        status: 'completed'
      });

      const response = await request(app)
        .post('/process-payment')
        .send(validPayment)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        paymentId: 'pay_test123',
        transactionId: 'txn_1234567890',
        status: 'completed',
        message: 'Payment processed successfully'
      });
    });

    test('should return 400 for missing paymentId', async () => {
      const invalidPayment = { cardNumber: '4242424242424242' };

      const response = await request(app)
        .post('/process-payment')
        .send(invalidPayment)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Missing required fields: paymentId and cardNumber are required'
      });
    });

    test('should return 400 for missing cardNumber', async () => {
      const invalidPayment = { paymentId: 'pay_test123' };

      const response = await request(app)
        .post('/process-payment')
        .send(invalidPayment)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Missing required fields: paymentId and cardNumber are required'
      });
    });

    test('should return 400 for invalid card number format', async () => {
      const invalidPayment = {
        paymentId: 'pay_test123',
        cardNumber: '123' // Too short
      };

      const response = await request(app)
        .post('/process-payment')
        .send(invalidPayment)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid card number format'
      });
    });

    test('should return 400 for card number with letters', async () => {
      const invalidPayment = {
        paymentId: 'pay_test123',
        cardNumber: '424242424242abc2'
      };

      const response = await request(app)
        .post('/process-payment')
        .send(invalidPayment)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid card number format'
      });
    });

    test('should handle spaces in card number', async () => {
      simulateStripePayment.mockResolvedValue({
        success: true,
        transactionId: 'txn_1234567890',
        status: 'completed'
      });

      const paymentWithSpaces = {
        paymentId: 'pay_test123',
        cardNumber: '4242 4242 4242 4242'
      };

      const response = await request(app)
        .post('/process-payment')
        .send(paymentWithSpaces)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return 422 for failed payment processing', async () => {
      simulateStripePayment.mockResolvedValue({
        success: false,
        error: 'Card declined',
        status: 'failed'
      });

      const response = await request(app)
        .post('/process-payment')
        .send(validPayment)
        .expect(422);

      expect(response.body).toEqual({
        success: false,
        paymentId: 'pay_test123',
        error: 'Card declined',
        status: 'failed'
      });
    });

    test('should return 500 for unexpected errors', async () => {
      simulateStripePayment.mockRejectedValue(new Error('Network error'));

      const response = await request(app)
        .post('/process-payment')
        .send(validPayment)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        paymentId: 'pay_test123',
        error: 'Internal server error during payment processing'
      });
    });

    test('should log payment processing steps', async () => {
      simulateStripePayment.mockResolvedValue({
        success: true,
        transactionId: 'txn_1234567890',
        status: 'completed'
      });

      await request(app)
        .post('/process-payment')
        .send(validPayment)
        .expect(200);

      expect(mockLogger.info).toHaveBeenCalledWith('Payment processing started', {
        paymentId: 'pay_test123',
        cardNumberMask: '************4242'
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Calling external payment service', {
        paymentId: 'pay_test123',
        service: 'stripe-simulation'
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Payment processed successfully', {
        paymentId: 'pay_test123',
        transactionId: 'txn_1234567890',
        status: 'completed'
      });
    });

    test('should work with baggage header', async () => {
      simulateStripePayment.mockResolvedValue({
        success: true,
        transactionId: 'txn_1234567890',
        status: 'completed'
      });

      await request(app)
        .post('/process-payment')
        .set('baggage', 'trace-id=payment123')
        .send(validPayment)
        .expect(200);

      expect(createContextLogger).toHaveBeenCalledWith(
        expect.objectContaining({ baggage: 'trace-id=payment123' })
      );

      expect(simulateStripePayment).toHaveBeenCalledWith(
        expect.objectContaining({ baggage: 'trace-id=payment123' }),
        'pay_test123',
        '4242424242424242'
      );
    });

    test('should mask card number in error logs', async () => {
      const invalidPayment = {
        paymentId: 'pay_test123',
        cardNumber: '123'
      };

      await request(app)
        .post('/process-payment')
        .send(invalidPayment)
        .expect(400);

      expect(mockLogger.error).toHaveBeenCalledWith('Invalid card number format', {
        paymentId: 'pay_test123',
        cardNumberLength: 3
      });
    });
  });
});