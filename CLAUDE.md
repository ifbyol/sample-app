# Sample App - Development Guide

## Overview

This repository contains a comprehensive microservices-based hotel booking management system built with multiple technologies including Go, Node.js, Apache Kafka, PostgreSQL, and MySQL. The system demonstrates event-driven architecture, distributed tracing, and modern container orchestration patterns.

## Architecture

The application consists of five main services working together to provide a complete hotel booking and management solution:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Booking Mgmt   │    │    Payments     │    │    Booking      │
│  (Go/PostgreSQL)│    │ (Node.js/HTTP)  │    │ (Go/Kafka)      │
│  Port: 8080     │    │  Port: 3000     │    │  Port: 8081     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Kafka       │
                    │ (Event Broker)  │
                    │  Port: 9092     │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │     Worker      │    │     Admin       │
                    │ (Go/PostgreSQL) │    │(Node.js/MySQL)  │
                    │ (Event Consumer)│    │  Port: 3001     │
                    └─────────────────┘    └─────────────────┘
```

## Service Documentation

Each service has its own comprehensive documentation in `CLAUDE.md` files. When working on this repository, please refer to the specific service documentation for detailed implementation guidance:

### 📖 Service-Specific Documentation

- **[booking-management/CLAUDE.md](./booking-management/CLAUDE.md)** - Booking Management Service
  - Go REST API with PostgreSQL
  - User, room, and booking management
  - Validation endpoints and internal room IDs

- **[payments/CLAUDE.md](./payments/CLAUDE.md)** - Payments Service
  - Node.js Express API
  - Payment processing simulation
  - External service integration patterns

- **[booking/CLAUDE.md](./booking/CLAUDE.md)** - Booking Service
  - Go service with Kafka integration
  - Event publishing for bookings and cancellations
  - Payment service integration

- **[worker/CLAUDE.md](./worker/CLAUDE.md)** - Worker Service
  - Go background event processor
  - Kafka consumer for booking/cancellation events
  - Database persistence layer

- **[admin/CLAUDE.md](./admin/CLAUDE.md)** - Admin Service
  - Node.js Express API with MySQL
  - Employee and complaint management
  - Hotel administration functionality

## Technology Stack

### Languages & Frameworks
- **Go 1.24** - booking-management, booking, worker services
- **Node.js 20** - payments, admin services
- **Express.js** - Node.js web framework

### Databases
- **PostgreSQL** - booking-management, worker services
- **MySQL 8.0** - admin service

### Message Broker
- **Apache Kafka 4.1.0** - Event streaming (KRaft mode, no Zookeeper)
- **IBM Sarama** - Go Kafka client library

### Infrastructure
- **Docker & Docker Compose** - Containerization and local development
- **Okteto** - Cloud development and deployment platform

### Observability
- **Structured Logging** - JSON logging across all services
- **Baggage Header Propagation** - Distributed tracing support
- **Health Check Endpoints** - Service monitoring

## Development Workflow

### Prerequisites
- Docker & Docker Compose
- Go 1.24+ (for Go services)
- Node.js 20+ (for Node.js services)
- Okteto CLI (for cloud development)

### Local Development
```bash
# Clone the repository
git clone <repository-url>
cd sample-app

# Start all services with Docker Compose
docker-compose up -d

# View service logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down
```

### Okteto Development
```bash
# Deploy to Okteto
okteto deploy --remote

# Start development environment
okteto up

# Access individual service development containers
okteto up [service-name]
```

## Service Interaction Patterns

### 1. Request-Response Pattern
- **booking-management ↔ booking**: Validation requests
- **booking ↔ payments**: Payment processing

### 2. Event-Driven Pattern
- **booking → kafka**: Publishes booking/cancellation events
- **kafka → worker**: Consumes events for persistence

### 3. Database Patterns
- **Shared PostgreSQL**: booking-management & worker
- **Dedicated MySQL**: admin service
- **Event Sourcing**: Kafka topics as event log

## Distributed Tracing

All services implement baggage header propagation for distributed tracing:

```http
Baggage: trace-id=abc123,span-id=def456,user-id=user789
```

### Implementation Pattern
```javascript
// Node.js services
const baggage = req.headers['baggage'];
logger.info('Processing request', { operation: 'example' }, req);

