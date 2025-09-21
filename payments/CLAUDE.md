# Payments Service - Development Guide

## Overview

The Payments service is a REST API built with Node.js and Express that handles payment processing operations. It features comprehensive logging, baggage header propagation for distributed tracing, external service integration, and a complete test suite.

## Architecture & Structure

```
payments/
├── src/
│   ├── middleware/       # HTTP middleware (baggage extraction, logging)
│   ├── routes/          # HTTP route handlers
│   ├── utils/           # Utilities (logger, HTTP client)
│   └── index.js         # Application entry point
├── tests/
│   ├── integration/     # Full application flow tests
│   ├── unit/           # Unit tests for individual components
│   └── utils/          # Test setup and utilities
├── jest.config.js      # Jest testing configuration
├── Dockerfile          # Multi-stage Docker build
├── package.json        # Dependencies and scripts
└── .stignore          # Syncthing ignore rules
```

## Development Setup

### Prerequisites
- Node.js 20+
- npm or yarn

### Local Development Commands
```bash
# Install dependencies
npm install

# Start the service in development mode
npm run dev

# Start the service in production mode
npm start

# Run test suite
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Environment Variables
Configure these environment variables:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production/test)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)

## Deployment

### Okteto
For deployment and testing:
```bash
# Deploy to Okteto
okteto deploy --remote

# Development environment
okteto up
# Then inside container:
npm install && npm start

# Run tests in Okteto
okteto test payments
```

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /process-payment` - Process payment with card details
- `GET /` - Service information and available endpoints

### Payment Processing Example
```bash
curl -X POST http://localhost:3000/process-payment \
  -H "Content-Type: application/json" \
  -H "baggage: trace-id=payment123" \
  -d '{
    "paymentId": "pay_test123",
    "cardNumber": "4242424242424242"
  }'
```

## Baggage Header Propagation

### Overview
The service implements comprehensive baggage header handling for distributed tracing across microservices:

### Incoming Requests
- All incoming HTTP requests are processed by `baggageMiddleware`
- The `baggage` header is extracted and stored in the request object
- Baggage is available throughout the entire request lifecycle

### Logging Integration
- All log messages automatically include baggage information
- Uses structured JSON logging with Winston
- Example log entry:
```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "level": "info",
  "message": "Payment processing started",
  "paymentId": "pay_123",
  "baggage": "trace-id=abc123,span-id=def456"
}
```

### HTTP Client Usage
When making outbound HTTP requests, use the provided HTTP client:
```javascript
const { createHttpClient } = require('./utils/httpClient');

// Client automatically propagates baggage headers
const client = createHttpClient(req);
const response = await client.post('http://external-service/api', data);
```

### Context Usage in Routes
Always use the request object for baggage-aware logging:
```javascript
const { createContextLogger } = require('../utils/logger');

app.post('/process-payment', (req, res) => {
  const log = createContextLogger(req);
  log.info('Payment processing started', { paymentId: req.body.paymentId });

  // All operations include baggage context
});
```

## Testing Framework

### Test Structure
The service includes comprehensive test coverage:
- **Unit Tests (41 tests)**: Individual component testing
- **Integration Tests (13 tests)**: Full application flow testing
- **Total Coverage**: 54 tests across 5 test suites

### Test Categories

#### Unit Tests
- `tests/unit/middleware/baggage.test.js` - Baggage middleware functionality
- `tests/unit/utils/logger.test.js` - Context-aware logging
- `tests/unit/utils/httpClient.test.js` - HTTP client with baggage propagation
- `tests/unit/routes/payments.test.js` - Payment route handlers

#### Integration Tests
- `tests/integration/app.test.js` - Full application testing with real HTTP calls

### Running Tests
```bash
# Run all tests locally
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch

# Run tests in Okteto environment
okteto test payments
```

