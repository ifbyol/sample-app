# Payments

A REST API service for processing payments with external service integration built with Node.js and Express.

**Features:**
- Payment processing simulation
- External service integration (Stripe-like)
- Baggage header propagation
- Structured logging

**Endpoints:**
- `GET /health` - Health check
- `POST /process-payment` - Process payment with card details
- `GET /` - Service information

**Technology Stack:**
- Node.js 20
- Express.js
- Winston (logging)
- Axios (HTTP client)
- Okteto

**Okteto Deployment:**
```bash
okteto deploy --remote
```

**Development with Okteto:**
```bash
# Start development environment with live sync
okteto up

# Once inside the development container, install dependencies and start
npm install && npm start

# Access API endpoints from within the development container
curl http://localhost:3000/health
curl -H "Content-Type: application/json" -d '{"paymentId":"pay_123","cardNumber":"4242424242424242"}' http://localhost:3000/process-payment
```

**Testing with Okteto:**
```bash
# Run comprehensive test suite in Okteto environment
okteto test payments

# The test suite includes:
# - Unit tests for middleware, utilities, and routes (41 tests)
# - Integration tests for full application flow (13 tests)
# - Baggage header propagation validation
# - Payment processing and error handling scenarios
```