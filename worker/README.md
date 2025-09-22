# Worker

A background service that processes Kafka events and persists data to PostgreSQL built with Go.

**Features:**
- Kafka event consumption from multiple topics
- Database persistence for booking events
- Booking status management for cancellation events
- Baggage header propagation for distributed tracing
- Concurrent topic processing

**Event Processing:**
- **Booking Events**: Consumes from `booking-events` topic and creates booking records in PostgreSQL
- **Cancellation Events**: Consumes from `booking-cancellations` topic and updates booking status to 'Cancelled'

**Technology Stack:**
- Go 1.24
- Apache Kafka (IBM Sarama client)
- PostgreSQL
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
go build -o worker . && ./worker

# The service runs in background processing mode
# Monitor logs to see event processing activity
```

**Database Integration:**
- Connects to the same PostgreSQL database as booking-management service
- Creates booking records when booking events are received
- Updates booking status when cancellation events are received
- Handles user and room ID resolution from string identifiers

**Event Processing Flow:**
1. Listens to Kafka topics concurrently
2. Extracts baggage headers for distributed tracing
3. Validates and processes events
4. Persists changes to PostgreSQL database
5. Logs success/failure with detailed context