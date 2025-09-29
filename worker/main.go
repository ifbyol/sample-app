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
	"worker/internal/repository"
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

	// Create repositories
	bookingRepo := repository.NewBookingRepository(db.DB)

	// Create event handlers with dependency injection
	handlers := kafka.EventHandlers{
		BookingHandler:      createBookingHandler(bookingRepo),
		CancellationHandler: createCancellationHandler(bookingRepo),
	}

	consumer, err := kafka.NewConsumer(cfg.KafkaBrokers, handlers, cfg.OktetoDivertedEnv, cfg.OktetoNamespace)
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

func createBookingHandler(repo *repository.BookingRepository) func(context.Context, models.BookingEvent) error {
	return func(ctx context.Context, event models.BookingEvent) error {
		logger.Info(ctx, "Processing booking event",
			"bookingId", event.BookingID,
			"userId", event.UserID,
			"roomId", event.RoomID,
			"paymentId", event.PaymentID,
			"guests", event.Guests)

		err := repo.CreateBooking(ctx, event)
		if err != nil {
			logger.Error(ctx, "Failed to create booking in database",
				"bookingId", event.BookingID,
				"error", err)
			return err
		}

		logger.Info(ctx, "Successfully created booking in database",
			"bookingId", event.BookingID,
			"userId", event.UserID,
			"roomId", event.RoomID)

		return nil
	}
}

func createCancellationHandler(repo *repository.BookingRepository) func(context.Context, models.CancellationEvent) error {
	return func(ctx context.Context, event models.CancellationEvent) error {
		logger.Info(ctx, "Processing cancellation event",
			"bookingId", event.BookingID,
			"userId", event.UserID,
			"timestamp", event.Timestamp)

		err := repo.CancelBooking(ctx, event)
		if err != nil {
			logger.Error(ctx, "Failed to cancel booking in database",
				"bookingId", event.BookingID,
				"userId", event.UserID,
				"error", err)
			return err
		}

		logger.Info(ctx, "Successfully cancelled booking in database",
			"bookingId", event.BookingID,
			"userId", event.UserID)

		return nil
	}
}
