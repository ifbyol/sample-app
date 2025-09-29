package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"booking/internal/logger"
	"booking/internal/middleware"
	"booking/internal/models"
)

type BookingManagementClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewBookingManagementClient(baseURL string) *BookingManagementClient {
	return &BookingManagementClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (bmc *BookingManagementClient) ValidateBooking(ctx context.Context, req models.BookingValidationRequest) (*models.BookingValidationResponse, error) {
	logger.Info(ctx, "Validating booking with booking-management service", "room_id", req.RoomID, "guests", req.NumberOfGuests)

	payloadBytes, err := json.Marshal(req)
	if err != nil {
		logger.Error(ctx, "Failed to marshal validation request", "error", err)
		return nil, fmt.Errorf("failed to marshal validation request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/validate", bmc.baseURL), bytes.NewBuffer(payloadBytes))
	if err != nil {
		logger.Error(ctx, "Failed to create HTTP request", "error", err)
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	// Propagate baggage header
	if baggage := middleware.GetBaggageFromContext(ctx); baggage != "" {
		httpReq.Header.Set("Baggage", baggage)
	}

	resp, err := bmc.httpClient.Do(httpReq)
	if err != nil {
		logger.Error(ctx, "Failed to make HTTP request to booking-management service", "error", err)
		return nil, fmt.Errorf("failed to make HTTP request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Error(ctx, "Failed to read response body", "error", err)
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		logger.Error(ctx, "Booking-management service returned error", "statusCode", resp.StatusCode, "body", string(body))
		return nil, fmt.Errorf("booking-management service returned status %d: %s", resp.StatusCode, string(body))
	}

	var validationResp models.BookingValidationResponse
	if err := json.Unmarshal(body, &validationResp); err != nil {
		logger.Error(ctx, "Failed to unmarshal validation response", "error", err)
		return nil, fmt.Errorf("failed to unmarshal validation response: %w", err)
	}

	logger.Info(ctx, "Booking validation completed", "is_valid", validationResp.IsValid, "reasons_count", len(validationResp.Reasons))
	return &validationResp, nil
}
