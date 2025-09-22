package router

import (
	"net/http"

	"github.com/gorilla/mux"

	"gateway/internal/client"
	"gateway/internal/config"
	"gateway/internal/handlers"
	"gateway/internal/middleware"
)

func NewRouter(cfg *config.Config) *mux.Router {
	r := mux.NewRouter()

	// Add middleware
	r.Use(middleware.BaggageMiddleware)

	// Create HTTP client and proxy handler
	httpClient := client.NewHTTPClient()
	proxyHandler := handlers.NewProxyHandler(httpClient, cfg)

	// Gateway routes
	r.HandleFunc("/", handlers.Gateway).Methods("GET")
	r.HandleFunc("/healthz", handlers.Health).Methods("GET")

	// Admin service proxy routes
	r.HandleFunc("/admin", proxyHandler.ProxyAdminRoot).Methods("GET", "OPTIONS")
	r.HandleFunc("/admin/", proxyHandler.ProxyAdminRoot).Methods("GET", "OPTIONS")
	r.HandleFunc("/admin/health", proxyHandler.ProxyAdminHealth).Methods("GET", "OPTIONS")
	r.HandleFunc("/admin/employee", proxyHandler.ProxyAdminEmployees).Methods("GET", "POST", "OPTIONS")
	r.HandleFunc("/admin/complaint", proxyHandler.ProxyAdminComplaints).Methods("GET", "POST", "OPTIONS")

	// Booking service proxy routes
	r.HandleFunc("/booking/health", proxyHandler.ProxyBookingHealth).Methods("GET", "OPTIONS")
	r.HandleFunc("/booking/book", proxyHandler.ProxyBookingBook).Methods("POST", "OPTIONS")
	r.HandleFunc("/booking/cancel", proxyHandler.ProxyBookingCancel).Methods("POST", "OPTIONS")

	// Booking-management service proxy routes
	r.HandleFunc("/booking-management/healthz", proxyHandler.ProxyBookingMgmtHealthz).Methods("GET", "OPTIONS")
	r.HandleFunc("/booking-management/users", proxyHandler.ProxyBookingMgmtUsers).Methods("GET", "OPTIONS")
	r.HandleFunc("/booking-management/rooms", proxyHandler.ProxyBookingMgmtRooms).Methods("GET", "OPTIONS")
	r.HandleFunc("/booking-management/bookings", proxyHandler.ProxyBookingMgmtBookings).Methods("GET", "OPTIONS")
	r.HandleFunc("/booking-management/validate", proxyHandler.ProxyBookingMgmtValidate).Methods("POST", "OPTIONS")

	return r
}

// CORS middleware
func EnableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, baggage, Baggage")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}