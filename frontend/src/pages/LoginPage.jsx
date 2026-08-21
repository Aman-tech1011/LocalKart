import React, { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? formData
        : { email: formData.email, password: formData.password };

      const response = await api.post(endpoint, payload);
      const { token, user } = response.data;

      login(user, token);
      setMessage(isRegister ? 'Account created successfully!' : 'Login successful!');

      window.location.href = '/';
    } catch (error) {
      setMessage(error.response?.data?.message || 'Something went wrong');
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
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                />
              </label>

              <label>
                College
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  placeholder="College name"
                />
              </label>
            </>
          )}

          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@college.edu"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </label>

          <button type="submit" className="btn btn-primary wide-btn">
            {isRegister ? 'Create Account' : 'Login'}
          </button>
        </form>

        {message && <p className="form-message">{message}</p>}

        <div className="auth-switch">
          {isRegister ? 'Already a member?' : 'New here?'}{' '}
          <button type="button" className="link-button" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Login' : 'Create account'}
          </button>
        </div>
      </div>
    </div>
  );
}
