package config

import "os"

type Config struct {
	Port                       string
	AdminServiceURL           string
	BookingServiceURL         string
	BookingManagementServiceURL string
}

func Load() *Config {
	return &Config{
		Port:                       getEnv("PORT", "8082"),
		AdminServiceURL:           getEnv("ADMIN_SERVICE_URL", "http://admin:3001"),
		BookingServiceURL:         getEnv("BOOKING_SERVICE_URL", "http://booking:8081"),
		BookingManagementServiceURL: getEnv("BOOKING_MANAGEMENT_SERVICE_URL", "http://booking-management:8080"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}