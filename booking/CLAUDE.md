# Booking Service - Development Guide

## Overview

The Booking service is a REST API built with Go and Kafka that handles hotel room bookings with integrated payment processing and event publishing. It features comprehensive logging, baggage header propagation for distributed tracing, payment service integration, and Kafka event publishing for booking lifecycle management.

## Architecture & Structure

```
booking/
├── internal/
│   ├── client/          # HTTP clients for external services
│   ├── config/          # Configuration management
│   ├── handlers/        # HTTP route handlers
│   ├── kafka/           # Kafka client and messaging
│   ├── logger/          # Structured logging with context
│   ├── middleware/      # HTTP middleware (baggage, etc.)
│   ├── models/          # Data models and structures
│   └── router/          # Route configuration
├── main.go              # Application entry point
├── go.mod               # Go module dependencies
├── go.sum               # Dependency checksums
└── Dockerfile           # Multi-stage Docker build
```

## Development Setup

### Prerequisites
- Go 1.24+
- Apache Kafka (for local development)
- Access to payments service

### Local Development Commands
```bash
# Install dependencies
go mod download

# Build the service
go build -o booking .

# Run the service
./booking

# Run with custom configuration
PORT=8081 KAFKA_BROKERS=localhost:9092 PAYMENT_SERVICE_URL=http://localhost:3000 ./booking
```

