import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { Booking, BookingRequest, User, Room } from '../types';

const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BookingRequest>({
    paymentId: '',
    creditCardNumber: '',
    roomId: '',
    userId: '',
    guests: 1,
    startDate: '',
    endDate: '',
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bookingsData, usersData, roomsData] = await Promise.all([
          apiService.getBookings(),
          apiService.getUsers(),
          apiService.getRooms(),
        ]);
        setBookings(bookingsData);
        setUsers(usersData);
        setRooms(roomsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setSubmitting(true);

    try {
      // Convert datetime-local format to ISO 8601 with timezone
      const bookingData: BookingRequest = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      };

      const response = await apiService.createBooking(bookingData);
      if (response.success) {
        // Refresh bookings
        const updatedBookings = await apiService.getBookings();
        setBookings(updatedBookings);
        setShowForm(false);
        setFormData({
          paymentId: '',
          creditCardNumber: '',
          roomId: '',
          userId: '',
          guests: 1,
          startDate: '',
          endDate: '',
        });
      } else {
        setFormErrors([response.message || 'Booking failed']);
      }
    } catch (error: any) {
      setFormErrors([error.response?.data?.message || 'Error creating booking']);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (bookingId: string, userId: string) => {
    try {
      const response = await apiService.cancelBooking({ bookingId, userId });
      if (response.success) {
        // Refresh bookings
        const updatedBookings = await apiService.getBookings();
        setBookings(updatedBookings);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const getUserIdentifier = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.name} ${user.surname} (${user.email})` : `User ${userId}`;
  };

  const getUserUsername = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : `User ${userId}`;
  };

  const getRoomIdentifier = (roomId: number) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? `${room.name} - Floor ${room.floor}` : `Room ${roomId}`;
  };

  if (loading) {
    return <div className="loading">Loading bookings...</div>;
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Bookings</h1>
          <button className="btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'New Booking'}
          </button>
        </div>

        {showForm && (
          <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <h3>Create New Booking</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Payment ID</label>
                <input
                  type="text"
                  value={formData.paymentId}
                  onChange={(e) => setFormData({ ...formData, paymentId: e.target.value })}
                  placeholder="pay_123456"
                  required
                />
              </div>

              <div className="form-group">
                <label>Credit Card Number</label>
                <input
                  type="text"
                  value={formData.creditCardNumber}
                  onChange={(e) => setFormData({ ...formData, creditCardNumber: e.target.value })}
                  placeholder="4532015112830366"
                  required
                />
              </div>

              <div className="form-group">
                <label>Room</label>
                <select
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
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
                <label>User</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.email}>
                      {user.name} {user.surname} ({user.email})
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
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>

              {formErrors.length > 0 && (
                <div className="error">
                  {formErrors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '20px' }}>
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Booking'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ marginLeft: '10px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Room</th>
              <th>Guests</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Payment ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking.id}>
                <td>{booking.id}</td>
                <td>{getUserIdentifier(booking.user_id)}</td>
                <td>{getRoomIdentifier(booking.room_id)}</td>
                <td>{booking.number_of_guests}</td>
                <td>{new Date(booking.start_date).toLocaleDateString()}</td>
                <td>{new Date(booking.end_date).toLocaleDateString()}</td>
                <td>
                  <span style={{
                    color: booking.status === 'Accepted' ? '#28a745' :
                           booking.status === 'Cancelled' ? '#dc3545' : '#ffc107'
                  }}>
                    {booking.status}
                  </span>
                </td>
                <td>{booking.payment_id || 'N/A'}</td>
                <td>
                  {booking.status === 'Accepted' && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleCancel(booking.id.toString(), getUserUsername(booking.user_id))}
                      style={{ fontSize: '12px', padding: '5px 10px' }}
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {bookings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            No bookings found. Create your first booking!
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;