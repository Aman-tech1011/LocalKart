import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    setSearch(new URLSearchParams(location.search).get('search') || '');
    setProfileOpen(false);
  }, [location.search]);

  useEffect(() => {
    const closeProfile = (event) => {
      if (event.key === 'Escape' || (event.type === 'pointerdown' && !profileRef.current?.contains(event.target))) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeProfile);
    document.addEventListener('keydown', closeProfile);
    return () => {
      document.removeEventListener('pointerdown', closeProfile);
      document.removeEventListener('keydown', closeProfile);
    };
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    const buyPath = user ? '/buy' : '/login?intent=buy&next=%2Fbuy';
    navigate(query && user ? `/buy?search=${encodeURIComponent(query)}` : buyPath);
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/', { replace: true });
  };

  const buyPath = user ? '/buy' : '/login?intent=buy&next=%2Fbuy';
  const sellPath = user ? '/sell' : '/login?next=%2Fsell';
  const buyIsActive = location.pathname === '/buy';
  const sellIsActive = location.pathname === '/sell';
  const initials = (user?.name || 'Student')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <nav className="navbar">
      <div className="brand-wrap">
        <div className="brand-badge" aria-hidden="true">L</div>
        <Link to="/" className="brand-name">LocalKart</Link>
      </div>

      <form className="nav-search" role="search" onSubmit={handleSearch}>
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          aria-label="Search campus listings"
          placeholder="Search books, mobiles, cycles..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button type="submit" aria-label="Search">Search</button>
      </form>

      <div className="nav-actions">
        <Link to={buyPath} className={`btn ${buyIsActive ? 'btn-primary' : 'btn-light'}`}>Buy</Link>
        <Link to={sellPath} className={`btn ${sellIsActive ? 'btn-primary' : 'btn-light'}`}>Sell</Link>
        {user && (
          <div className="profile-menu" ref={profileRef}>
            <button
              className="profile-trigger"
              type="button"
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              onClick={() => setProfileOpen((open) => !open)}
            >
              <span className="profile-avatar" aria-hidden="true">{initials}</span>
            </button>
            {profileOpen && (
              <div className="profile-dropdown" role="menu">
                <div className="profile-summary">
                  <span className="profile-avatar profile-avatar-large" aria-hidden="true">{initials}</span>
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                    <span>{user.college || 'Campus student'}</span>
                  </div>
                </div>
                <Link role="menuitem" to="/dashboard" onClick={() => setProfileOpen(false)}>My dashboard</Link>
                <Link role="menuitem" to="/messages" onClick={() => setProfileOpen(false)}>Messages</Link>
                <button role="menuitem" type="button" onClick={handleLogout}>Log out</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
