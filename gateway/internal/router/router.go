package router

import (
	"net/http"

	"github.com/gorilla/mux"

	"gateway/internal/handlers"
	"gateway/internal/middleware"
)

func NewRouter() *mux.Router {
	r := mux.NewRouter()

	// Add middleware
	r.Use(middleware.BaggageMiddleware)

	// Routes
	r.HandleFunc("/", handlers.Gateway).Methods("GET")
	r.HandleFunc("/healthz", handlers.Health).Methods("GET")

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