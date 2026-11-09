import React, { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import NeonAuth from './NeonAuth';
import OtpVerification from './OtpVerification';

// Orchestrator only: the neon lamp form (NeonAuth) handles login/signup,
// the V4 cube page (OtpVerification) handles the email-code step.
// All API calls stay here so the visuals never fake a result.
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
  });
  const [message, setMessage] = useState(location.state?.message || '');
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
      if (isRegister) {
        setIsOtpSent(true);
        setMessage(response.data.message);
        return;
      }

      login(response.data.user);
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

  // Real verification: the backend compares the hash of the emailed code.
  // Returns { ok, user?, message? } — the OTP page animates from this.
  const verifyCode = async (code) => {
    try {
      const response = await api.post('/auth/verify-email', { email: formData.email, code });
      return { ok: true, user: response.data.user };
    } catch (error) {
      return {
        ok: false,
        message: error.response?.data?.message || 'Could not verify the code. Please try again.',
      };
    }
  };

  // Real resend: re-posting /auth/register re-issues a fresh code
  // (backend enforces the 60s cooldown + 5/hour per-email cap).
  const resendCode = async () => {
    try {
      const response = await api.post('/auth/register', formData);
      return { ok: true, message: response.data.message };
    } catch (error) {
      return {
        ok: false,
        message: error.response?.data?.message || 'Could not resend the verification code. Please try again.',
      };
    }
  };

  const handleVerified = (user) => {
    login(user);
    setFormData({ name: '', email: '', password: '', college: '' });
    setIsOtpSent(false);
    const next = searchParams.get('next')
      || (searchParams.get('intent') === 'buy' ? '/#marketplace' : '/');
    navigate(next.startsWith('/') && !next.startsWith('//') ? next : '/', { replace: true });
  };

  if (isRegister && isOtpSent) {
    return (
      <OtpVerification
        email={formData.email}
        onVerify={verifyCode}
        onResend={resendCode}
        onBack={() => setIsOtpSent(false)}
        onSuccess={handleVerified}
      />
    );
  }

  return (
    <NeonAuth
      isRegister={isRegister}
      formData={formData}
      onChange={handleChange}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      message={message}
      onToggleMode={() => {
        setIsRegister((current) => !current);
        setIsOtpSent(false);
        setMessage('');
      }}
    />
  );
}
