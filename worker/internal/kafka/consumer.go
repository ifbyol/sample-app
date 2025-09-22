package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"

	"github.com/IBM/sarama"

	"worker/internal/logger"
	"worker/internal/middleware"
	"worker/internal/models"
)

type Consumer struct {
	consumer sarama.Consumer
	handlers EventHandlers
}

type EventHandlers struct {
	BookingHandler     func(ctx context.Context, event models.BookingEvent) error
	CancellationHandler func(ctx context.Context, event models.CancellationEvent) error
}

func NewConsumer(brokers []string, handlers EventHandlers) (*Consumer, error) {
	config := sarama.NewConfig()
	config.Consumer.Return.Errors = true
	config.Consumer.Group.Rebalance.Strategy = sarama.BalanceStrategyRoundRobin

	consumer, err := sarama.NewConsumer(brokers, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Kafka consumer: %w", err)
	}

	return &Consumer{
		consumer: consumer,
		handlers: handlers,
	}, nil
}

func (c *Consumer) Start(ctx context.Context) error {
	var wg sync.WaitGroup

	// Start consuming booking events
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := c.consumeTopic(ctx, "booking-events", c.handleBookingEvent); err != nil {
			logger.Error(ctx, "Error consuming booking events", "error", err)
		}
	}()

	// Start consuming cancellation events
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := c.consumeTopic(ctx, "booking-cancellations", c.handleCancellationEvent); err != nil {
			logger.Error(ctx, "Error consuming cancellation events", "error", err)
		}
	}()

	logger.Info(ctx, "Kafka consumer started, listening for events")

	wg.Wait()
	return nil
}

func (c *Consumer) consumeTopic(ctx context.Context, topic string, handler func(context.Context, *sarama.ConsumerMessage) error) error {
	partitions, err := c.consumer.Partitions(topic)
	if err != nil {
		return fmt.Errorf("failed to get partitions for topic %s: %w", topic, err)
	}

	var wg sync.WaitGroup
	for _, partition := range partitions {
		wg.Add(1)
		go func(partition int32) {
			defer wg.Done()

			pc, err := c.consumer.ConsumePartition(topic, partition, sarama.OffsetNewest)
			if err != nil {
				logger.Error(ctx, "Failed to start consumer for partition", "topic", topic, "partition", partition, "error", err)
				return
			}
			defer pc.Close()

			logger.Info(ctx, "Started consuming partition", "topic", topic, "partition", partition)

			for {
				select {
				case message := <-pc.Messages():
					if message != nil {
						if err := handler(ctx, message); err != nil {
							logger.Error(ctx, "Failed to handle message", "topic", topic, "partition", partition, "error", err)
						}
					}
				case err := <-pc.Errors():
					if err != nil {
						logger.Error(ctx, "Consumer error", "topic", topic, "partition", partition, "error", err)
					}
				case <-ctx.Done():
					logger.Info(ctx, "Consumer stopping", "topic", topic, "partition", partition)
					return
				}
			}
		}(partition)
	}

	wg.Wait()
	return nil
}

func (c *Consumer) handleBookingEvent(ctx context.Context, message *sarama.ConsumerMessage) error {
	// Extract baggage from message headers if available
	baggage := extractBaggageFromHeaders(message.Headers)
	if baggage != "" {
		ctx = middleware.WithBaggage(ctx, baggage)
	}

	logger.Info(ctx, "Received booking event", "key", string(message.Key), "partition", message.Partition, "offset", message.Offset)

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
	// Extract baggage from message headers if available
	baggage := extractBaggageFromHeaders(message.Headers)
	if baggage != "" {
		ctx = middleware.WithBaggage(ctx, baggage)
	}

	logger.Info(ctx, "Received cancellation event", "key", string(message.Key), "partition", message.Partition, "offset", message.Offset)

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
	return c.consumer.Close()
}

func extractBaggageFromHeaders(headers []*sarama.RecordHeader) string {
	for _, header := range headers {
		if string(header.Key) == "Baggage" {
			return string(header.Value)
		}
	}
	return ""
}