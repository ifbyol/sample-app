package httpclient

import (
	"context"
	"net/http"

	"booking-management/internal/middleware"
)

type Client struct {
	*http.Client
}

func NewClient() *Client {
	return &Client{
		Client: &http.Client{},
	}
}

func (c *Client) DoWithBaggage(ctx context.Context, req *http.Request) (*http.Response, error) {
	baggage := middleware.GetBaggageFromContext(ctx)
	if baggage != "" {
		req.Header.Set("baggage", baggage)
	}

	req = req.WithContext(ctx)
	return c.Client.Do(req)
}

func (c *Client) Get(ctx context.Context, url string) (*http.Response, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	return c.DoWithBaggage(ctx, req)
}

func (c *Client) Post(ctx context.Context, url, contentType string, body interface{}) (*http.Response, error) {
	req, err := http.NewRequest("POST", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", contentType)
	return c.DoWithBaggage(ctx, req)
}