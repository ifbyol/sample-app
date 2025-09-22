package handlers

import (
	"io"
	"net/http"
	"strings"

	"gateway/internal/client"
	"gateway/internal/config"
	"gateway/internal/logger"
)

type ProxyHandler struct {
	httpClient *client.HTTPClient
	config     *config.Config
}

func NewProxyHandler(httpClient *client.HTTPClient, config *config.Config) *ProxyHandler {
	return &ProxyHandler{
		httpClient: httpClient,
		config:     config,
	}
}

// Admin service proxy handlers
func (p *ProxyHandler) ProxyAdminEmployees(w http.ResponseWriter, r *http.Request) {
	p.proxyToService(w, r, p.config.AdminServiceURL, "/admin/employee")
}

func (p *ProxyHandler) ProxyAdminComplaints(w http.ResponseWriter, r *http.Request) {
	p.proxyToService(w, r, p.config.AdminServiceURL, "/admin/complaint")
}

func (p *ProxyHandler) ProxyAdminHealth(w http.ResponseWriter, r *http.Request) {
	p.proxyToService(w, r, p.config.AdminServiceURL, "/health")
}

func (p *ProxyHandler) ProxyAdminRoot(w http.ResponseWriter, r *http.Request) {
	p.proxyToService(w, r, p.config.AdminServiceURL, "/")
}

// Booking service proxy handlers
func (p *ProxyHandler) ProxyBookingHealth(w http.ResponseWriter, r *http.Request) {
	p.proxyToService(w, r, p.config.BookingServiceURL, "/health")
}

func (p *ProxyHandler) ProxyBookingBook(w http.ResponseWriter, r *http.Request) {
	p.proxyToService(w, r, p.config.BookingServiceURL, "/book")
}

func (p *ProxyHandler) ProxyBookingCancel(w http.ResponseWriter, r *http.Request) {
	p.proxyToService(w, r, p.config.BookingServiceURL, "/cancel")
}

// Booking-management service proxy handlers
func (p *ProxyHandler) ProxyBookingMgmtHealthz(w http.ResponseWriter, r *http.Request) {
	p.proxyToService(w, r, p.config.BookingManagementServiceURL, "/healthz")
}

func (p *ProxyHandler) ProxyBookingMgmtUsers(w http.ResponseWriter, r *http.Request) {
	p.proxyToService(w, r, p.config.BookingManagementServiceURL, "/users")
}

func (p *ProxyHandler) ProxyBookingMgmtRooms(w http.ResponseWriter, r *http.Request) {
	p.proxyToService(w, r, p.config.BookingManagementServiceURL, "/rooms")
}

func (p *ProxyHandler) ProxyBookingMgmtBookings(w http.ResponseWriter, r *http.Request) {
	p.proxyToService(w, r, p.config.BookingManagementServiceURL, "/bookings")
}

func (p *ProxyHandler) ProxyBookingMgmtValidate(w http.ResponseWriter, r *http.Request) {
	p.proxyToService(w, r, p.config.BookingManagementServiceURL, "/validate")
}

// Generic proxy method
func (p *ProxyHandler) proxyToService(w http.ResponseWriter, r *http.Request, serviceURL, path string) {
	ctx := r.Context()

	logger.Info(ctx, "Proxying request", "method", r.Method, "path", path, "service", serviceURL)

	// Read request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		logger.Error(ctx, "Failed to read request body", "error", err)
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Extract headers
	headers := make(map[string]string)
	for key, values := range r.Header {
		if len(values) > 0 {
			// Skip hop-by-hop headers
			if p.isHopByHopHeader(key) {
				continue
			}
			headers[key] = values[0]
		}
	}

	// Make the proxied request
	targetURL := serviceURL + path
	resp, err := p.httpClient.ProxyRequest(ctx, r.Method, targetURL, body, headers)
	if err != nil {
		logger.Error(ctx, "Failed to proxy request", "error", err, "service", serviceURL)
		http.Error(w, "Service temporarily unavailable", http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	// Copy response headers
	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}

	// Copy status code
	w.WriteHeader(resp.StatusCode)

	// Copy response body
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		logger.Error(ctx, "Failed to copy response body", "error", err)
		return
	}

	logger.Info(ctx, "Request proxied successfully", "status", resp.StatusCode, "service", serviceURL)
}

// Check if header is hop-by-hop and should not be forwarded
func (p *ProxyHandler) isHopByHopHeader(header string) bool {
	hopByHopHeaders := []string{
		"Connection",
		"Keep-Alive",
		"Proxy-Authenticate",
		"Proxy-Authorization",
		"Te",
		"Trailers",
		"Transfer-Encoding",
		"Upgrade",
	}

	header = strings.ToLower(header)
	for _, hopByHop := range hopByHopHeaders {
		if strings.ToLower(hopByHop) == header {
			return true
		}
	}
	return false
}