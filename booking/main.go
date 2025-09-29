package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"booking/internal/client"
	"booking/internal/config"
	"booking/internal/kafka"
	"booking/internal/logger"
	"booking/internal/router"
)

func main() {
	ctx := context.Background()
	cfg := config.Load()

	logger.Info(ctx, "Starting booking service", "port", cfg.Port)

	// Initialize Kafka client
	kafkaClient, err := kafka.NewClient(cfg.KafkaBrokers)
	if err != nil {
		logger.Error(ctx, "Failed to create Kafka client", "error", err)
		log.Fatal(err)
	}
	defer kafkaClient.Close()

	// Initialize payment client
	paymentClient := client.NewPaymentClient(cfg.PaymentServiceURL)

	// Initialize booking management client
	bookingManagementClient := client.NewBookingManagementClient(cfg.BookingManagementServiceURL)

	r := router.NewRouter(paymentClient, kafkaClient, bookingManagementClient)

	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	logger.Info(ctx, "Booking service ready to serve requests", "address", server.Addr)
	fmt.Printf("Booking service starting on port %s...\n", cfg.Port)

	if err := server.ListenAndServe(); err != nil {
		logger.Error(ctx, "Server failed to start", "error", err)
		log.Fatal(err)
	}
}
