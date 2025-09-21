# BookingManagement Service - Development Guide

## Overview

The BookingManagement service is a REST API built with Go that handles hotel booking operations. It features comprehensive logging, baggage header propagation for distributed tracing, and PostgreSQL integration.

## Architecture & Structure

```
booking-management/
├── internal/
│   ├── config/          # Environment configuration
│   ├── database/        # PostgreSQL connection handling
│   ├── handlers/        # HTTP request handlers
│   ├── httpclient/      # HTTP client with baggage propagation
│   ├── logger/          # Structured logging with context
│   ├── middleware/      # HTTP middleware (baggage extraction)
│   ├── models/          # Data models (User, Room, Booking)
│   └── router/          # HTTP routing configuration
├── db/scripts/          # Database initialization scripts
├── Dockerfile           # Multi-stage Docker build
├── Makefile            # Build and development commands
└── main.go             # Application entry point
```

## Development Setup

### Prerequisites
- Go 1.24+
- PostgreSQL (when running locally)
- Docker & Docker Compose
- Make (optional, for convenience commands)

### Local Development Commands
```bash
# Build the application
make build

# Run the application
make start

# Development with auto-reload (requires devl)
make install-tools
make watch

# Clean build artifacts
make clean
```

### Environment Variables
Configure these environment variables:
- `PORT` - Server port (default: 8080)
- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_USER` - Database user (default: postgres)
- `DB_PASS` - Database password (default: postgres)
- `DB_NAME` - Database name (default: booking_management)

## Deployment

### Docker Compose (Root Level)
The service is deployed using docker-compose from the repository root:
```bash
# Deploy all services
docker-compose up --build

# Deploy in background
docker-compose up -d --build
```

### Okteto Cloud
For cloud deployment:
```bash
# Deploy to Okteto
okteto deploy --remote

# Development environment
okteto up
# Then inside container:
make build && make start
```

## API Endpoints

- `GET /healthz` - Health check endpoint
- `GET /users` - List all users
- `GET /rooms` - List all rooms
- `GET /bookings` - List all bookings

## Baggage Header Propagation

### Overview
The service implements comprehensive baggage header handling for distributed tracing:

### Incoming Requests
- All incoming HTTP requests are processed by `BaggageMiddleware`
- The `baggage` header is extracted and stored in the request context
- Context is available throughout the entire request lifecycle

### Logging Integration
- All log messages automatically include baggage information
- Uses structured JSON logging with slog
- Example log entry:
```json
{
  "time": "2024-01-01T12:00:00Z",
  "level": "INFO",
  "msg": "Fetching users",
  "baggage": "trace-id=abc123,span-id=def456"
}
```

### HTTP Client Usage
When making outbound HTTP requests, use the provided HTTP client:
```go
import "booking-management/internal/httpclient"

client := httpclient.NewClient()
resp, err := client.Get(ctx, "http://external-service/api")
```

The client automatically propagates the baggage header to downstream services.

### Context Usage in Handlers
Always use the request context for logging:
```go
func (h *Handler) MyEndpoint(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    logger.Info(ctx, "Processing request")

    // Database operations, HTTP calls, etc.
    // All will include baggage in logs
}
```

## Database Considerations

### Connection Management
- Database connections are managed through `internal/database`
- Connection pooling is handled by the `database/sql` package
- Always close rows and handle errors properly

### Migrations
- Database schema is initialized via `db/scripts/init.sql`
- Script includes table creation and sample data
- Runs automatically in Docker containers

### Query Patterns
- Use parameterized queries to prevent SQL injection
- Always handle database errors and log them with context
- Close database resources (rows, statements) properly

## Logging Best Practices

### Context-Aware Logging
Always use the context-aware logger:
```go
import "booking-management/internal/logger"

// Good - includes baggage automatically
logger.Info(ctx, "Operation completed", "count", len(items))