### Test Patterns
```javascript
// Testing with baggage headers
await request(app)
  .post('/process-payment')
  .set('baggage', 'trace-id=test123')
  .send(paymentData)
  .expect(200);

// Mocking external services
jest.mock('../src/utils/httpClient');
simulateStripePayment.mockResolvedValue({
  success: true,
  transactionId: 'txn_123'
});
```

## Payment Processing Flow

### External Service Integration
The service simulates integration with external payment providers (like Stripe):
```javascript
const result = await simulateStripePayment(req, paymentId, cardNumber);
if (result.success) {
  // Handle successful payment
} else {
  // Handle payment failure
}
```

### Card Number Security
- Card numbers are masked in all logs and external requests
- Format: `************4242` (shows last 4 digits)
- Never log full card numbers in any circumstances

### Error Handling
- `400` - Invalid input (missing fields, invalid card format)
- `422` - Payment processing failure (card declined, etc.)
- `500` - Internal server errors

## Logging Best Practices

### Context-Aware Logging
Always use the context-aware logger:
```javascript
const { createContextLogger } = require('./utils/logger');

// Good - includes baggage automatically
const log = createContextLogger(req);
log.info('Payment processed', { paymentId, amount });

// Avoid - loses baggage context
console.log('Payment processed');
```

### Log Levels
- `info` - Normal operations, request processing
- `error` - Errors that need attention
- `warn` - Unusual but non-fatal situations
- `debug` - Detailed debugging information

### Structured Logging
Include relevant context in logs:
```javascript
log.info('Calling external payment service', {
  paymentId,
  service: 'stripe-simulation',
  cardNumberMask: '************' + cardNumber.slice(-4)
});
```

## Security Considerations

### Card Data Protection
- Never log full card numbers
- Always mask sensitive data in logs and external requests
- Validate card number format before processing
- Use secure transmission for payment data

### Input Validation
```javascript
// Validate required fields
if (!paymentId || !cardNumber) {
  return res.status(400).json({
    success: false,
    error: 'Missing required fields: paymentId and cardNumber are required'
  });
}

// Validate card number format
const cardNumberRegex = /^\d{13,19}$/;
if (!cardNumberRegex.test(cardNumber.replace(/\s/g, ''))) {
  return res.status(400).json({
    success: false,
    error: 'Invalid card number format'
  });
}
```

### Environment Variables
- Never commit secrets or API keys to version control
- Use environment variables for sensitive configuration
- Different configurations for development/production/test

## Error Handling Patterns

### Validation Errors
```javascript
if (!isValidInput(data)) {
  log.error('Invalid payment request', { errors: validationErrors });
  return res.status(400).json({
    success: false,
    error: 'Validation failed'
  });
}
```

### External Service Errors
```javascript
try {
  const result = await externalService.process(data);
  if (!result.success) {
    log.error('Payment processing failed', {
      paymentId,
      error: result.error
    });
    return res.status(422).json({
      success: false,
      paymentId,
      error: result.error,
      status: 'failed'
    });
  }
} catch (error) {
  log.error('Unexpected error during payment processing', {
    paymentId,
    error: error.message
  });
  return res.status(500).json({
    success: false,
    paymentId,
    error: 'Internal server error during payment processing'
  });
}
```

## Middleware Usage

### Request Logging Middleware
```javascript
// Logs all incoming requests with baggage context
app.use((req, res, next) => {
  const log = createContextLogger(req);
  log.info('Incoming request', {
    method: req.method,
    url: req.url,
    contentType: req.get('content-type')
  });
  next();
});
```

### Baggage Middleware
```javascript
// Extracts and stores baggage header
const { baggageMiddleware } = require('./middleware/baggage');
app.use(baggageMiddleware);
```

## Performance Considerations

### HTTP Client Configuration
- 10-second timeout for external requests
- Proper error handling for network issues
- Connection reuse for efficiency

### Logging Performance
- Structured logging is efficient but avoid excessive entries
- Use appropriate log levels
- Consider log sampling for high-traffic scenarios