// Go services
baggage := extractBaggageFromHeaders(headers)
ctx = middleware.WithBaggage(ctx, baggage)
logger.Info(ctx, "Processing request", "operation", "example")
```

## Database Schemas

### PostgreSQL (booking-management, worker)
- **users** - Hotel guests and customers
- **rooms** - Hotel room inventory with internal IDs
- **bookings** - Reservations with payment and status tracking

### MySQL (admin)
- **employees** - Hotel staff management
- **complaints** - Customer feedback and issues

## Event Schema

### Booking Events (Topic: booking-events)
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

### Cancellation Events (Topic: booking-cancellations)
```json
{
  "bookingId": "booking_456",
  "userId": "user_123",
  "timestamp": "2025-01-18T10:30:00Z"
}
```

## API Gateway Pattern (Future Enhancement)

Currently, services expose individual ports. For production, consider:
- API Gateway for unified entry point
- Authentication/authorization middleware
- Rate limiting and request routing
- Load balancing across service instances

## Security Considerations

### Current Implementation
- Input validation across all services
- Prepared statements for SQL injection prevention
- Security middleware (Helmet, CORS)
- Non-root Docker containers

### Production Enhancements (Future)
- JWT authentication and authorization
- API key management
- TLS/SSL encryption
- Network segmentation
- Secret management system

## Monitoring & Observability

### Implemented
- Health check endpoints on all services
- Structured JSON logging with baggage tracing
- Database connectivity monitoring
- Service startup/shutdown logging

### Future Enhancements
- Prometheus metrics collection
- Grafana dashboards
- Distributed tracing with Jaeger/Zipkin
- Alerting and notification systems

## Testing Strategy

### Unit Testing
- Each service should have comprehensive unit tests
- Test database operations with test databases
- Mock external service dependencies

### Integration Testing
- Test service-to-service communication
- Validate event publishing and consumption
- End-to-end booking flow testing

### Performance Testing
- Database query performance
- Kafka throughput and latency
- API response times under load

## Deployment Patterns

### Development
- Local Docker Compose for full stack development
- Okteto for cloud-based development environment
- Individual service development with live reloading

### Production (Future)
- Kubernetes orchestration
- Horizontal pod autoscaling
- Blue-green or canary deployments
- Database connection pooling and replication

## Contributing Guidelines

### Code Standards
- Follow established patterns in each service's CLAUDE.md
- Maintain consistent error handling and logging
- Include comprehensive input validation
- Update documentation with code changes

### Git Workflow
- Feature branches for new functionality
- Descriptive commit messages
- Include service-specific documentation updates
- Test changes locally before committing

### Service Development
1. **Read the service-specific CLAUDE.md** for detailed guidance
2. **Follow established patterns** for new endpoints/functionality
3. **Include comprehensive logging** with baggage propagation
4. **Add input validation** and error handling
5. **Update documentation** when adding features

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database container status
docker-compose ps

# View database logs
docker-compose logs postgres
docker-compose logs mysql

# Reset database volumes
docker-compose down -v && docker-compose up -d
```

#### Kafka Issues
```bash
# Check Kafka container and topics
docker-compose exec kafka kafka-topics.sh --bootstrap-server localhost:9092 --list

# View Kafka logs
docker-compose logs kafka

# Reset Kafka data
docker-compose down -v && docker-compose up -d kafka
```

#### Service Communication Issues
- Verify baggage header propagation
- Check service discovery (container names)
- Validate network connectivity between services

### Debugging Tips
1. **Use structured logging** - All services log in JSON format
2. **Trace requests** - Follow baggage headers across services
3. **Check health endpoints** - Verify service and database status
4. **Monitor Docker logs** - Use `docker-compose logs -f [service]`

## Performance Optimization

### Database Performance
- Connection pooling configured across all services
- Appropriate indexes on frequently queried columns
- Query optimization and LIMIT clauses

### Kafka Performance
- Concurrent partition processing in worker service
- Appropriate consumer group configuration
- Message batching for high throughput scenarios

### API Performance
- Efficient JSON serialization
- Minimal data processing in route handlers
- Caching strategies for read-heavy endpoints

## Future Roadmap

### Short Term
- Complete test coverage for all services
- API documentation with OpenAPI/Swagger
- Performance benchmarking and optimization

### Medium Term
- Authentication and authorization system
- API gateway implementation
- Enhanced monitoring and alerting

### Long Term
- Multi-tenant architecture support
- Advanced analytics and reporting
- Machine learning integration for recommendations

## Quick Reference

### Service Ports
- **booking-management**: 8080
- **payments**: 3000
- **booking**: 8081
- **admin**: 3001
- **kafka**: 9092
- **postgres**: 5432
- **mysql**: 3306

### Key Commands
```bash
# Start all services
docker-compose up -d

# View service logs
docker-compose logs -f [service-name]

# Execute commands in service container
docker-compose exec [service-name] [command]

# Deploy to Okteto
okteto deploy --remote

# Start Okteto development
okteto up [service-name]
```

## Support & Documentation

For detailed service-specific information, always refer to the individual `CLAUDE.md` files in each service directory. These contain comprehensive implementation details, API specifications, and service-specific best practices.

When working on any service, the pattern is:
1. Read the main README.md for project overview
2. Read this root CLAUDE.md for architecture understanding
3. Read the service-specific CLAUDE.md for implementation details
4. Follow established patterns and update documentation accordingly

This documentation structure ensures comprehensive coverage while maintaining service-specific detail and context.