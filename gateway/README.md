# Gateway

A reverse proxy service that acts as the single public entry point for all backend services built with Go and Gorilla Mux.

**Features:**
- Reverse proxy for all backend services (admin, booking, booking-management)
- Baggage header propagation for distributed tracing
- CORS support for web client integration
- Health monitoring and service status
- Request/response passthrough with identical API contracts

**Public Endpoints:**
All backend service endpoints are exposed through the gateway with identical input/output:

**Admin Service Routes:**
- `GET /admin` - Admin service root
- `GET /admin/health` - Admin service health check
- `GET /admin/employee` - Retrieve all employees
- `POST /admin/employee` - Create new employee
- `GET /admin/complaint` - Retrieve all complaints
- `POST /admin/complaint` - Create new complaint

**Booking Service Routes:**
- `GET /booking/health` - Booking service health check
- `POST /booking/book` - Create new booking with payment processing
- `POST /booking/cancel` - Cancel existing booking

**Booking-Management Service Routes:**
- `GET /booking-management/healthz` - Booking-management health check
- `GET /booking-management/users` - List all users
- `GET /booking-management/rooms` - List all rooms
- `GET /booking-management/bookings` - List all bookings
- `POST /booking-management/validate` - Validate booking data

**Gateway-Specific Routes:**
- `GET /` - Gateway service information
- `GET /healthz` - Gateway health check

**Technology Stack:**
- Go 1.24
- Gorilla Mux router
- HTTP reverse proxy
- Context-aware logging
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
go build -o gateway . && ./gateway

# Access all backend services through the gateway
curl http://localhost:8082/healthz
curl http://localhost:8082/admin/health
curl http://localhost:8082/booking/health
curl http://localhost:8082/booking-management/healthz

# All original API calls work through the gateway
curl -H "Content-Type: application/json" -d '{"paymentId":"pay_123","creditCardNumber":"4532015112830366","roomId":"room_101","userId":"user_1","guests":2,"startDate":"2025-10-15T15:00:00Z","endDate":"2025-10-18T11:00:00Z"}' http://localhost:8082/booking/book
```

**Architecture Benefits:**
- **Single Entry Point**: Only the gateway (port 8082) is publicly accessible
- **Service Privacy**: All backend services are private within the Docker network
- **Load Balancing Ready**: Centralized routing enables easy load balancer integration
- **Security**: Simplified firewall rules with single ingress point
- **Monitoring**: Centralized request logging and metrics collection