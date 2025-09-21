/**
 * Baggage middleware for extracting and storing baggage header in request context
 */

const baggageMiddleware = (req, res, next) => {
  // Extract baggage header from incoming request
  const baggage = req.headers.baggage || req.headers.Baggage || '';

  // Store baggage in request object for use throughout the request lifecycle
  req.baggage = baggage;

  // Add baggage to response headers for debugging (optional)
  if (baggage) {
    res.set('X-Baggage-Received', baggage);
  }

  next();
};

/**
 * Get baggage from request object
 * @param {Object} req - Express request object
 * @returns {string} - Baggage header value
 */
const getBaggageFromRequest = (req) => {
  return req?.baggage || '';
};

module.exports = {
  baggageMiddleware,
  getBaggageFromRequest
};