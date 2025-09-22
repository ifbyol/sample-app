package handlers

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"booking/internal/client"
	"booking/internal/kafka"
	"booking/internal/logger"
	"booking/internal/models"
)

type BookingHandler struct {
	paymentClient           *client.PaymentClient
	kafkaClient             *kafka.Client
	bookingManagementClient *client.BookingManagementClient
}

func NewBookingHandler(paymentClient *client.PaymentClient, kafkaClient *kafka.Client, bookingManagementClient *client.BookingManagementClient) *BookingHandler {
	return &BookingHandler{
		paymentClient:           paymentClient,
		kafkaClient:             kafkaClient,
		bookingManagementClient: bookingManagementClient,
	}
}

func (bh *BookingHandler) Book(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	logger.Info(ctx, "Processing booking request")

	var bookingReq models.BookingRequest
	if err := json.NewDecoder(r.Body).Decode(&bookingReq); err != nil {
		logger.Error(ctx, "Failed to decode booking request", "error", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if bookingReq.PaymentID == "" || bookingReq.CreditCardNumber == "" || bookingReq.RoomID == "" || bookingReq.UserID == "" {
		logger.Error(ctx, "Missing required fields in booking request")
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	if bookingReq.Guests <= 0 {
		logger.Error(ctx, "Invalid number of guests", "guests", bookingReq.Guests)
		http.Error(w, "Invalid number of guests", http.StatusBadRequest)
		return
	}

	if bookingReq.StartDate.After(bookingReq.EndDate) || bookingReq.StartDate.Before(time.Now()) {
		logger.Error(ctx, "Invalid booking dates")
		http.Error(w, "Invalid booking dates", http.StatusBadRequest)
		return
	}

	// Validate booking with booking-management service
	validationReq := models.BookingValidationRequest{
		RoomID:         bookingReq.RoomID,
		NumberOfGuests: bookingReq.Guests,
		StartDate:      bookingReq.StartDate,
		EndDate:        bookingReq.EndDate,
	}

	validationResp, err := bh.bookingManagementClient.ValidateBooking(ctx, validationReq)
	if err != nil {
		logger.Error(ctx, "Failed to validate booking", "error", err)
		response := models.BookingResponse{
			Success: false,
			Message: "Booking validation failed",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}

	if !validationResp.IsValid {
		logger.Error(ctx, "Booking validation failed", "reasons", validationResp.Reasons)
		response := models.BookingResponse{
			Success: false,
			Message: fmt.Sprintf("Booking validation failed: %v", validationResp.Reasons),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	logger.Info(ctx, "Booking validation passed", "room_id", bookingReq.RoomID)

	// Process payment
	paymentReq := models.PaymentRequest{
		PaymentID:       bookingReq.PaymentID,
		CreditCardNumber: bookingReq.CreditCardNumber,
	}

	paymentResp, err := bh.paymentClient.ProcessPayment(ctx, paymentReq)
	if err != nil {
		logger.Error(ctx, "Failed to process payment", "error", err)
		response := models.BookingResponse{
			Success: false,
			Message: "Payment processing failed",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusPaymentRequired)
		json.NewEncoder(w).Encode(response)
		return
	}

	if !paymentResp.Success {
		logger.Error(ctx, "Payment was not successful", "message", paymentResp.Message)
		response := models.BookingResponse{
			Success: false,
			Message: fmt.Sprintf("Payment failed: %s", paymentResp.Message),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusPaymentRequired)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Generate booking ID
	bookingID := fmt.Sprintf("booking_%d_%s", time.Now().Unix(), generateRandomString(6))

	// Create booking event for Kafka
	bookingEvent := models.BookingEvent{
		UserID:    bookingReq.UserID,
		RoomID:    bookingReq.RoomID,
		Guests:    bookingReq.Guests,
		StartDate: bookingReq.StartDate,
		EndDate:   bookingReq.EndDate,
		BookingID: bookingID,
		PaymentID: bookingReq.PaymentID,
	}

	// Publish to Kafka
	if err := bh.kafkaClient.SendMessage(ctx, "booking-events", bookingID, bookingEvent); err != nil {
		logger.Error(ctx, "Failed to publish booking event to Kafka", "error", err)
		response := models.BookingResponse{
			Success: false,
			Message: "Booking event publishing failed",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}

	logger.Info(ctx, "Booking completed successfully", "bookingId", bookingID, "userId", bookingReq.UserID)

	response := models.BookingResponse{
		Success:   true,
		Message:   "Booking completed successfully",
		BookingID: bookingID,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

func (bh *BookingHandler) Cancel(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	logger.Info(ctx, "Processing booking cancellation request")

	var cancellationReq models.CancellationRequest
	if err := json.NewDecoder(r.Body).Decode(&cancellationReq); err != nil {
		logger.Error(ctx, "Failed to decode cancellation request", "error", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if cancellationReq.BookingID == "" || cancellationReq.UserID == "" {
		logger.Error(ctx, "Missing required fields in cancellation request")
		http.Error(w, "Missing required fields: bookingId and userId are required", http.StatusBadRequest)
		return
	}

	// Create cancellation event for Kafka
	cancellationEvent := models.CancellationEvent{
		BookingID: cancellationReq.BookingID,
		UserID:    cancellationReq.UserID,
		Timestamp: time.Now(),
	}

	// Publish to Kafka
	if err := bh.kafkaClient.SendMessage(ctx, "booking-cancellations", cancellationReq.BookingID, cancellationEvent); err != nil {
		logger.Error(ctx, "Failed to publish cancellation event to Kafka", "error", err)
		response := models.CancellationResponse{
			Success: false,
			Message: "Cancellation event publishing failed",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}

	logger.Info(ctx, "Booking cancellation completed successfully", "bookingId", cancellationReq.BookingID, "userId", cancellationReq.UserID)

	response := models.CancellationResponse{
		Success: true,
		Message: "Booking cancellation completed successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func generateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}