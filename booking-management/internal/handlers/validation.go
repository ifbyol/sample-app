package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"booking-management/internal/database"
	"booking-management/internal/logger"
	"booking-management/internal/models"
)

type ValidationHandler struct {
	db *database.DB
}

func NewValidationHandler(db *database.DB) *ValidationHandler {
	return &ValidationHandler{db: db}
}

func (h *ValidationHandler) ValidateBooking(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	logger.Info(ctx, "Processing booking validation request")

	var req models.ValidationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Error(ctx, "Failed to decode validation request", "error", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var reasons []string

	// Validate room exists and get room details
	room, err := h.getRoomByInternalID(req.RoomID)
	if err != nil {
		logger.Error(ctx, "Failed to fetch room", "error", err, "room_id", req.RoomID)
		reasons = append(reasons, "Room does not exist")
	}

	// Validate dates
	if !req.EndDate.After(req.StartDate) {
		logger.Info(ctx, "Invalid dates provided", "start_date", req.StartDate, "end_date", req.EndDate)
		reasons = append(reasons, "End date must be after start date")
	}

	// Validate guest count if room exists
	if room != nil && req.NumberOfGuests > room.Capacity {
		logger.Info(ctx, "Guest count exceeds room capacity", "guests", req.NumberOfGuests, "capacity", room.Capacity)
		reasons = append(reasons, fmt.Sprintf("Number of guests (%d) exceeds room capacity (%d)", req.NumberOfGuests, room.Capacity))
	}

	// Validate room availability
	if room != nil {
		isAvailable, err := h.isRoomAvailableByInternalID(req.RoomID, req.StartDate, req.EndDate)
		if err != nil {
			logger.Error(ctx, "Failed to check room availability", "error", err)
			reasons = append(reasons, "Unable to verify room availability")
		} else if !isAvailable {
			logger.Info(ctx, "Room is not available for the specified dates", "room_id", req.RoomID)
			reasons = append(reasons, "Room is not available for the specified dates")
		}
	}

	// Validate guest count is positive
	if req.NumberOfGuests <= 0 {
		logger.Info(ctx, "Invalid guest count", "guests", req.NumberOfGuests)
		reasons = append(reasons, "Number of guests must be greater than 0")
	}

	response := models.ValidationResponse{
		IsValid: len(reasons) == 0,
		Reasons: reasons,
	}

	logger.Info(ctx, "Booking validation completed", "is_valid", response.IsValid, "reasons_count", len(reasons))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		logger.Error(ctx, "Failed to encode response", "error", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func (h *ValidationHandler) getRoomByInternalID(internalID string) (*models.Room, error) {
	query := `SELECT id, internal_id, name, floor, bathrooms, beds, capacity, created_at, updated_at FROM rooms WHERE internal_id = $1`

	var room models.Room
	err := h.db.QueryRow(query, internalID).Scan(
		&room.ID,
		&room.InternalID,
		&room.Name,
		&room.Floor,
		&room.Bathrooms,
		&room.Beds,
		&room.Capacity,
		&room.CreatedAt,
		&room.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &room, nil
}

func (h *ValidationHandler) isRoomAvailableByInternalID(internalID string, startDate, endDate time.Time) (bool, error) {
	query := `
		SELECT COUNT(*)
		FROM bookings b
		JOIN rooms r ON b.room_id = r.id
		WHERE r.internal_id = $1
		AND b.status = 'Accepted'
		AND (
			(b.start_date <= $2 AND b.end_date > $2) OR
			(b.start_date < $3 AND b.end_date >= $3) OR
			(b.start_date >= $2 AND b.end_date <= $3)
		)
	`

	var count int
	err := h.db.QueryRow(query, internalID, startDate, endDate).Scan(&count)
	if err != nil {
		return false, err
	}

	return count == 0, nil
}