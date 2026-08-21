import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="brand-wrap">
        <div className="brand-badge">L</div>
        <Link to="/" className="brand-name">LocalKart</Link>
      </div>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/sell">Sell</Link>
      </div>

      <div className="nav-actions">
        {user ? (
          <>
            <span className="welcome-user">Hi, {user.name}</span>
            <button className="btn btn-light" onClick={logout}>Logout</button>
          </>
        ) : (
          <Link to="/login" className="btn btn-light">Login</Link>
        )}
        <Link to="/sell" className="btn btn-primary">+ Sell Item</Link>
      </div>
    </nav>
  );
}
