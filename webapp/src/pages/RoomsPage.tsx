import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { Room, ValidationRequest, ValidationResponse } from '../types';

const RoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showValidation, setShowValidation] = useState(false);
  const [validationForm, setValidationForm] = useState<ValidationRequest>({
    room_id: '',
    number_of_guests: 1,
    start_date: '',
    end_date: '',
  });
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const roomsData = await apiService.getRooms();
        setRooms(roomsData);
      } catch (error) {
        console.error('Error loading rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

  const handleValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidating(true);
    setValidationResult(null);

    try {
      // Convert datetime-local format to ISO 8601 with timezone
      const validationData: ValidationRequest = {
        room_id: validationForm.room_id,
        number_of_guests: validationForm.number_of_guests,
        start_date: new Date(validationForm.start_date).toISOString(),
        end_date: new Date(validationForm.end_date).toISOString()
      };

      const result = await apiService.validateBooking(validationData);
      setValidationResult(result);
    } catch (error: any) {
      setValidationResult({
        isValid: false,
        reasons: [error.response?.data?.message || 'Validation failed'],
      });
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading rooms...</div>;
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Rooms</h1>
          <button className="btn" onClick={() => setShowValidation(!showValidation)}>
            {showValidation ? 'Hide Validation' : 'Validate Booking'}
          </button>
        </div>

        {showValidation && (
          <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <h3>Validate Booking Availability</h3>
            <form onSubmit={handleValidation}>
              <div className="form-group">
                <label>Room</label>
                <select
                  value={validationForm.room_id}
                  onChange={(e) => setValidationForm({ ...validationForm, room_id: e.target.value })}
                  required
                >
                  <option value="">Select a room</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.internal_id}>
                      {room.name} - Floor {room.floor} (Capacity: {room.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Number of Guests</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={validationForm.number_of_guests}
                  onChange={(e) => setValidationForm({ ...validationForm, number_of_guests: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="datetime-local"
                  value={validationForm.start_date}
                  onChange={(e) => setValidationForm({ ...validationForm, start_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="datetime-local"
                  value={validationForm.end_date}
                  onChange={(e) => setValidationForm({ ...validationForm, end_date: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn" disabled={validating}>
                {validating ? 'Validating...' : 'Validate'}
              </button>
            </form>

            {validationResult && (
              <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
                <h4 style={{ color: validationResult.isValid ? '#28a745' : '#dc3545' }}>
                  {validationResult.isValid ? '✓ Booking Valid' : '✗ Booking Invalid'}
                </h4>
                {validationResult.reasons && validationResult.reasons.length > 0 && (
                  <ul>
                    {validationResult.reasons.map((reason, index) => (
                      <li key={index} style={{ color: '#dc3545' }}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Floor</th>
              <th>Beds</th>
              <th>Bathrooms</th>
              <th>Capacity</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id}>
                <td>{room.id}</td>
                <td>{room.name}</td>
                <td>{room.floor}</td>
                <td>{room.beds}</td>
                <td>{room.bathrooms}</td>
                <td>{room.capacity}</td>
                <td>{new Date(room.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {rooms.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            No rooms found.
          </div>
        )}
      </div>

      <div className="card">
        <h2>Room Management</h2>
        <p>This section displays all available rooms in the hotel booking system. Each room has:</p>
        <ul>
          <li><strong>Room Identifier:</strong> Unique identifier for each room</li>
          <li><strong>Capacity:</strong> Maximum number of guests the room can accommodate</li>
          <li><strong>Booking Validation:</strong> Check availability and capacity before booking</li>
        </ul>
        <p>Use the validation feature above to check if a booking request would be valid for specific dates and guest counts.</p>
      </div>
    </div>
  );
};

export default RoomsPage;