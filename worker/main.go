package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"worker/internal/config"
	"worker/internal/database"
	"worker/internal/kafka"
	"worker/internal/logger"
	"worker/internal/models"
)

func main() {
	cfg := config.Load()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	db, err := database.NewConnection(cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPass, cfg.DBName)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	logger.Info(ctx, "Connected to database successfully")

	handlers := kafka.EventHandlers{
		BookingHandler:      handleBookingEvent,
		CancellationHandler: handleCancellationEvent,
	}

	consumer, err := kafka.NewConsumer(cfg.KafkaBrokers, handlers)
	if err != nil {
		log.Fatalf("Failed to create Kafka consumer: %v", err)
	}
	defer consumer.Close()

	go func() {
		if err := consumer.Start(ctx); err != nil {
			logger.Error(ctx, "Consumer error", "error", err)
		}
	}()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	logger.Info(ctx, "Shutting down worker service")
	cancel()
}

func handleBookingEvent(ctx context.Context, event models.BookingEvent) error {
	logger.Info(ctx, "Processing booking event",
		"bookingId", event.BookingID,
		"userId", event.UserID,
		"roomId", event.RoomID,
		"paymentId", event.PaymentID)

	return nil
}

func handleCancellationEvent(ctx context.Context, event models.CancellationEvent) error {
	logger.Info(ctx, "Processing cancellation event",
		"bookingId", event.BookingID,
		"userId", event.UserID)

	return nil
}