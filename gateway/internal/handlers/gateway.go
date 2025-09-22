package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"gateway/internal/logger"
)

type GatewayResponse struct {
	Service     string            `json:"service"`
	Version     string            `json:"version"`
	Description string            `json:"description"`
	Endpoints   map[string]string `json:"endpoints"`
	Timestamp   string            `json:"timestamp"`
}

func Gateway(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	logger.Info(ctx, "Gateway root endpoint accessed")

	response := GatewayResponse{
		Service:     "API Gateway",
		Version:     "1.0.0",
		Description: "API Gateway for booking management system",
		Endpoints: map[string]string{
			"health": "/healthz",
			"root":   "/",
		},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		logger.Error(ctx, "Failed to encode gateway response", "error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	logger.Info(ctx, "Gateway root endpoint completed successfully")
}