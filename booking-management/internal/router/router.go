package router

import (
	"booking-management/internal/database"
	"booking-management/internal/handlers"
	"booking-management/internal/middleware"

	"github.com/gorilla/mux"
)

func NewRouter(db *database.DB) *mux.Router {
	router := mux.NewRouter()

	router.Use(middleware.BaggageMiddleware)

	healthHandler := handlers.NewHealthHandler()
	userHandler := handlers.NewUserHandler(db)
	roomHandler := handlers.NewRoomHandler(db)
	bookingHandler := handlers.NewBookingHandler(db)

	router.HandleFunc("/healthz", healthHandler.Healthz).Methods("GET")
	router.HandleFunc("/users", userHandler.GetUsers).Methods("GET")
	router.HandleFunc("/rooms", roomHandler.GetRooms).Methods("GET")
	router.HandleFunc("/bookings", bookingHandler.GetBookings).Methods("GET")

	return router
}