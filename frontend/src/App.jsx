import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import BuyPage from './pages/BuyPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import SellPage from './pages/SellPage';
import DashboardPage from './pages/DashboardPage';
import ProductPage from './pages/ProductPage';
import MessagesPage from './pages/MessagesPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles.css';

function RequireAuth({ children }) {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return children;
}

function App() {
  const [theme, setTheme] = useState(() => (
    localStorage.getItem('localkart-theme') === 'dark' ? 'dark' : 'light'
  ));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('localkart-theme', theme);
  }, [theme]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar theme={theme} onThemeChange={setTheme} />
          <main className="page-container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/buy" element={<BuyPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/sell" element={<RequireAuth><SellPage /></RequireAuth>} />
              <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
              <Route path="/product/:productId" element={<ProductPage />} />
              <Route path="/messages" element={<RequireAuth><MessagesPage /></RequireAuth>} />
              <Route path="/messages/:productId" element={<RequireAuth><MessagesPage /></RequireAuth>} />
              <Route path="/messages/:productId/:otherUserId" element={<RequireAuth><MessagesPage /></RequireAuth>} />
            </Routes>
          </main>
          <footer className="site-footer">
            <div className="footer-inner">
              <div className="footer-brand">
                <div className="brand-wrap">
                  <div className="brand-badge">L</div>
                  <span className="brand-name">LocalKart</span>
                </div>
                <p>
                  Affordable essentials, trusted deals, and a safer way to buy and sell
                  within your campus community.
                </p>
                <div className="footer-meta">
                  <span>Campus trusted</span>
                  <span>Verified listings</span>
                </div>
              </div>

              <div className="footer-column">
                <h4>Explore</h4>
                <Link to="/">Home</Link>
                <Link to="/buy">Buy</Link>
                <Link to="/sell">Sell</Link>
                <Link to="/dashboard">Dashboard</Link>
              </div>

              <div className="footer-column">
                <h4>Account</h4>
                <Link to="/login">Login</Link>
                <Link to="/messages">Messages</Link>
                <Link to="/forgot-password">Reset password</Link>
                <Link to="/dashboard">Profile</Link>
              </div>

              <div className="footer-column">
                <h4>Support</h4>
                <Link to="/">Help center</Link>
                <Link to="/">Safety</Link>
                <Link to="/">Community rules</Link>
                <Link to="/">Contact us</Link>
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
