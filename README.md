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
