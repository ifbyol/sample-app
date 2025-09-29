const { describe, test, expect } = require('@jest/globals');

const { simulateStripePayment } = require('../../../src/utils/httpClient');

describe('Payment Simulation Utility', () => {
  describe('simulateStripePayment', () => {
    test('should return success result for normal card numbers', async () => {
      const req = { baggage: 'trace-id=payment123' };
      const paymentId = 'pay_test123';
      const cardNumber = '4242424242424242';

      const result = await simulateStripePayment(req, paymentId, cardNumber);

      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^txn_\d+_[a-z0-9]{9}$/);
      expect(result.status).toBe('completed');
      expect(result.externalResponse.status).toBe(200);
      expect(result.externalResponse.headers['content-type']).toBe('application/json');
    });

    test('should return card declined for test card 4000000000000002', async () => {
      const req = {};
      const paymentId = 'pay_test123';
      const cardNumber = '4000000000000002';

      const result = await simulateStripePayment(req, paymentId, cardNumber);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Card declined');
      expect(result.status).toBe('declined');
    });

    test('should return processing error for test card 4000000000000119', async () => {
      const req = {};
      const paymentId = 'pay_test123';
      const cardNumber = '4000000000000119';

      const result = await simulateStripePayment(req, paymentId, cardNumber);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Processing error');
      expect(result.status).toBe('failed');
    });

    test('should handle card numbers with spaces correctly', async () => {
      const req = {};
      const paymentId = 'pay_test123';
      const cardNumber = '4000 0000 0000 0002'; // Card declined with spaces

      const result = await simulateStripePayment(req, paymentId, cardNumber);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Card declined');
      expect(result.status).toBe('declined');
    });

    test('should complete within reasonable time', async () => {
      const req = {};
      const paymentId = 'pay_test123';
      const cardNumber = '4242424242424242';

      const startTime = Date.now();
      await simulateStripePayment(req, paymentId, cardNumber);
      const endTime = Date.now();

      // Should complete within 500ms (100-300ms + overhead)
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});