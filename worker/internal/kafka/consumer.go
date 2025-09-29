package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/IBM/sarama"

	"worker/internal/logger"
	"worker/internal/middleware"
	"worker/internal/models"
)

type Consumer struct {
	consumerGroup     sarama.ConsumerGroup
	handlers          EventHandlers
	oktetoDivertedEnv string
	groupID           string
}

type EventHandlers struct {
	BookingHandler      func(ctx context.Context, event models.BookingEvent) error
	CancellationHandler func(ctx context.Context, event models.CancellationEvent) error
}

func NewConsumer(brokers []string, handlers EventHandlers, oktetoDivertedEnv, oktetoNamespace string) (*Consumer, error) {
	config := sarama.NewConfig()
	config.Consumer.Return.Errors = true
	config.Consumer.Group.Rebalance.Strategy = sarama.BalanceStrategyRoundRobin
	// Enable manual commit - we control when offsets are committed
	config.Consumer.Offsets.AutoCommit.Enable = false
	config.Version = sarama.V2_6_0_0

	// Create dynamic group ID based on namespace for isolation
	groupID := fmt.Sprintf("worker-group-%s", oktetoNamespace)

	consumerGroup, err := sarama.NewConsumerGroup(brokers, groupID, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Kafka consumer group: %w", err)
	}

	return &Consumer{
		consumerGroup:     consumerGroup,
		handlers:          handlers,
		oktetoDivertedEnv: oktetoDivertedEnv,
		groupID:           groupID,
	}, nil
}

func (c *Consumer) Start(ctx context.Context) error {
	topics := []string{"booking-events", "booking-cancellations"}

	logger.Info(ctx, "Starting Kafka consumer group",
		"groupID", c.groupID,
		"topics", topics,
		"oktetoDivertedEnv", c.oktetoDivertedEnv)

	for {
		// Consumer group will automatically handle partition rebalancing
		if err := c.consumerGroup.Consume(ctx, topics, c); err != nil {
			logger.Error(ctx, "Error from consumer group", "error", err)
			return err
		}

		// Check if context was cancelled
		if ctx.Err() != nil {
			return nil
		}
	}
}

// Setup implements sarama.ConsumerGroupHandler
func (c *Consumer) Setup(sarama.ConsumerGroupSession) error {
	return nil
}

// Cleanup implements sarama.ConsumerGroupHandler
func (c *Consumer) Cleanup(sarama.ConsumerGroupSession) error {
	return nil
}

// ConsumeClaim implements sarama.ConsumerGroupHandler
func (c *Consumer) ConsumeClaim(session sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	// Process messages from the claim
	for {
		select {
		case message := <-claim.Messages():
			if message == nil {
				return nil
			}

			// Handle the message and determine if we should commit it
			shouldCommit := c.handleMessage(session.Context(), message)

			if shouldCommit {
				// Mark message as processed (commit offset)
				session.MarkMessage(message, "")
			} else {
				// Don't mark message - it will remain in Kafka for retry
				logger.Info(session.Context(), "Message not committed, leaving in Kafka",
					"topic", message.Topic,
					"partition", message.Partition,
					"offset", message.Offset)
			}

		case <-session.Context().Done():
			return nil
		}
	}
}

// handleMessage processes a message and returns whether it should be committed
func (c *Consumer) handleMessage(ctx context.Context, message *sarama.ConsumerMessage) bool {
	// Extract baggage from message headers if available
	baggage := extractBaggageFromHeaders(message.Headers)
	if baggage != "" {
		ctx = middleware.WithBaggage(ctx, baggage)
	}

	logger.Info(ctx, "Received message",
		"topic", message.Topic,
		"key", string(message.Key),
		"partition", message.Partition,
		"offset", message.Offset)

	// Check if message should be processed based on okteto-divert rules
	if !c.shouldProcessMessage(baggage) {
		logger.Info(ctx, "Message not meant for this environment, not committing",
			"topic", message.Topic,
			"key", string(message.Key),
			"oktetoDivertedEnv", c.oktetoDivertedEnv,
			"baggage", baggage)
		return false // Don't commit - leave in Kafka
	}

	// Route to appropriate handler based on topic
	var err error
	switch message.Topic {
	case "booking-events":
		err = c.handleBookingEvent(ctx, message)
	case "booking-cancellations":
		err = c.handleCancellationEvent(ctx, message)
	default:
		logger.Error(ctx, "Unknown topic", "topic", message.Topic)
		return false // Don't commit unknown topics
	}

	if err != nil {
		logger.Error(ctx, "Failed to handle message",
			"topic", message.Topic,
			"key", string(message.Key),
			"error", err)
		return false // Don't commit on error - leave for retry
	}

	logger.Info(ctx, "Message processed successfully",
		"topic", message.Topic,
		"key", string(message.Key))
	return true // Commit successful processing
}

func (c *Consumer) handleBookingEvent(ctx context.Context, message *sarama.ConsumerMessage) error {
	var event models.BookingEvent
	if err := json.Unmarshal(message.Value, &event); err != nil {
		return fmt.Errorf("failed to unmarshal booking event: %w", err)
	}

	if c.handlers.BookingHandler != nil {
		return c.handlers.BookingHandler(ctx, event)
	}

	logger.Warn(ctx, "No handler configured for booking events")
	return nil
}

func (c *Consumer) handleCancellationEvent(ctx context.Context, message *sarama.ConsumerMessage) error {
	var event models.CancellationEvent
	if err := json.Unmarshal(message.Value, &event); err != nil {
		return fmt.Errorf("failed to unmarshal cancellation event: %w", err)
	}

	if c.handlers.CancellationHandler != nil {
		return c.handlers.CancellationHandler(ctx, event)
	}

	logger.Warn(ctx, "No handler configured for cancellation events")
	return nil
}

func (c *Consumer) Close() error {
	return c.consumerGroup.Close()
}

func extractBaggageFromHeaders(headers []*sarama.RecordHeader) string {
	for _, header := range headers {
		if string(header.Key) == "baggage" {
			return string(header.Value)
		}
	}
	return ""
}

// shouldProcessMessage determines if a message should be processed based on okteto-divert rules
func (c *Consumer) shouldProcessMessage(baggage string) bool {
	// Extract okteto-divert value from baggage
	oktetoDivertValue := extractOktetoDivertFromBaggage(baggage)

	// Rule 1: If message has okteto-divert key, process only if value matches environment variable
	if oktetoDivertValue != "" {
		return oktetoDivertValue == c.oktetoDivertedEnv
	}

	// Rule 2: If message doesn't have okteto-divert key, process only if environment variable is empty
	return c.oktetoDivertedEnv == ""
}

// extractOktetoDivertFromBaggage parses baggage string and extracts okteto-divert value
func extractOktetoDivertFromBaggage(baggage string) string {
	if baggage == "" {
		return ""
	}

	// Parse baggage format: "key1=value1,key2=value2,..."
	pairs := strings.Split(baggage, ",")
	for _, pair := range pairs {
		kv := strings.SplitN(strings.TrimSpace(pair), "=", 2)
		if len(kv) == 2 && strings.TrimSpace(kv[0]) == "okteto-divert" {
			return strings.TrimSpace(kv[1])
		}
	}

	return ""
}