### Environment Variables
Configure these environment variables:
- `PORT` - Server port (default: 8081)
- `KAFKA_BROKERS` - Comma-separated Kafka broker addresses (default: localhost:9092)
- `PAYMENT_SERVICE_URL` - Payment service base URL (default: http://payments:3000)

## Deployment

### Okteto
For deployment and testing:
```bash
# Deploy to Okteto
okteto deploy --remote

# Development environment
okteto up
# Then inside container:
go build -o booking . && ./booking

# Build service image
okteto build booking
```

## API Endpoints

### Health Check
- `GET /health` - Service health check

**Response:**
```json
{
  "status": "healthy",
  "service": "booking-service",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

### Create Booking
- `POST /book` - Create new hotel room booking with payment processing

**Request:**
```json
{
  "paymentId": "pay_123456789",
  "creditCardNumber": "4532015112830366",
  "roomId": "room_deluxe_101",
  "userId": "user_john_doe",
  "guests": 2,
  "startDate": "2025-10-15T15:00:00Z",
  "endDate": "2025-10-18T11:00:00Z"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Booking completed successfully",
  "bookingId": "booking_1729123456_Abc123"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Payment processing failed"
}
```

### Cancel Booking
- `POST /cancel` - Cancel existing booking

**Request:**
```json
{
  "bookingId": "booking_1729123456_Abc123",
  "userId": "user_john_doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancellation completed successfully"
}
```

## Baggage Header Propagation

### Overview
The service implements comprehensive baggage header handling for distributed tracing across microservices:

### Incoming Requests
- All incoming HTTP requests are processed by `BaggageMiddleware`
- The `baggage` header is extracted and stored in the request context
- Baggage is available throughout the entire request lifecycle

### Logging Integration
- All log messages automatically include baggage information
- Uses structured JSON logging with Go's slog package
- Example log entry:
```json
{
  "time": "2025-01-01T12:00:00Z",
  "level": "INFO",
  "msg": "Processing booking request",
  "baggage": "trace-id=abc123,span-id=def456"
}
```

### Payment Service Integration
When making requests to the payment service, baggage headers are automatically propagated:
```go
// In payment client
if baggage := middleware.GetBaggageFromContext(ctx); baggage != "" {
    httpReq.Header.Set("Baggage", baggage)
}
```

### Context Usage in Handlers
Always use the request context for baggage-aware logging:
```go
ctx := r.Context()
logger.Info(ctx, "Processing booking request", "userId", req.UserID)
```

## Booking Processing Flow

### Payment Integration
The service integrates with the external payment service:
```go
paymentReq := models.PaymentRequest{
    PaymentID:       bookingReq.PaymentID,
    CreditCardNumber: bookingReq.CreditCardNumber,
}

paymentResp, err := bh.paymentClient.ProcessPayment(ctx, paymentReq)
```

### Booking Creation
1. **Validation**: Validates required fields, dates, and guest count
2. **Payment Processing**: Calls payment service with baggage propagation
3. **Event Publishing**: Publishes booking event to Kafka
4. **Response**: Returns booking confirmation with generated booking ID

### Error Handling
- `400` - Invalid input (missing fields, invalid dates, etc.)
- `402` - Payment processing failure
- `500` - Internal server errors (Kafka publishing failures)

## Kafka Integration

### Overview
The service uses Apache Kafka for event-driven architecture with KRaft mode (no Zookeeper required).

### Configuration
```go
// Kafka client configuration
config := sarama.NewConfig()
config.Producer.Return.Successes = true
config.Producer.RequiredAcks = sarama.WaitForAll
config.Producer.Retry.Max = 5
```

### Event Publishing

#### Booking Events
Published to `booking-events` topic:
```json
{
  "userId": "user_john_doe",
  "roomId": "room_deluxe_101",
  "guests": 2,
  "startDate": "2025-10-15T15:00:00Z",
  "endDate": "2025-10-18T11:00:00Z",
  "bookingId": "booking_1729123456_Abc123",
  "paymentId": "pay_123456789"
}
```

#### Cancellation Events
Published to `booking-cancellations` topic:
```json
{
  "bookingId": "booking_1729123456_Abc123",
  "userId": "user_john_doe",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

### Message Keys
- Booking events use `bookingId` as the message key
- Cancellation events use `bookingId` as the message key

## Data Models

### Booking Request
```go
type BookingRequest struct {
    PaymentID       string    `json:"paymentId"`
    CreditCardNumber string   `json:"creditCardNumber"`
    RoomID          string    `json:"roomId"`
    UserID          string    `json:"userId"`
    Guests          int       `json:"guests"`
    StartDate       time.Time `json:"startDate"`
    EndDate         time.Time `json:"endDate"`
}
```

### Payment Request
```go
type PaymentRequest struct {
    PaymentID       string `json:"paymentId"`
    CreditCardNumber string `json:"cardNumber"`
}
```

### Kafka Events
```go
type BookingEvent struct {
    UserID    string    `json:"userId"`
    RoomID    string    `json:"roomId"`
    Guests    int       `json:"guests"`
    StartDate time.Time `json:"startDate"`
    EndDate   time.Time `json:"endDate"`
    BookingID string    `json:"bookingId"`
    PaymentID string    `json:"paymentId"`
}

type CancellationEvent struct {
    BookingID string    `json:"bookingId"`
    UserID    string    `json:"userId"`
    Timestamp time.Time `json:"timestamp"`
}
```

## Logging Best Practices

### Context-Aware Logging
Always use the context-aware logger:
```go
// Good - includes baggage automatically
logger.Info(ctx, "Booking completed successfully", "bookingId", bookingID, "userId", userID)

// Avoid - loses baggage context
fmt.Println("Booking completed")
```

### Log Levels
- `Info` - Normal operations, request processing
- `Error` - Errors that need attention
- `Debug` - Detailed debugging information (not currently used)

### Structured Logging
Include relevant context in logs:
```go
logger.Info(ctx, "Processing payment", "paymentId", req.PaymentID)
logger.Error(ctx, "Failed to process payment", "error", err, "paymentId", req.PaymentID)
```

## Security Considerations

### Input Validation
```go
// Validate required fields
if bookingReq.PaymentID == "" || bookingReq.CreditCardNumber == "" || bookingReq.RoomID == "" || bookingReq.UserID == "" {
    logger.Error(ctx, "Missing required fields in booking request")
    http.Error(w, "Missing required fields", http.StatusBadRequest)
    return
}

// Validate dates
if bookingReq.StartDate.After(bookingReq.EndDate) || bookingReq.StartDate.Before(time.Now()) {
    logger.Error(ctx, "Invalid booking dates")
    http.Error(w, "Invalid booking dates", http.StatusBadRequest)
    return
}
```

### Payment Data Handling
- Credit card numbers are passed through to payment service
- No credit card data is logged or stored locally
- Payment processing is handled by external service

## Error Handling Patterns

### Validation Errors
```go
if !isValidInput(data) {
    logger.Error(ctx, "Invalid booking request", "error", validationErrors)
    http.Error(w, "Invalid request", http.StatusBadRequest)
    return
}
```

### Payment Service Errors
```go
paymentResp, err := bh.paymentClient.ProcessPayment(ctx, paymentReq)
if err != nil {
    logger.Error(ctx, "Failed to process payment", "error", err)
    response := models.BookingResponse{
        Success: false,
        Message: "Payment processing failed",
    }
    w.WriteHeader(http.StatusPaymentRequired)
    json.NewEncoder(w).Encode(response)
    return
}
```

### Kafka Publishing Errors
```go
if err := bh.kafkaClient.SendMessage(ctx, "booking-events", bookingID, bookingEvent); err != nil {
    logger.Error(ctx, "Failed to publish booking event to Kafka", "error", err)
    response := models.BookingResponse{
        Success: false,
        Message: "Booking event publishing failed",
    }
    w.WriteHeader(http.StatusInternalServerError)
    json.NewEncoder(w).Encode(response)
    return
}
```

## Performance Considerations

### HTTP Client Configuration
```go
httpClient: &http.Client{
    Timeout: 30 * time.Second,
}
```

### Kafka Producer Configuration
- Synchronous producer for reliability
- RequiredAcks = WaitForAll for data durability
- Retry.Max = 5 for resilience

## Common Patterns

### Adding New Endpoints
1. Create request/response models in `internal/models/`
2. Add handler method to `internal/handlers/`
3. Register route in `internal/router/router.go`
4. Include baggage propagation and structured logging
5. Add proper input validation and error handling

### External Service Integration
1. Create client in `internal/client/` package
2. Use context-aware HTTP requests with baggage propagation
3. Implement proper timeout and error handling
4. Include structured logging for requests and responses

### Kafka Event Publishing
1. Define event model in `internal/models/`
2. Use existing Kafka client for publishing
3. Choose appropriate topic name and message key
4. Handle publishing errors gracefully

## Dependencies

### Core Dependencies
- `github.com/gorilla/mux` - HTTP router
- `github.com/IBM/sarama` - Kafka client

### Key Features
- Modular package architecture
- Baggage header propagation
- Structured logging with context
- Payment service integration
- Kafka event publishing
- Input validation and error handling

## Maintaining This Documentation

### When to Update CLAUDE.md

This documentation should be updated whenever making significant changes to the service:

**Always Update When:**
- Adding new API endpoints or modifying existing ones
- Changing booking processing logic or payment integration
- Modifying environment variables or configuration
- Adding new Kafka topics or changing event structures
- Updating deployment procedures or Docker configuration
- Changing logging patterns or adding new log levels
- Modifying baggage handling or tracing behavior
- Adding new dependencies or changing Go version
- Updating security practices or data handling
- Modifying error handling patterns or HTTP status codes

**Consider Updating When:**
- Adding new utility functions or restructuring code
- Changing performance optimizations
- Adding new monitoring or observability features
- Updating validation rules
- Modifying external service endpoints

Remember: Good documentation is code that teaches and guides future developers. Keep it current, accurate, and helpful.