# Gateway Service - Development Guide

## Overview

The Gateway service is a reverse proxy built with Go that acts as the single public entry point for all backend microservices. It provides centralized routing, request forwarding, and baggage header propagation while keeping all backend services private within the Docker network.

## Architecture & Structure

```
gateway/
├── internal/
│   ├── client/          # HTTP clients for service communication
│   ├── config/          # Configuration management
│   ├── handlers/        # HTTP route handlers and proxy logic
│   ├── logger/          # Structured logging with context
│   ├── middleware/      # HTTP middleware (baggage, etc.)
│   └── router/          # Route configuration and proxy setup
├── main.go              # Application entry point
├── go.mod               # Go module dependencies
├── go.sum               # Dependency checksums
└── Dockerfile           # Multi-stage Docker build
```

## Development Setup

### Prerequisites
- Go 1.24+
- Access to backend services (admin, booking, booking-management)

### Local Development Commands
```bash
# Install dependencies
go mod download

# Build the service
go build -o gateway .

# Run the service
./gateway

# Run with custom configuration
PORT=8082 ADMIN_SERVICE_URL=http://localhost:3001 BOOKING_SERVICE_URL=http://localhost:8081 BOOKING_MANAGEMENT_SERVICE_URL=http://localhost:8080 ./gateway
```

### Environment Variables
Configure these environment variables:
- `PORT` - Server port (default: 8082)
- `ADMIN_SERVICE_URL` - Admin service base URL (default: http://admin:3001)
- `BOOKING_SERVICE_URL` - Booking service base URL (default: http://booking:8081)
- `BOOKING_MANAGEMENT_SERVICE_URL` - Booking-management service base URL (default: http://booking-management:8080)

## Deployment

### Okteto
For deployment and testing:
```bash
# Deploy to Okteto
okteto deploy --remote

# Development environment
okteto up
# Then inside container:
go build -o gateway . && ./gateway

# Build service image
okteto build gateway
```

## API Gateway Endpoints

### Gateway-Specific Routes
- `GET /` - Gateway service information and status
- `GET /healthz` - Gateway health check

### Admin Service Proxy Routes
All admin service endpoints are proxied through `/admin/*`:
- `GET /admin` - Admin service root page
- `GET /admin/` - Admin service root page (alternative)
- `GET /admin/health` - Admin service health check
- `GET /admin/employee` - Retrieve all employees
- `POST /admin/employee` - Create new employee
- `GET /admin/complaint` - Retrieve all complaints
- `POST /admin/complaint` - Create new complaint

### Booking Service Proxy Routes
All booking service endpoints are proxied through `/booking/*`:
- `GET /booking/health` - Booking service health check
- `POST /booking/book` - Create new booking with payment processing
- `POST /booking/cancel` - Cancel existing booking

### Booking-Management Service Proxy Routes
All booking-management endpoints are proxied through `/booking-management/*`:
- `GET /booking-management/healthz` - Service health check
- `GET /booking-management/users` - List all users
- `GET /booking-management/rooms` - List all rooms
- `GET /booking-management/bookings` - List all bookings
- `POST /booking-management/validate` - Validate booking data

## Reverse Proxy Implementation

### HTTP Client Configuration
```go
type HTTPClient struct {
    client *http.Client
}

func NewHTTPClient() *HTTPClient {
    return &HTTPClient{
        client: &http.Client{
            Timeout: 30 * time.Second,
        },
    }
}
```

### Proxy Request Flow
1. **Request Reception**: Gateway receives client request
2. **Route Matching**: Gorilla Mux matches request to appropriate proxy handler
3. **Header Processing**: Extract and filter headers, preserving baggage
4. **Service Routing**: Forward request to target backend service
5. **Response Processing**: Stream response back to client with headers
6. **Logging**: Log request/response with baggage context

### Generic Proxy Method
```go
func (p *ProxyHandler) proxyToService(w http.ResponseWriter, r *http.Request, serviceURL, path string) {
    ctx := r.Context()

    // Read request body
    body, err := io.ReadAll(r.Body)

    // Extract headers (skip hop-by-hop headers)
    headers := make(map[string]string)
    for key, values := range r.Header {
        if !p.isHopByHopHeader(key) {
            headers[key] = values[0]
        }
    }

    // Make proxied request
    targetURL := serviceURL + path
    resp, err := p.httpClient.ProxyRequest(ctx, r.Method, targetURL, body, headers)

    // Stream response back to client
    // Copy headers, status code, and body
}
```

### Header Filtering
The gateway filters out hop-by-hop headers that should not be forwarded:
- Connection
- Keep-Alive
- Proxy-Authenticate
- Proxy-Authorization
- Te
- Trailers
- Transfer-Encoding
- Upgrade

## Baggage Header Propagation

### Overview
The gateway implements comprehensive baggage header handling for distributed tracing across all backend services.

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
  "msg": "Proxying request",
  "method": "POST",
  "path": "/book",
  "service": "http://booking:8081",
  "baggage": "trace-id=abc123,span-id=def456"
}
```

### Backend Service Integration
When making requests to backend services, baggage headers are automatically propagated:
```go
// In HTTP client
if baggage := middleware.GetBaggageFromContext(ctx); baggage != "" {
    req.Header.Set("Baggage", baggage)
}
```

### Context Usage in Handlers
Always use the request context for baggage-aware logging:
```go
ctx := r.Context()
logger.Info(ctx, "Proxying request", "method", r.Method, "path", path, "service", serviceURL)
```

## Configuration Management

### Config Structure
```go
type Config struct {
    Port                       string
    AdminServiceURL           string
    BookingServiceURL         string
    BookingManagementServiceURL string
}
```

### Environment Variable Loading
```go
func Load() *Config {
    return &Config{
        Port:                       getEnv("PORT", "8082"),
        AdminServiceURL:           getEnv("ADMIN_SERVICE_URL", "http://admin:3001"),
        BookingServiceURL:         getEnv("BOOKING_SERVICE_URL", "http://booking:8081"),
        BookingManagementServiceURL: getEnv("BOOKING_MANAGEMENT_SERVICE_URL", "http://booking-management:8080"),
    }
}
```

## CORS Support

### CORS Middleware
```go
func EnableCORS(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, baggage, Baggage")

        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }

        next.ServeHTTP(w, r)
    })
}
```

## Error Handling Patterns

### Service Unavailable
```go
if err := p.httpClient.ProxyRequest(ctx, r.Method, targetURL, body, headers); err != nil {
    logger.Error(ctx, "Failed to proxy request", "error", err, "service", serviceURL)
    http.Error(w, "Service temporarily unavailable", http.StatusServiceUnavailable)
    return
}
```

### Request Body Processing
```go
body, err := io.ReadAll(r.Body)
if err != nil {
    logger.Error(ctx, "Failed to read request body", "error", err)
    http.Error(w, "Failed to read request body", http.StatusBadRequest)
    return
}
defer r.Body.Close()
```

### Response Streaming
```go
_, err = io.Copy(w, resp.Body)
if err != nil {
    logger.Error(ctx, "Failed to copy response body", "error", err)
    return
}
```

## Logging Best Practices

### Context-Aware Logging
Always use the context-aware logger:
```go
// Good - includes baggage automatically
logger.Info(ctx, "Request proxied successfully", "status", resp.StatusCode, "service", serviceURL)

