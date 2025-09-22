package models

import "time"

type User struct {
	ID          int       `json:"id" db:"id"`
	Email       string    `json:"email" db:"email"`
	Username    string    `json:"username" db:"username"`
	DateOfBirth time.Time `json:"date_of_birth" db:"date_of_birth"`
	Name        string    `json:"name" db:"name"`
	Surname     string    `json:"surname" db:"surname"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type Room struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Floor     int       `json:"floor" db:"floor"`
	Bathrooms int       `json:"bathrooms" db:"bathrooms"`
	Beds      int       `json:"beds" db:"beds"`
	Capacity  int       `json:"capacity" db:"capacity"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type Booking struct {
	ID             int       `json:"id" db:"id"`
	UserID         int       `json:"user_id" db:"user_id"`
	RoomID         int       `json:"room_id" db:"room_id"`
	NumberOfGuests int       `json:"number_of_guests" db:"number_of_guests"`
	StartDate      time.Time `json:"start_date" db:"start_date"`
	EndDate        time.Time `json:"end_date" db:"end_date"`
	PaymentID      *string   `json:"payment_id" db:"payment_id"`
	Status         string    `json:"status" db:"status"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

type ValidationRequest struct {
	RoomID         int       `json:"room_id"`
	NumberOfGuests int       `json:"number_of_guests"`
	StartDate      time.Time `json:"start_date"`
	EndDate        time.Time `json:"end_date"`
}

type ValidationResponse struct {
	IsValid bool     `json:"isValid"`
	Reasons []string `json:"reasons"`
}