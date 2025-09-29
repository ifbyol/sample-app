// Note: axios and baggage imports removed as no longer needed for local simulation

/**
 * Simulate external payment service call (like Stripe)
 * @param {Object} req - Express request object
 * @param {string} paymentId - Payment ID
 * @param {string} cardNumber - Card number
 * @returns {Promise} - Payment processing result
 */
const simulateStripePayment = async (req, paymentId, cardNumber) => {
  // Local mock simulation - no external HTTP calls
  // Simulate processing time with a small delay
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

  // Simulate different outcomes based on card number for testing flexibility
  const cardNumberClean = cardNumber.replace(/\s+/g, '');

  // Special test card numbers for different scenarios
  if (cardNumberClean === '4000000000000002') {
    // Card declined scenario
    return {
      success: false,
      error: 'Card declined',
      status: 'declined'
    };
  } else if (cardNumberClean === '4000000000000119') {
    // Processing error scenario
    return {
      success: false,
      error: 'Processing error',
      status: 'failed'
    };
  } else {
    // Default success scenario for all other card numbers
    return {
      success: true,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'completed',
      externalResponse: {
        status: 200,
        headers: {
          'x-request-id': `req_${Math.random().toString(36).substr(2, 9)}`,
          'content-type': 'application/json'
        }
      }
    };
  }
};

module.exports = {
  simulateStripePayment
};