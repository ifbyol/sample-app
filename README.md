# sample-app
This is a repository used to store a sample app with testing purposes

## Services

### BookingManagement

A REST API service for managing hotel bookings built with Go and PostgreSQL.

**Features:**
- User management
- Room inventory
- Booking system
- Health monitoring

**Endpoints:**
- `GET /healthz` - Health check
- `GET /users` - List all users
- `GET /rooms` - List all rooms
- `GET /bookings` - List all bookings

**Technology Stack:**
- Go 1.24
- PostgreSQL
- Gorilla Mux router
- Okteto

**Okteto Deployment:**
```bash
okteto deploy --remote
```

**Development with Okteto:**
```bash
# Start development environment with live sync
okteto up

# Once inside the development container, build and start the service
make build && make start

# Access API endpoints from within the development container
curl http://localhost:8080/healthz
curl http://localhost:8080/users
```

The service includes a complete database schema with sample data for testing purposes.

### Payments

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
# Run comprehensive test suite in Okteto cloud environment
okteto test payments

# The test suite includes:
# - Unit tests for middleware, utilities, and routes (41 tests)
# - Integration tests for full application flow (13 tests)
# - Baggage header propagation validation
# - Payment processing and error handling scenarios
```
