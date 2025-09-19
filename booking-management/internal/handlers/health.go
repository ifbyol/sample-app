package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"booking-management/internal/logger"
)

type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Service   string    `json:"service"`
}

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

func (h *HealthHandler) Healthz(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	logger.Info(ctx, "Health check requested")

	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now(),
		Service:   "booking-management",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		logger.Error(ctx, "Failed to encode health response", "error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	logger.Info(ctx, "Health check completed successfully")
}