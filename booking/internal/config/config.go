package config

import (
	"os"
	"strings"
)

type Config struct {
	Port          string
	KafkaBrokers  []string
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
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}