package handlers

import (
	"encoding/json"
	"net/http"

	"booking-management/internal/database"
	"booking-management/internal/models"
)

type RoomHandler struct {
	db *database.DB
}

func NewRoomHandler(db *database.DB) *RoomHandler {
	return &RoomHandler{db: db}
}

func (h *RoomHandler) GetRooms(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT id, name, floor, bathrooms, beds, capacity, created_at, updated_at
		FROM rooms
		ORDER BY id ASC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		http.Error(w, "Failed to fetch rooms", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var rooms []models.Room
	for rows.Next() {
		var room models.Room
		err := rows.Scan(
			&room.ID,
			&room.Name,
			&room.Floor,
			&room.Bathrooms,
			&room.Beds,
			&room.Capacity,
			&room.CreatedAt,
			&room.UpdatedAt,
		)
		if err != nil {
			http.Error(w, "Failed to scan room", http.StatusInternalServerError)
			return
		}
		rooms = append(rooms, room)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, "Error iterating rooms", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(rooms); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}