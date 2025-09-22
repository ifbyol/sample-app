import React from 'react';

const HomePage: React.FC = () => {

  return (
    <div>
      <div className="card">
        <h1>Hotel Booking Management System</h1>
        <p>Welcome to the hotel booking management system. This application provides a complete solution for managing hotel bookings, rooms, users, and administrative tasks.</p>

        <div style={{
          padding: '15px',
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#1976d2', margin: '0 0 10px 0' }}>Quick Navigation</h3>
          <p style={{ margin: '0', color: '#424242' }}>
            Use the navigation menu above to access different sections of the application.
            Check the <strong>System Status</strong> page to monitor service health in real-time.
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Available Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div>
            <h3>📅 Booking Management</h3>
            <p>Create, view, and cancel hotel room bookings with integrated payment processing.</p>
            <ul>
              <li>Real-time booking creation</li>
              <li>Payment integration</li>
              <li>Booking cancellation</li>
              <li>Status tracking</li>
            </ul>
          </div>

          <div>
            <h3>🏨 Room Management</h3>
            <p>Manage hotel room inventory and availability.</p>
            <ul>
              <li>Room listing and details</li>
              <li>Capacity management</li>
              <li>Availability tracking</li>
              <li>Room validation</li>
            </ul>
          </div>

          <div>
            <h3>👥 User Management</h3>
            <p>Manage system users and customer information.</p>
            <ul>
              <li>User directory</li>
              <li>User registration</li>
              <li>Profile management</li>
              <li>Booking history</li>
            </ul>
          </div>

          <div>
            <h3>⚙️ Administration</h3>
            <p>Administrative tools for hotel staff management and customer service.</p>
            <ul>
              <li>Employee management</li>
              <li>Complaint tracking</li>
              <li>System monitoring</li>
              <li>Reporting tools</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;