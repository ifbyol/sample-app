package config

import (
	"os"
	"strings"
)

type Config struct {
	KafkaBrokers []string
	DBHost       string
	DBPort       string
	DBUser       string
	DBPass       string
	DBName       string
}

func Load() *Config {
	brokersStr := getEnv("KAFKA_BROKERS", "localhost:9092")
	brokers := strings.Split(brokersStr, ",")

	// Trim whitespace from each broker
	for i, broker := range brokers {
		brokers[i] = strings.TrimSpace(broker)
	}

	return &Config{
		KafkaBrokers: brokers,
		DBHost:       getEnv("DB_HOST", "localhost"),
		DBPort:       getEnv("DB_PORT", "5432"),
		DBUser:       getEnv("DB_USER", "postgres"),
		DBPass:       getEnv("DB_PASS", "postgres"),
		DBName:       getEnv("DB_NAME", "booking_management"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}