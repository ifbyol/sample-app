package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"worker/internal/models"
)

type BookingRepository struct {
	db *sql.DB
}

func NewBookingRepository(db *sql.DB) *BookingRepository {
	return &BookingRepository{db: db}
}

func (r *BookingRepository) CreateBooking(ctx context.Context, event models.BookingEvent) error {
	// First, get the user ID from the UserID string (assuming it's the user's ID)
	userID, err := r.getUserIDByIdentifier(ctx, event.UserID)
	if err != nil {
		return fmt.Errorf("failed to get user ID: %w", err)
	}

	// Get the room ID from the internal_id
	roomID, err := r.getRoomIDByInternalID(ctx, event.RoomID)
	if err != nil {
		return fmt.Errorf("failed to get room ID: %w", err)
	}

	// Insert the booking
	query := `
		INSERT INTO bookings (user_id, room_id, number_of_guests, start_date, end_date, payment_id, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	now := time.Now()
	_, err = r.db.ExecContext(ctx, query,
		userID,
		roomID,
		event.Guests,
		event.StartDate,
		event.EndDate,
		event.PaymentID,
		"Accepted",
		now,
		now,
	)

	if err != nil {
		return fmt.Errorf("failed to insert booking: %w", err)
	}

	return nil
}

func (r *BookingRepository) getUserIDByIdentifier(ctx context.Context, userIdentifier string) (int, error) {
	var userID int

	// Use CASE WHEN to safely handle numeric string conversion
	query := `
		SELECT id FROM users
		WHERE email = $1
		   OR username = $1
		   OR (CASE WHEN $1 ~ '^[0-9]+$' THEN id = CAST($1 AS INTEGER) ELSE false END)
	`

	err := r.db.QueryRowContext(ctx, query, userIdentifier).Scan(&userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, fmt.Errorf("user not found with identifier: %s", userIdentifier)
		}
		return 0, fmt.Errorf("failed to query user: %w", err)
	}

	return userID, nil
}

func (r *BookingRepository) getRoomIDByInternalID(ctx context.Context, internalID string) (int, error) {
	var roomID int
	query := `SELECT id FROM rooms WHERE internal_id = $1`

	err := r.db.QueryRowContext(ctx, query, internalID).Scan(&roomID)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, fmt.Errorf("room not found with internal ID: %s", internalID)
		}
		return 0, fmt.Errorf("failed to query room: %w", err)
	}

	return roomID, nil
}