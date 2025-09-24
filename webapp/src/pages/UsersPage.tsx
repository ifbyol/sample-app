import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { User } from '../types';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await apiService.getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.surname?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div>
      <div className="card">
        <h1>Users</h1>
        <p>Manage system users and customer information.</p>

        <div className="form-group">
          <label>Search Users</label>
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Username</th>
              <th>Date of Birth</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name} {user.surname}</td>
                <td>{user.email}</td>
                <td>{user.username}</td>
                <td>{new Date(user.date_of_birth).toLocaleDateString()}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && searchTerm && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            No users found matching "{searchTerm}".
          </div>
        )}

        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            No users found.
          </div>
        )}
      </div>

      <div className="card">
        <h2>User Management</h2>
        <p>This section displays all users in the hotel booking system. Users can:</p>
        <ul>
          <li>Make hotel room reservations</li>
          <li>Cancel their existing bookings</li>
          <li>View their booking history</li>
          <li>Update their profile information</li>
        </ul>

        <h3>User Information</h3>
        <p>Each user profile includes:</p>
        <ul>
          <li><strong>Personal Details:</strong> Full name and date of birth</li>
          <li><strong>Email Address:</strong> Primary contact and login identifier</li>
          <li><strong>Username:</strong> Unique username for system access</li>
          <li><strong>Account Dates:</strong> Registration and last update timestamps</li>
        </ul>

        <div style={{ marginTop: '20px' }}>
          <p><strong>Total Users:</strong> {users.length}</p>
          <p><strong>Filtered Results:</strong> {filteredUsers.length}</p>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;