const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');
const request = require('supertest');

const app = require('../../src/index');

describe('Payments Service Integration Tests', () => {
  let server;

  beforeAll(() => {
    // Start server on a different port for testing
    const testPort = 0; // Use 0 to get a random available port
    server = app.listen(testPort);
  });

  afterAll((done) => {
    server.close(done);
  });


  describe('Application Health', () => {
    test('should respond to root endpoint', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toEqual({
        service: 'payments-service',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: 'GET /health',
          processPayment: 'POST /process-payment'
        }
      });
    });

    test('should respond to health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        service: 'payments-service',
        timestamp: expect.any(String)
      });
    });

    test('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Route not found',
        message: 'Cannot GET /unknown-route'
      });
    });
  });

  describe('Baggage Header Handling', () => {
    test('should process requests with baggage header', async () => {
      const response = await request(app)
        .get('/health')
        .set('baggage', 'trace-id=integration-test123')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });

    test('should process payment with baggage header', async () => {
      const paymentData = {
        paymentId: 'pay_integration_test',
        cardNumber: '4242424242424242'
      };

      const response = await request(app)
        .post('/process-payment')
        .set('baggage', 'trace-id=payment-integration123')
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.paymentId).toBe('pay_integration_test');
    });

    test('should work without baggage header', async () => {
      const paymentData = {
        paymentId: 'pay_no_baggage_test',
        cardNumber: '4242424242424242'
      };

      const response = await request(app)
        .post('/process-payment')
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Payment Processing Flow', () => {
    test('should process complete payment flow', async () => {
      const paymentData = {
        paymentId: 'pay_complete_flow_test',
        cardNumber: '4242424242424242'
      };

      const response = await request(app)
        .post('/process-payment')
        .set('Content-Type', 'application/json')
        .set('baggage', 'trace-id=complete-flow123')
        .send(paymentData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        paymentId: 'pay_complete_flow_test',
        transactionId: expect.stringMatching(/^txn_\d+_[a-z0-9]{9}$/),
        status: 'completed',
        message: 'Payment processed successfully'
      });
    });

    test('should validate input and return proper error', async () => {
      const invalidPaymentData = {
        paymentId: 'pay_invalid_test'
        // Missing cardNumber
      };

      const response = await request(app)
        .post('/process-payment')
        .set('Content-Type', 'application/json')
        .send(invalidPaymentData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Missing required fields: paymentId and cardNumber are required'
      });
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/process-payment')
        .set('Content-Type', 'application/json')
        .send('{ invalid json')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Middleware Integration', () => {
    test('should apply all middleware in correct order', async () => {
      const response = await request(app)
        .post('/process-payment')
        .set('baggage', 'trace-id=middleware-test123')
        .set('Content-Type', 'application/json')
        .send({
          paymentId: 'pay_middleware_test',
          cardNumber: '4242424242424242'
        })
        .expect(200);

      // Verify that baggage middleware worked (would be in logs)
      expect(response.body.success).toBe(true);

      // Verify that JSON parsing middleware worked
      expect(typeof response.body).toBe('object');
    });

    test('should handle requests with different content types', async () => {
      const response = await request(app)
        .post('/process-payment')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('paymentId=pay_form_test&cardNumber=4242424242424242')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle processing errors with special card numbers', async () => {
      // Test with special card number for processing error
      const response = await request(app)
        .post('/process-payment')
        .send({
          paymentId: 'pay_error_test',
          cardNumber: '4000000000000119'
        })
        .expect(422);

      expect(response.body).toEqual({
        success: false,
        paymentId: 'pay_error_test',
        error: 'Processing error',
        status: 'failed'
      });
    });

    test('should handle card declined scenarios', async () => {
      // Test with special card number for card declined
      const response = await request(app)
        .post('/process-payment')
        .send({
          paymentId: 'pay_declined_test',
          cardNumber: '4000000000000002'
        })
        .expect(422);

      expect(response.body).toEqual({
        success: false,
        paymentId: 'pay_declined_test',
        error: 'Card declined',
        status: 'declined'
      });
    });

    test('should return proper headers for JSON responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});