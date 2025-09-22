package models

import "time"

type BookingRequest struct {
	PaymentID       string    `json:"paymentId"`
	CreditCardNumber string   `json:"creditCardNumber"`
	RoomID          string    `json:"roomId"`
	UserID          string    `json:"userId"`
	Guests          int       `json:"guests"`
	StartDate       time.Time `json:"startDate"`
	EndDate         time.Time `json:"endDate"`
}

type BookingResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	BookingID string `json:"bookingId,omitempty"`
}

type PaymentRequest struct {
	PaymentID       string `json:"paymentId"`
	CreditCardNumber string `json:"cardNumber"`
}

type PaymentResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

type BookingEvent struct {
	UserID    string    `json:"userId"`
	RoomID    string    `json:"roomId"`
	Guests    int       `json:"guests"`
	StartDate time.Time `json:"startDate"`
	EndDate   time.Time `json:"endDate"`
	BookingID string    `json:"bookingId"`
}

type CancellationRequest struct {
	BookingID string `json:"bookingId"`
	UserID    string `json:"userId"`
}

type CancellationResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

type CancellationEvent struct {
	BookingID string    `json:"bookingId"`
	UserID    string    `json:"userId"`
	Timestamp time.Time `json:"timestamp"`
}