package config

import (
	"os"
	"strings"
)

type Config struct {
	Port          string
	KafkaBrokers  []string
	PaymentServiceURL string
	BookingManagementServiceURL string
}

func Load() *Config {
	brokersStr := getEnv("KAFKA_BROKERS", "localhost:9092")
	brokers := strings.Split(brokersStr, ",")

	// Trim whitespace from each broker
	for i, broker := range brokers {
		brokers[i] = strings.TrimSpace(broker)
	}

	return &Config{
		Port:         getEnv("PORT", "8081"),
		KafkaBrokers: brokers,
		PaymentServiceURL: getEnv("PAYMENT_SERVICE_URL", "http://payments:3000"),
		BookingManagementServiceURL: getEnv("BOOKING_MANAGEMENT_SERVICE_URL", "http://booking-management:8080"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}