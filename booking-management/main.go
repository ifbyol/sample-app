package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"booking-management/internal/config"
	"booking-management/internal/database"
	"booking-management/internal/logger"
	"booking-management/internal/router"
)

func main() {
	ctx := context.Background()
	cfg := config.Load()

	logger.Info(ctx, "Starting BookingManagement service", "port", cfg.Port)

	db, err := database.NewConnection(cfg)
	if err != nil {
		logger.Error(ctx, "Failed to connect to database", "error", err)
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	logger.Info(ctx, "Database connection established")

	r := router.NewRouter(db)

	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	logger.Info(ctx, "BookingManagement service ready to serve requests", "address", server.Addr)
	fmt.Printf("BookingManagement service starting on port %s...\n", cfg.Port)
	log.Fatal(server.ListenAndServe())
}