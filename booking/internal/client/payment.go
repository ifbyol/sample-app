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

type PaymentClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewPaymentClient(baseURL string) *PaymentClient {
	return &PaymentClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (pc *PaymentClient) ProcessPayment(ctx context.Context, req models.PaymentRequest) (*models.PaymentResponse, error) {
	logger.Info(ctx, "Processing payment", "paymentId", req.PaymentID)

	payloadBytes, err := json.Marshal(req)
	if err != nil {
		logger.Error(ctx, "Failed to marshal payment request", "error", err)
		return nil, fmt.Errorf("failed to marshal payment request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/process-payment", pc.baseURL), bytes.NewBuffer(payloadBytes))
	if err != nil {
		logger.Error(ctx, "Failed to create HTTP request", "error", err)
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	// Propagate baggage header
	if baggage := middleware.GetBaggageFromContext(ctx); baggage != "" {
		httpReq.Header.Set("Baggage", baggage)
	}

	resp, err := pc.httpClient.Do(httpReq)
	if err != nil {
		logger.Error(ctx, "Failed to make HTTP request to payment service", "error", err)
		return nil, fmt.Errorf("failed to make HTTP request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Error(ctx, "Failed to read response body", "error", err)
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		logger.Error(ctx, "Payment service returned error", "statusCode", resp.StatusCode, "body", string(body))
		return nil, fmt.Errorf("payment service returned status %d: %s", resp.StatusCode, string(body))
	}

	var paymentResp models.PaymentResponse
	if err := json.Unmarshal(body, &paymentResp); err != nil {
		logger.Error(ctx, "Failed to unmarshal payment response", "error", err)
		return nil, fmt.Errorf("failed to unmarshal payment response: %w", err)
	}

	logger.Info(ctx, "Payment processed successfully", "paymentId", req.PaymentID, "success", paymentResp.Success)
	return &paymentResp, nil
}
