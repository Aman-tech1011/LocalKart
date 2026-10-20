import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const PASSWORD_PATTERN = '(?=.*[A-Z])(?=.*\\d)(?=.*[@,./]).{10,}';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestCode = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setStep('otp');
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not send the verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await api.post('/auth/forgot-password/verify-otp', { email, code });
      setResetToken(response.data.resetToken);
      setStep('password');
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not verify the code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        resetToken,
        password,
        confirmPassword,
      });
      navigate('/login', { replace: true, state: { message: response.data.message } });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not reset your password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not resend the code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Reset your password</h2>
        <p>
          {step === 'email' && 'Enter the email address linked to your LocalKart account.'}
          {step === 'otp' && `Enter the 6-digit code sent to ${email}.`}
          {step === 'password' && 'Choose a new password for your account.'}
        </p>

        {step === 'email' && (
          <form className="auth-form" onSubmit={handleRequestCode}>
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@college.edu"
                required
              />
            </label>
            <button className="btn btn-primary wide-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait…' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form className="auth-form" onSubmit={handleVerifyCode}>
            <label>
              Verification code
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                pattern="\d{6}"
                maxLength={6}
                required
              />
            </label>
            <button className="btn btn-primary wide-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait…' : 'Verify OTP'}
            </button>
          </form>
        )}

        {step === 'password' && (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <label>
              New password
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 10 characters"
                minLength={10}
                maxLength={72}
                pattern={PASSWORD_PATTERN}
                title="Use at least 10 characters, one uppercase letter, one number, and one of: @ , . /"
                required
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter the new password again"
                minLength={10}
                maxLength={72}
                pattern={PASSWORD_PATTERN}
                title="Use at least 10 characters, one uppercase letter, one number, and one of: @ , . /"
                required
              />
            </label>
            <small className="field-hint">
              At least 10 characters, including one uppercase letter, one number, and one of @ , . /
            </small>
            <button className="btn btn-primary wide-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait…' : 'Set new password'}
            </button>
          </form>
        )}

        {message && <p className="form-message" role="status">{message}</p>}

        {step === 'otp' && (
          <div className="auth-switch">
            <button className="link-button" type="button" onClick={handleResendCode} disabled={isSubmitting}>
              Resend OTP
            </button>
            {' · '}
            <button
              className="link-button"
              type="button"
              onClick={() => {
                setStep('email');
                setCode('');
                setMessage('');
              }}
            >
              Change email
            </button>
          </div>
        )}

        <Link className="auth-back-link" to="/login">← Back to login</Link>
      </div>
    </div>
  );
}
