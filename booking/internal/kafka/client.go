package kafka

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/IBM/sarama"

	"booking/internal/logger"
)

// Client represents a Kafka client
type Client struct {
	producer sarama.SyncProducer
}

// NewClient creates a new Kafka client
func NewClient(brokers []string) (*Client, error) {
	config := sarama.NewConfig()
	config.Producer.Return.Successes = true
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Retry.Max = 5

	producer, err := sarama.NewSyncProducer(brokers, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Kafka producer: %w", err)
	}

	return &Client{
		producer: producer,
	}, nil
}

// SendMessage sends a message to the specified Kafka topic
func (c *Client) SendMessage(ctx context.Context, topic string, key string, message interface{}) error {
	logger.Info(ctx, "Sending message to Kafka", "topic", topic, "key", key)

	// Serialize the message to JSON
	messageBytes, err := json.Marshal(message)
	if err != nil {
		logger.Error(ctx, "Failed to marshal message", "error", err, "topic", topic)
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	// Create Kafka message
	msg := &sarama.ProducerMessage{
		Topic: topic,
		Key:   sarama.StringEncoder(key),
		Value: sarama.ByteEncoder(messageBytes),
	}

	// Send message
	partition, offset, err := c.producer.SendMessage(msg)
	if err != nil {
		logger.Error(ctx, "Failed to send message to Kafka", "error", err, "topic", topic, "key", key)
		return fmt.Errorf("failed to send message: %w", err)
	}

	logger.Info(ctx, "Message sent to Kafka successfully",
		"topic", topic,
		"key", key,
		"partition", partition,
		"offset", offset)

	return nil
}

// Close closes the Kafka client
func (c *Client) Close() error {
	if c.producer != nil {
		return c.producer.Close()
	}
	return nil
}