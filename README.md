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
- `GET /bookings` - List all bookings with payment information and status
- `POST /validate` - Validate booking data (room existence, dates, capacity, availability)

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
curl http://localhost:8080/rooms
curl http://localhost:8080/bookings
curl -H "Content-Type: application/json" -d '{"room_id":1,"number_of_guests":2,"start_date":"2025-01-15T00:00:00Z","end_date":"2025-01-18T00:00:00Z"}' http://localhost:8080/validate
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
# Run comprehensive test suite in Okteto environment
okteto test payments

# The test suite includes:
# - Unit tests for middleware, utilities, and routes (41 tests)
# - Integration tests for full application flow (13 tests)
# - Baggage header propagation validation
# - Payment processing and error handling scenarios
```

### Booking

A REST API service for handling hotel room bookings with payment integration and event publishing built with Go and Kafka.

**Features:**
- Hotel room booking with payment processing
- Booking cancellation
- Payment service integration
- Kafka event publishing
- Baggage header propagation

**Endpoints:**
- `GET /health` - Health check
- `POST /book` - Create new booking with payment processing
- `POST /cancel` - Cancel existing booking

**Technology Stack:**
- Go 1.24
- Apache Kafka (KRaft mode)
- IBM Sarama (Kafka client)
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
go build -o booking . && ./booking

# Access API endpoints from within the development container
curl http://localhost:8081/health
curl -H "Content-Type: application/json" -d '{"paymentId":"pay_123","creditCardNumber":"4532015112830366","roomId":"room_101","userId":"user_1","guests":2,"startDate":"2025-10-15T15:00:00Z","endDate":"2025-10-18T11:00:00Z"}' http://localhost:8081/book
curl -H "Content-Type: application/json" -d '{"bookingId":"booking_123","userId":"user_1"}' http://localhost:8081/cancel
```

**Kafka Integration:**
- Publishes booking events to `booking-events` topic
- Publishes cancellation events to `booking-cancellations` topic
- Uses Apache Kafka 4.1.0 with KRaft mode (no Zookeeper required)
