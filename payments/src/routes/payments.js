const express = require('express');
const { createContextLogger } = require('../utils/logger');
const { simulateStripePayment } = require('../utils/httpClient');

const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  const log = createContextLogger(req);
  log.info('Health check requested');

  res.json({
    status: 'healthy',
    service: 'payments-service',
    timestamp: new Date().toISOString()
  });

  log.info('Health check completed successfully');
});

/**
 * Process payment endpoint
 * Simulates payment processing with external service (like Stripe)
 */
router.post('/process-payment', async (req, res) => {
  const log = createContextLogger(req);
  const { paymentId, cardNumber } = req.body;

  log.info('Payment processing started', {
    paymentId,
    cardNumberMask: cardNumber ? cardNumber.replace(/\d(?=\d{4})/g, '*') : 'not provided'
  });

  // Validate required fields
  if (!paymentId || !cardNumber) {
    log.error('Invalid payment request - missing required fields', {
      paymentId: !!paymentId,
      cardNumber: !!cardNumber
    });

    return res.status(400).json({
      success: false,
      error: 'Missing required fields: paymentId and cardNumber are required'
    });
  }

  // Validate card number format (basic validation)
  const cardNumberClean = cardNumber.replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(cardNumberClean)) {
    log.error('Invalid card number format', {
      paymentId,
      cardNumberLength: cardNumberClean.length
    });

    return res.status(400).json({
      success: false,
      error: 'Invalid card number format'
    });
  }

  try {
    // Simulate processing with external payment service
    log.info('Calling external payment service', {
      paymentId,
      service: 'stripe-simulation'
    });

    const result = await simulateStripePayment(req, paymentId, cardNumber);

    if (result.success) {
      log.info('Payment processed successfully', {
        paymentId,
        transactionId: result.transactionId,
        status: result.status
      });

      res.json({
        success: true,
        paymentId,
        transactionId: result.transactionId,
        status: result.status,
        message: 'Payment processed successfully'
      });
    } else {
      log.error('Payment processing failed', {
        paymentId,
        error: result.error,
        status: result.status
      });

      res.status(422).json({
        success: false,
        paymentId,
        error: result.error,
        status: result.status
      });
    }
  } catch (error) {
    log.error('Unexpected error during payment processing', {
      paymentId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      paymentId,
      error: 'Internal server error during payment processing'
    });
  }
});

module.exports = router;