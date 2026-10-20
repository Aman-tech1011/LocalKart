import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
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
      const endpoint = isRegister
        ? isOtpSent ? '/auth/verify-email' : '/auth/register'
        : '/auth/login';
      const payload = isRegister
        ? isOtpSent
          ? { email: formData.email, code: verificationCode }
          : formData
        : { email: formData.email, password: formData.password };

      const response = await api.post(endpoint, payload);
      if (isRegister && !isOtpSent) {
        setIsOtpSent(true);
        setMessage(response.data.message);
        return;
      }

      const { token, user } = response.data;

      login(user, token);
      setFormData({ name: '', email: '', password: '', college: '' });
      setVerificationCode('');
      setIsOtpSent(false);

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

  const handleResendCode = async () => {
    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await api.post('/auth/register', formData);
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not resend the verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{isRegister ? 'Create account' : 'Welcome back'}</h2>
        <p>
          {isOtpSent
            ? `Enter the 6-digit code sent to ${formData.email}.`
            : 'Sign in to buy, sell, and message campus students.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && !isOtpSent && (
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

          {(!isRegister || !isOtpSent) && (
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
          )}

          {(!isRegister || !isOtpSent) && (
            <label>
              Password
              <input
                type="password"
                name="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 10 characters"
                minLength={isRegister ? 10 : undefined}
                maxLength={isRegister ? 72 : undefined}
                pattern={isRegister ? '(?=.*[A-Z])(?=.*\\d)(?=.*[@,./]).{10,}' : undefined}
                title={isRegister ? 'Use at least 10 characters, one uppercase letter, one number, and one of: @ , . /' : undefined}
                required
              />
              {isRegister && (
                <small>
                  At least 10 characters, including one uppercase letter, one number, and one of @ , . /
                </small>
              )}
            </label>
          )}

          {isRegister && isOtpSent && (
            <label>
              Verification code
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                pattern="\d{6}"
                maxLength={6}
                required
              />
            </label>
          )}

          <button type="submit" className="btn btn-primary wide-btn" disabled={isSubmitting}>
            {isSubmitting
              ? 'Please wait…'
              : isRegister
                ? isOtpSent ? 'Verify Email & Create Account' : 'Send Verification Code'
                : 'Login'}
          </button>
        </form>

        {message && <p className="form-message" role="alert">{message}</p>}

        {isRegister && isOtpSent && (
          <div className="auth-switch">
            <button type="button" className="link-button" onClick={handleResendCode} disabled={isSubmitting}>
              Resend code
            </button>
            {' · '}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setIsOtpSent(false);
                setVerificationCode('');
                setMessage('');
              }}
            >
              Change details
            </button>
          </div>
        )}

        <div className="auth-switch">
          {isRegister ? 'Already a member?' : 'New here?'}{' '}
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setIsRegister((current) => !current);
              setIsOtpSent(false);
              setVerificationCode('');
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