// Avoid - loses baggage context
fmt.Println("Request completed")
```

### Log Levels
- `Info` - Normal operations, request processing, proxy success
- `Error` - Errors that need attention (service unavailable, body read failures)

### Structured Logging
Include relevant context in logs:
```go
logger.Info(ctx, "Proxying request", "method", r.Method, "path", path, "service", serviceURL)
logger.Error(ctx, "Failed to proxy request", "error", err, "service", serviceURL)
```

## Security Considerations

### Header Security
- Filters out hop-by-hop headers that could cause security issues
- Preserves authentication and authorization headers for backend services
- Maintains baggage headers for distributed tracing

### Request Validation
- No direct input validation (delegated to backend services)
- Request body size limits handled by HTTP server configuration
- Backend services maintain their own input validation

### Network Security
- All backend services are private within Docker network
- Only gateway service is publicly accessible
- Simplified firewall rules with single ingress point

## Performance Considerations

### HTTP Client Configuration
```go
httpClient: &http.Client{
    Timeout: 30 * time.Second,
}
```

### Request Streaming
- Uses `io.Copy` for efficient response body streaming
- Minimal memory usage for large payloads
- No request/response buffering

### Connection Management
- HTTP client reuses connections for backend services
- Automatic connection pooling and Keep-Alive support

## Architecture Benefits

### Single Entry Point
- Only gateway service needs public network access
- Simplified DNS and load balancer configuration
- Centralized SSL termination point

### Service Discovery
- Backend services communicate using Docker service names
- No need for external service discovery mechanisms
- Configuration-based routing

### Monitoring & Observability
- Centralized request logging for all backend services
- Baggage header propagation enables distributed tracing
- Single point for metrics collection and monitoring

## Common Patterns

### Adding New Backend Services
1. Add service URL to `Config` struct in `internal/config/config.go`
2. Create proxy handler methods in `internal/handlers/proxy.go`
3. Register routes in `internal/router/router.go`
4. Update environment variables in docker-compose.yml
5. Add dependency in gateway service configuration

### Adding New Proxy Routes
1. Identify target backend service and endpoint
2. Create proxy handler method following naming convention
3. Register route with appropriate HTTP methods
4. Include baggage propagation and structured logging
5. Test with identical input/output as original endpoint

### Backend Service Integration
1. Ensure backend service follows baggage header conventions
2. Use Docker service names for internal communication
3. Implement proper timeout and error handling
4. Include structured logging for requests and responses

## Dependencies

### Core Dependencies
- `github.com/gorilla/mux` - HTTP router and URL matching
- Standard library `net/http` - HTTP client and server

### Key Features
- Modular package architecture
- Reverse proxy implementation
- Baggage header propagation
- Structured logging with context
- CORS middleware
- Request/response streaming
- Backend service routing

## Maintaining This Documentation

### When to Update CLAUDE.md

This documentation should be updated whenever making significant changes to the gateway service:

**Always Update When:**
- Adding new backend services or proxy routes
- Changing service URLs or configuration variables
- Modifying proxy logic or request handling
- Updating environment variables or Docker configuration
- Changing logging patterns or adding new log levels
- Modifying baggage handling or tracing behavior
- Adding new dependencies or changing Go version
- Updating security practices or header filtering
- Modifying error handling patterns or HTTP status codes
- Changing CORS configuration or middleware behavior

**Consider Updating When:**
- Adding new utility functions or restructuring code
- Changing performance optimizations or timeout values
- Adding new monitoring or observability features
- Updating backend service integration patterns
- Modifying Docker or Okteto deployment procedures

Remember: Good documentation is code that teaches and guides future developers working with microservices architecture. Keep it current, accurate, and comprehensive.