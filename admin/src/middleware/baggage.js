function baggageMiddleware(req, res, next) {
  // Extract baggage from headers
  const baggage = req.headers['baggage'] || req.headers['Baggage'];

  if (baggage) {
    req.baggage = baggage;
    // Add baggage to response headers for downstream services
    res.set('baggage', baggage);
  }

  next();
}

function getBaggage(req) {
  return req.baggage || '';
}

module.exports = {
  baggageMiddleware,
  getBaggage
};