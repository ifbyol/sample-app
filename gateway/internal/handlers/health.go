package handlers

import (
	"encoding/json"
	"net/http"

	"gateway/internal/logger"
)

type HealthResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Version   string `json:"version"`
	Timestamp string `json:"timestamp"`
}

func Health(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	logger.Info(ctx, "Health check requested")

	response := HealthResponse{
		Status:    "healthy",
		Service:   "gateway",
		Version:   "1.0.0",
		Timestamp: "2024-01-01T12:00:00Z",
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