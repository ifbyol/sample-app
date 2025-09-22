import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import BookingsPage from './pages/BookingsPage';
import AdminPage from './pages/AdminPage';
import RoomsPage from './pages/RoomsPage';
import UsersPage from './pages/UsersPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;