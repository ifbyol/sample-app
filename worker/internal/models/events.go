package models

import "time"

type BookingEvent struct {
	UserID    string    `json:"userId"`
	RoomID    string    `json:"roomId"`
	Guests    int       `json:"guests"`
	StartDate time.Time `json:"startDate"`
	EndDate   time.Time `json:"endDate"`
	BookingID string    `json:"bookingId"`
	PaymentID string    `json:"paymentId"`
}

type CancellationEvent struct {
	BookingID string    `json:"bookingId"`
	UserID    string    `json:"userId"`
	Timestamp time.Time `json:"timestamp"`
}
