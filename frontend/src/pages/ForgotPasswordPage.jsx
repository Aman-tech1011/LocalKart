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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
              <span className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
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
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.59 9.59 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </span>
            </label>
            <label>
              Confirm new password
              <span className="password-field">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
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
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showConfirmPassword}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.59 9.59 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </span>
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
