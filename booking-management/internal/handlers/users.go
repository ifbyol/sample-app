package handlers

import (
	"encoding/json"
	"net/http"

	"booking-management/internal/database"
	"booking-management/internal/models"
)

type UserHandler struct {
	db *database.DB
}

func NewUserHandler(db *database.DB) *UserHandler {
	return &UserHandler{db: db}
}

func (h *UserHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT id, email, username, date_of_birth, name, surname, created_at, updated_at
		FROM users
		ORDER BY id ASC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.Username,
			&user.DateOfBirth,
			&user.Name,
			&user.Surname,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			http.Error(w, "Failed to scan user", http.StatusInternalServerError)
			return
		}
		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, "Error iterating users", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(users); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}