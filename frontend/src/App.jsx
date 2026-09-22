import React from 'react';
import { BrowserRouter, Link, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SellPage from './pages/SellPage';
import DashboardPage from './pages/DashboardPage';
import { AuthProvider } from './context/AuthContext';
import './styles.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <main className="page-container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/sell" element={<SellPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </main>
          <footer className="site-footer">
            <div className="footer-content">
              <div className="footer-brand">
                <div className="brand-wrap">
                  <div className="brand-badge">L</div>
                  <span className="brand-name">LocalKart</span>
                </div>
                <p>Affordable student essentials, right around your campus.</p>
              </div>

              <div className="footer-links">
                <Link to="/">Home</Link>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/sell">Sell an item</Link>
              </div>
            </div>
            <div className="footer-bottom">
              <span>© {new Date().getFullYear()} LocalKart</span>
              <span>Built for campus communities</span>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
