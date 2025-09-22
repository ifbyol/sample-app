# Worker Service - Development Guide

## Overview

The Worker service is a background event processor built with Go that consumes Kafka events and persists data to PostgreSQL. It handles booking creation and cancellation events from the booking service, ensuring data consistency across the microservices architecture.

## Architecture & Structure

```
worker/
├── internal/
│   ├── config/          # Environment configuration
│   ├── database/        # PostgreSQL connection handling
│   ├── kafka/           # Kafka consumer implementation
│   ├── logger/          # Structured logging with context
│   ├── middleware/      # Baggage context handling
│   ├── models/          # Event data models
│   └── repository/      # Database operations
├── Dockerfile           # Multi-stage Docker build
├── go.mod              # Go module definition
└── main.go             # Application entry point
```

## Development Setup

### Prerequisites
- Go 1.24+
- Apache Kafka (when running locally)
- PostgreSQL (when running locally)

### Local Development Commands
```bash
# Build the application
go build -o worker .

# Run the application
./worker

# The worker runs as a background service processing events
```

### Environment Variables
Configure these environment variables:
- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_USER` - Database user (default: postgres)
- `DB_PASSWORD` - Database password (default: postgres)
- `DB_NAME` - Database name (default: booking_management)
- `KAFKA_BROKERS` - Comma-separated Kafka broker addresses (default: localhost:9092)

## Event Processing

### Booking Events
**Topic**: `booking-events`

**Event Structure**:
```json
{
  "userId": "user_123",
  "roomId": "room_ocean_001",
  "guests": 2,
  "startDate": "2025-01-15T15:00:00Z",
  "endDate": "2025-01-18T11:00:00Z",
  "bookingId": "booking_456",
  "paymentId": "pay_789"
}
```

**Processing Flow**:
1. Consumes event from `booking-events` topic
2. Resolves user ID from string identifier (ID, email, or username)
3. Resolves room ID from internal room identifier
4. Creates new booking record in PostgreSQL with status 'Accepted'
5. Logs success or detailed error information

### Cancellation Events
**Topic**: `booking-cancellations`

**Event Structure**:
```json
{
  "bookingId": "booking_456",
  "userId": "user_123",
  "timestamp": "2025-01-18T10:30:00Z"
}
```

**Processing Flow**:
1. Consumes event from `booking-cancellations` topic
2. Resolves user ID from string identifier
3. Updates booking status to 'Cancelled' for the specified booking and user
4. Prevents double-cancellation and unauthorized cancellations
5. Logs success or detailed error information

## Deployment

### Okteto
For deployment:
```bash
# Deploy to Okteto
okteto deploy --remote

# Development environment
okteto up
# Then inside container:
go build -o worker . && ./worker
```

## Database Integration

### Connection Management
- Database connections are managed through `internal/database`
- Connection pooling is handled by the `database/sql` package
- Uses the same PostgreSQL database as the booking-management service

### Repository Pattern
The service uses the repository pattern for database operations:

**BookingRepository Methods**:
- `CreateBooking(ctx, event)` - Creates new booking from event data
- `CancelBooking(ctx, event)` - Updates booking status to 'Cancelled'
- `getUserIDByIdentifier(ctx, identifier)` - Resolves user ID from string
- `getRoomIDByInternalID(ctx, internalID)` - Resolves room ID from internal identifier

### Database Operations
- Uses parameterized queries to prevent SQL injection
- Implements proper error handling and transaction safety
- Includes user and room validation before operations
- Updates timestamps for audit trails

## Kafka Consumer Implementation

### Consumer Configuration
- Uses IBM Sarama client library
- Configured for round-robin partition assignment
- Concurrent processing of multiple topics
- Automatic topic creation enabled

### Concurrent Processing
- Each topic is processed in separate goroutines
- Each partition within a topic has its own goroutine
- Graceful shutdown on context cancellation
- Error isolation between topics and partitions

### Consumer Groups
Currently configured as a single consumer (not using consumer groups). For production scale:
```go
// Future enhancement: Consumer group configuration
config.Consumer.Group.ID = "worker-group"
```

## Baggage Header Propagation

### Overview
The service implements comprehensive baggage header handling for distributed tracing:

### Incoming Events
- Extracts `Baggage` headers from Kafka message headers
- Stores baggage information in request context
- Context is available throughout event processing lifecycle

### Logging Integration
- All log messages automatically include baggage information
- Uses structured JSON logging with slog
- Example log entry:
```json
{
  "time": "2025-01-01T12:00:00Z",
  "level": "INFO",
  "msg": "Processing booking event",
  "bookingId": "booking_456",
  "baggage": "trace-id=abc123,span-id=def456"
}
```

### Context Usage in Handlers
Always use the event context for logging and database operations:
```go
func handleEvent(ctx context.Context, event Event) error {
    logger.Info(ctx, "Processing event", "eventId", event.ID)

    // Database operations automatically include baggage context
    return repo.ProcessEvent(ctx, event)
}
```

## Error Handling

### Event Processing Errors
- Comprehensive error logging with event context
- Non-fatal errors don't stop other event processing
- Database connection failures are logged and handled gracefully
- Invalid events are logged but don't crash the service

### Database Error Handling
```go
err := repo.CreateBooking(ctx, event)
if err != nil {
    logger.Error(ctx, "Failed to create booking",
        "bookingId", event.BookingID, "error", err)
    return err // Event will be marked as failed
}
```

### User and Room Resolution Errors
- Handles cases where users or rooms don't exist
- Provides detailed error messages for debugging
- Uses regex-based safe type casting for user ID resolution

## Logging Best Practices

### Context-Aware Logging
Always use the context-aware logger:
```go
import "worker/internal/logger"

