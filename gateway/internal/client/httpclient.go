package client

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"time"

	"gateway/internal/logger"
	"gateway/internal/middleware"
)

type HTTPClient struct {
	client *http.Client
}

func NewHTTPClient() *HTTPClient {
	return &HTTPClient{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *HTTPClient) ProxyRequest(ctx context.Context, method, targetURL string, body []byte, headers map[string]string) (*http.Response, error) {
	var reqBody io.Reader
	if body != nil {
		reqBody = bytes.NewReader(body)
	}

	req, err := http.NewRequestWithContext(ctx, method, targetURL, reqBody)
	if err != nil {
		logger.Error(ctx, "Failed to create HTTP request", "error", err, "url", targetURL)
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Copy headers from original request
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	// Propagate baggage header
	if baggage := middleware.GetBaggageFromContext(ctx); baggage != "" {
		req.Header.Set("Baggage", baggage)
	}

	logger.Info(ctx, "Proxying request", "method", method, "url", targetURL)

	resp, err := c.client.Do(req)
	if err != nil {
		logger.Error(ctx, "Failed to proxy request", "error", err, "url", targetURL)
		return nil, fmt.Errorf("failed to proxy request: %w", err)
	}

	logger.Info(ctx, "Request proxied successfully", "status", resp.StatusCode, "url", targetURL)

	return resp, nil
}