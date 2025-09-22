package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gateway/internal/config"
	"gateway/internal/logger"
	"gateway/internal/router"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	logger.Info(ctx, "Starting Gateway service", "port", cfg.Port)

	// Create router
	r := router.NewRouter(cfg)

	// Apply CORS middleware
	handler := router.EnableCORS(r)

	// Create HTTP server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		logger.Info(ctx, "Gateway service listening", "port", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error(ctx, "Failed to start server", "error", err)
			log.Fatal(err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info(ctx, "Shutting down Gateway service")

	// Create a deadline for shutdown
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Attempt graceful shutdown
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error(ctx, "Server forced to shutdown", "error", err)
		log.Fatal(err)
	}

	logger.Info(ctx, "Gateway service stopped")
}