# BookingManagement

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