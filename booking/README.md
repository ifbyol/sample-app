# Booking

A REST API service for handling hotel room bookings with payment integration and event publishing built with Go and Kafka.

**Features:**
- Hotel room booking with payment processing
- Booking cancellation
- Payment service integration
- Kafka event publishing
- Baggage header propagation

**Endpoints:**
- `GET /health` - Health check
- `POST /book` - Create new booking with payment processing
- `POST /cancel` - Cancel existing booking

**Technology Stack:**
- Go 1.24
- Apache Kafka (KRaft mode)
- IBM Sarama (Kafka client)
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
go build -o booking . && ./booking

# Access API endpoints from within the development container
curl http://localhost:8081/health
curl -H "Content-Type: application/json" -d '{"paymentId":"pay_123","creditCardNumber":"4532015112830366","roomId":"room_101","userId":"user_1","guests":2,"startDate":"2025-10-15T15:00:00Z","endDate":"2025-10-18T11:00:00Z"}' http://localhost:8081/book
curl -H "Content-Type: application/json" -d '{"bookingId":"booking_123","userId":"user_1"}' http://localhost:8081/cancel
```

**Kafka Integration:**
- Publishes booking events to `booking-events` topic
- Publishes cancellation events to `booking-cancellations` topic
- Uses Apache Kafka 4.1.0 with KRaft mode (no Zookeeper required)