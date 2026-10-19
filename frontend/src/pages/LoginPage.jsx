import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? formData
        : { email: formData.email, password: formData.password };

      const response = await api.post(endpoint, payload);
      const { token, user } = response.data;

      login(user, token);
      setFormData({ name: '', email: '', password: '', college: '' });

      const next = searchParams.get('next')
        || (searchParams.get('intent') === 'buy' ? '/#marketplace' : '/');
      navigate(next.startsWith('/') && !next.startsWith('//') ? next : '/', { replace: true });
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      setMessage(
        serverMessage ||
          (error.request
            ? isLocalHost
              ? `Could not reach the backend at ${import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_BACKEND_PORT || '6002'}/api`}. Start it with "npm run dev" in the backend folder and try again.`
              : 'Could not reach the server. Please check your connection and try again.'
            : 'Unable to submit the form. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{isRegister ? 'Create account' : 'Welcome back'}</h2>
        <p>Sign in to buy, sell, and message campus students.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label>
                Full Name
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </label>

              <label>
                College
                <input
                  type="text"
                  name="college"
                  autoComplete="organization"
                  value={formData.college}
                  onChange={handleChange}
                  placeholder={import.meta.env.VITE_CAMPUS_NAME || 'University / college name'}
                  required
                />
              </label>
            </>
          )}

          <label>
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@college.edu"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              minLength={isRegister ? 6 : undefined}
              required
            />
          </label>

          <button type="submit" className="btn btn-primary wide-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : isRegister ? 'Create Account' : 'Login'}
          </button>
        </form>

        {message && <p className="form-message" role="alert">{message}</p>}

        <div className="auth-switch">
          {isRegister ? 'Already a member?' : 'New here?'}{' '}
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setIsRegister((current) => !current);
              setMessage('');
            }}
          >
            {isRegister ? 'Login' : 'Create account'}
          </button>
        </div>
        <Link className="auth-back-link" to="/">← Back to marketplace</Link>
      </div>
    </div>
  );
}
