const axios = require('axios');
const { getBaggageFromRequest } = require('../middleware/baggage');

/**
 * Create HTTP client instance with baggage propagation
 * @param {Object} req - Express request object for baggage context
 * @returns {Object} - Axios instance with baggage headers
 */
const createHttpClient = (req) => {
  const baggage = getBaggageFromRequest(req);

  const client = axios.create({
    timeout: 10000, // 10 seconds timeout
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'payments-service/1.0.0'
    }
  });

  // Add baggage header if available
  if (baggage) {
    client.defaults.headers.baggage = baggage;
  }

  // Request interceptor to ensure baggage is always included
  client.interceptors.request.use(
    (config) => {
      if (baggage && !config.headers.baggage) {
        config.headers.baggage = baggage;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for logging
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Log error with baggage context if available
      const errorData = {
        message: error.message,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method
      };

      if (baggage) {
        errorData.baggage = baggage;
      }

      console.error('HTTP Client Error:', errorData);
      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Simulate external payment service call (like Stripe)
 * @param {Object} req - Express request object
 * @param {string} paymentId - Payment ID
 * @param {string} cardNumber - Card number
 * @returns {Promise} - Payment processing result
 */
const simulateStripePayment = async (req, paymentId, cardNumber) => {
  const client = createHttpClient(req);

  // Simulate calling Stripe API (this would be a real Stripe endpoint in production)
  const mockStripeEndpoint = 'https://httpbin.org/post'; // Using httpbin for simulation

  try {
    const response = await client.post(mockStripeEndpoint, {
      payment_intent_id: paymentId,
      card_number: cardNumber.replace(/\d(?=\d{4})/g, '*'), // Mask card number in logs
      amount: 1000, // $10.00 in cents
      currency: 'usd',
      source: 'payments-service'
    });

    return {
      success: true,
      transactionId: `txn_${Date.now()}`,
      status: 'completed',
      externalResponse: {
        status: response.status,
        headers: response.headers
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 'failed'
    };
  }
};

module.exports = {
  createHttpClient,
  simulateStripePayment
};