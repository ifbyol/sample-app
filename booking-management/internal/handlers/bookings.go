package handlers

import (
	"encoding/json"
	"net/http"

	"booking-management/internal/database"
	"booking-management/internal/logger"
	"booking-management/internal/models"
)

type BookingHandler struct {
	db *database.DB
}

func NewBookingHandler(db *database.DB) *BookingHandler {
	return &BookingHandler{db: db}
}

func (h *BookingHandler) GetBookings(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	logger.Info(ctx, "Fetching bookings")

	query := `
		SELECT id, user_id, room_id, number_of_guests, start_date, end_date, payment_id, status, created_at, updated_at
		FROM bookings
		ORDER BY id ASC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		logger.Error(ctx, "Failed to fetch bookings from database", "error", err)
		http.Error(w, "Failed to fetch bookings", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var bookings []models.Booking
	for rows.Next() {
		var booking models.Booking
		err := rows.Scan(
			&booking.ID,
			&booking.UserID,
			&booking.RoomID,
			&booking.NumberOfGuests,
			&booking.StartDate,
			&booking.EndDate,
			&booking.PaymentID,
			&booking.Status,
			&booking.CreatedAt,
			&booking.UpdatedAt,
		)
		if err != nil {
			logger.Error(ctx, "Failed to scan booking", "error", err)
			http.Error(w, "Failed to scan booking", http.StatusInternalServerError)
			return
		}
		bookings = append(bookings, booking)
	}

	if err = rows.Err(); err != nil {
		logger.Error(ctx, "Error iterating bookings", "error", err)
		http.Error(w, "Error iterating bookings", http.StatusInternalServerError)
		return
	}

	logger.Info(ctx, "Successfully fetched bookings", "count", len(bookings))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(bookings); err != nil {
		logger.Error(ctx, "Failed to encode response", "error", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}