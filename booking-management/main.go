package main

import (
	"fmt"
	"log"
	"net/http"

	"booking-management/internal/config"
	"booking-management/internal/database"
	"booking-management/internal/router"
)

func main() {
	cfg := config.Load()

	db, err := database.NewConnection(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	r := router.NewRouter(db)

	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	fmt.Printf("BookingManagement service starting on port %s...\n", cfg.Port)
	log.Fatal(server.ListenAndServe())
}