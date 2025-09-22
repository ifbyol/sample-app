import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="nav">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          Hotel Booking
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/bookings" className={`nav-link ${isActive('/bookings') ? 'active' : ''}`}>
            Bookings
          </Link>
          <Link to="/rooms" className={`nav-link ${isActive('/rooms') ? 'active' : ''}`}>
            Rooms
          </Link>
          <Link to="/users" className={`nav-link ${isActive('/users') ? 'active' : ''}`}>
            Users
          </Link>
          <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
            Admin
          </Link>
          <Link to="/system-status" className={`nav-link ${isActive('/system-status') ? 'active' : ''}`}>
            System Status
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;