### Testing Performance
- Tests run in under 2 seconds locally
- Parallel test execution with Jest
- Proper test isolation and cleanup

## Monitoring & Observability

### Health Checks
```javascript
app.get('/health', (req, res) => {
  const log = createContextLogger(req);
  log.info('Health check requested');

  res.json({
    status: 'healthy',
    service: 'payments-service',
    timestamp: new Date().toISOString()
  });

  log.info('Health check completed successfully');
});
```

### Baggage Tracing
- Baggage headers enable request correlation across services
- Consistent baggage format: `trace-id=abc123,span-id=def456`
- Monitor baggage propagation in distributed systems

### Test Monitoring
- 54 total tests with comprehensive coverage
- Integration tests validate end-to-end functionality
- Okteto testing for environment validation

## Common Patterns

### Adding New Endpoints
1. Create route handler with context-aware logging
2. Add input validation and error handling
3. Include baggage propagation for external calls
4. Write unit and integration tests
5. Update API documentation

### External Service Integration
1. Use the provided HTTP client for baggage propagation
2. Implement proper error handling and timeouts
3. Log service calls with masked sensitive data
4. Test both success and failure scenarios

### Database Operations (Future)
If adding database functionality:
1. Always use request context for logging
2. Implement connection pooling
3. Use parameterized queries
4. Handle errors gracefully with proper logging

## Maintaining This Documentation

### When to Update CLAUDE.md

This documentation should be updated whenever making significant changes to the service:

**Always Update When:**
- Adding new API endpoints or modifying existing ones
- Changing payment processing logic or external integrations
- Modifying environment variables or configuration
- Adding new middleware or changing request handling
- Updating deployment procedures or Docker configuration
- Changing logging patterns or adding new log levels
- Modifying baggage handling or tracing behavior
- Adding new dependencies or changing Node.js version
- Updating security practices or payment data handling
- Adding new test categories or changing test framework
- Modifying error handling patterns or HTTP status codes

**Consider Updating When:**
- Adding new utility functions or restructuring code
- Changing performance optimizations
- Adding new monitoring or observability features
- Updating card validation rules
- Modifying external service endpoints

### How to Update

1. **Review Changes** - Before committing code changes, review this document
2. **Update Relevant Sections** - Modify sections affected by your changes
3. **Add Examples** - Include code examples for new patterns or features
4. **Update Test Information** - Keep test counts and categories current
5. **Test Instructions** - Verify all examples and commands work correctly
6. **Commit Together** - Include CLAUDE.md updates in the same commit as code changes

### Documentation Standards

- Keep examples up-to-date and functional
- Use clear, concise language
- Include both what to do and what to avoid
- Provide context for why patterns are recommended
- Update dependency versions and Node.js requirements
- Maintain consistent formatting and structure
- Include security considerations for all examples

**Template for Adding New Features:**
```markdown
## New Feature Name

### Overview
Brief description of what the feature does and why it's needed.

### Usage
Code examples showing how to use the feature properly.

### Testing
How to test the new feature, including test examples.

### Security Considerations
Any security implications or best practices.

### Error Handling
How errors are handled and what responses to expect.
```

**Template for New API Endpoints:**
```markdown
### POST /new-endpoint

**Purpose**: Brief description of endpoint functionality

**Request Format**:
```javascript
{
  "field1": "value",
  "field2": "value"
}
```

**Response Format**:
```javascript
{
  "success": true,
  "data": "response_data"
}
```

**Error Responses**:
- `400` - Invalid input
- `500` - Internal server error

**Testing Example**:
```javascript
await request(app)
  .post('/new-endpoint')
  .set('baggage', 'trace-id=test')
  .send(testData)
  .expect(200);
```
```

Remember: Good documentation is code that teaches and guides future developers (including yourself). Keep it current, accurate, and helpful.