// Avoid - loses baggage context
log.Printf("Operation completed")
```

### Log Levels
- `Info` - Normal operations, request processing
- `Error` - Errors that need attention
- `Warn` - Unusual but non-fatal situations
- `Debug` - Detailed debugging information

### Structured Logging
Include relevant context in logs:
```go
logger.Info(ctx, "Database query completed",
    "table", "users",
    "count", userCount,
    "duration_ms", elapsed.Milliseconds())
```

## Error Handling

### HTTP Error Responses
- Use appropriate HTTP status codes
- Log errors with context before returning HTTP errors
- Provide meaningful error messages to clients

### Database Error Handling
```go
rows, err := db.Query(query)
if err != nil {
    logger.Error(ctx, "Database query failed", "error", err, "query", query)
    http.Error(w, "Internal server error", http.StatusInternalServerError)
    return
}
defer rows.Close()
```

## Testing Considerations

### Baggage Header Testing
Test endpoints with baggage headers:
```bash
curl -H "baggage: trace-id=test123" http://localhost:8080/users
```

### Database Testing
- Use test database or Docker containers for testing
- Ensure proper cleanup between tests
- Test both success and error scenarios

## Performance Considerations

### Database Connections
- Connection pooling is configured automatically
- Monitor connection usage in production
- Use appropriate timeouts

### Logging Performance
- Structured logging is efficient but avoid excessive log entries
- Use appropriate log levels to control verbosity
- Consider log sampling for high-traffic scenarios

## Security Notes

### Database Security
- Never commit database credentials to version control
- Use environment variables for configuration
- Implement proper connection encryption in production

### Input Validation
- Validate all input parameters
- Use parameterized queries
- Sanitize user inputs appropriately

## Monitoring & Observability

### Health Checks
- Use `/healthz` endpoint for health monitoring
- Add database connectivity checks if needed
- Monitor response times and error rates

### Baggage Tracing
- Baggage headers enable request correlation across services
- Use consistent baggage formats across your system
- Monitor baggage propagation in distributed systems

## Common Patterns

### Adding New Endpoints
1. Create handler function with context-aware logging
2. Add route to router configuration
3. Include proper error handling and logging
4. Test baggage propagation

### Database Operations
1. Always use request context
2. Log operations with relevant details
3. Handle errors appropriately
4. Close resources properly

### HTTP Client Usage
1. Use the provided httpclient for outbound requests
2. Pass request context to maintain baggage propagation
3. Log external service calls with context

## Maintaining This Documentation

### When to Update CLAUDE.md

This documentation should be updated whenever making significant changes to the service:

**Always Update When:**
- Adding new API endpoints or modifying existing ones
- Changing database schema or adding new tables
- Modifying environment variables or configuration
- Adding new middleware or changing request handling
- Updating deployment procedures or Docker configuration
- Changing logging patterns or adding new log levels
- Modifying baggage handling or tracing behavior
- Adding new dependencies or changing Go version
- Updating security practices or authentication methods

**Consider Updating When:**
- Adding new internal packages or restructuring code
- Changing error handling patterns
- Adding new testing approaches
- Modifying performance optimizations
- Adding monitoring or observability features

### How to Update

1. **Review Changes** - Before committing code changes, review this document
2. **Update Relevant Sections** - Modify sections affected by your changes
3. **Add Examples** - Include code examples for new patterns or features
4. **Update Architecture Diagrams** - If structure changes significantly
5. **Test Instructions** - Verify all examples and commands work correctly
6. **Commit Together** - Include CLAUDE.md updates in the same commit as code changes

### Documentation Standards

- Keep examples up-to-date and functional
- Use clear, concise language
- Include both what to do and what to avoid
- Provide context for why patterns are recommended
- Update version numbers and dependencies
- Maintain consistent formatting and structure

**Template for Adding New Features:**
```markdown
## New Feature Name

### Overview
Brief description of what the feature does.

### Usage
Code examples showing how to use the feature.

### Considerations
Important things to remember when using this feature.
```

Remember: Good documentation is code that teaches and guides future developers (including yourself).