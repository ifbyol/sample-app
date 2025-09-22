package router

import (
	"booking/internal/client"
	"booking/internal/handlers"
	"booking/internal/kafka"
	"booking/internal/middleware"

	"github.com/gorilla/mux"
)

func NewRouter(paymentClient *client.PaymentClient, kafkaClient *kafka.Client) *mux.Router {
	router := mux.NewRouter()

	router.Use(middleware.BaggageMiddleware)

	healthHandler := handlers.NewHealthHandler()
	bookingHandler := handlers.NewBookingHandler(paymentClient, kafkaClient)

	router.HandleFunc("/health", healthHandler.Health).Methods("GET")
	router.HandleFunc("/book", bookingHandler.Book).Methods("POST")
	router.HandleFunc("/cancel", bookingHandler.Cancel).Methods("POST")

	return router
}