// Good - includes baggage and event context
logger.Info(ctx, "Event processed successfully", "bookingId", event.BookingID)

// Avoid - loses context
log.Printf("Event processed")
```

### Log Levels
- `Info` - Normal event processing, successful operations
- `Error` - Processing failures, database errors
- `Warn` - Unusual but non-fatal situations
- `Debug` - Detailed debugging information (if needed)

### Structured Logging
Include relevant context in logs:
```go
logger.Info(ctx, "Booking created successfully",
    "bookingId", event.BookingID,
    "userId", event.UserID,
    "roomId", event.RoomID,
    "guests", event.Guests)
```

## Performance Considerations

### Kafka Consumer Performance
- Concurrent partition processing for high throughput
- Configurable consumer buffer sizes
- Offset management for reliable processing

### Database Connection Pooling
- Connection pooling is configured automatically
- Monitor connection usage in production
- Use appropriate timeouts for database operations

### Memory Management
- Events are processed and discarded immediately
- No in-memory event storage or caching
- Garbage collection friendly event processing

## Monitoring & Observability

### Event Processing Metrics
Monitor these key metrics:
- Events processed per topic
- Processing latency per event type
- Database operation success/failure rates
- Consumer lag per partition

### Health Monitoring
- Service starts up and connects to dependencies
- Logs connection status on startup
- Graceful shutdown on termination signals
- Monitor Kafka consumer group status

### Baggage Tracing
- Baggage headers enable request correlation across services
- Use consistent baggage formats across the microservices system
- Monitor baggage propagation in distributed traces

## Common Patterns

### Adding New Event Types
1. Define event model in `internal/models`
2. Add handler function with repository operations
3. Update Kafka consumer to include new topic
4. Add comprehensive logging and error handling

### Database Operations
1. Always use request context for operations
2. Log operations with relevant event details
3. Handle errors appropriately with detailed messages
4. Use parameterized queries for security

### Event Handler Pattern
```go
func createEventHandler(repo *repository.Repository) func(context.Context, models.Event) error {
    return func(ctx context.Context, event models.Event) error {
        logger.Info(ctx, "Processing event", "eventType", "example")

        err := repo.ProcessEvent(ctx, event)
        if err != nil {
            logger.Error(ctx, "Failed to process event", "error", err)
            return err
        }

        logger.Info(ctx, "Event processed successfully")
        return nil
    }
}
```

## Security Considerations

### Database Security
- Uses parameterized queries to prevent SQL injection
- Validates user ownership before booking operations
- No direct database credential exposure in logs

### Event Validation
- Validates event structure before processing
- Checks user and room existence before operations
- Prevents unauthorized booking cancellations

## Maintaining This Documentation

### When to Update CLAUDE.md

This documentation should be updated whenever making significant changes to the service:

**Always Update When:**
- Adding new event types or topics
- Changing database schema or operations
- Modifying Kafka consumer configuration
- Adding new environment variables
- Changing event processing logic
- Updating error handling patterns
- Adding new repository methods
- Modifying baggage handling
- Changing deployment procedures

**Consider Updating When:**
- Adding new internal packages
- Changing logging patterns
- Modifying performance optimizations
- Adding monitoring features
- Updating dependency versions

### Documentation Standards

- Keep event structure examples up-to-date
- Include both success and error scenarios
- Provide context for architectural decisions
- Update version numbers and dependencies
- Maintain consistent formatting

Remember: Good documentation enables reliable operation and maintenance of distributed event processing systems.