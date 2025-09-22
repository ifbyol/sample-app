# sample-app
This is a repository used to store a sample app with testing purposes

## Services

This microservices application consists of several independent services working together to provide a complete hotel booking management system:

### [Gateway](./gateway/README.md)
A reverse proxy service that acts as the single public entry point for all backend services built with Go and Gorilla Mux.

### [BookingManagement](./booking-management/README.md)
A REST API service for managing hotel bookings built with Go and PostgreSQL.

### [Payments](./payments/README.md)
A REST API service for processing payments with external service integration built with Node.js and Express.

### [Booking](./booking/README.md)
A REST API service for handling hotel room bookings with payment integration and event publishing built with Go and Kafka.

### [Worker](./worker/README.md)
A background service that processes Kafka events and persists data to PostgreSQL built with Go.

### [Admin](./admin/README.md)
A REST API service for hotel administration built with Node.js, Express.js and MySQL.

## Architecture Overview

The application follows a microservices architecture pattern with the following key components:

- **Gateway Service**: Single public entry point (port 8082) that proxies requests to all backend services
- **Database Layer**: PostgreSQL for booking data, MySQL for admin data
- **Message Queue**: Apache Kafka for event-driven communication between services
- **Service Discovery**: Docker-based service names for internal communication
- **Distributed Tracing**: Baggage header propagation across all services

## Quick Start

### Okteto Deployment
```bash
# Deploy entire application stack
okteto deploy --remote

# Or deploy individual services
okteto build <service-name>
```

## Service Communication

All external traffic flows through the Gateway service which routes requests to appropriate backend services:

```
Client -> Gateway (8082) -> Backend Services (private network)
                         -> Admin (3001)
                         -> Booking (8081)
                         -> BookingManagement (8080)
                         -> Payments (3000)
```

Background services communicate via Kafka:
```
Booking Service -> Kafka -> Worker Service -> Database
```

For detailed information about each service, click on the service name links above to access individual README files.