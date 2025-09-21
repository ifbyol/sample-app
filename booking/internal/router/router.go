package router

import (
	"booking/internal/handlers"
	"booking/internal/middleware"

	"github.com/gorilla/mux"
)

func NewRouter() *mux.Router {
	router := mux.NewRouter()

	router.Use(middleware.BaggageMiddleware)

	healthHandler := handlers.NewHealthHandler()

	router.HandleFunc("/health", healthHandler.Health).Methods("GET")

	return router
}