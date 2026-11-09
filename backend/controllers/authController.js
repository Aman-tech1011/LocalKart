const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');
const PasswordReset = require('../models/PasswordReset');
const generateToken = require('../utils/generateToken');
const {
  clearSessionCookie,
  getCookie,
  SESSION_COOKIE,
  setSessionCookie,
} = require('../utils/cookies');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[@,./]).{10,}$/;
const OTP_PATTERN = /^\d{6}$/;
const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const SEND_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const MAX_OTP_ATTEMPTS = 5;
const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;

const getEmailConfigurationError = () => {
  const requiredSettings = ['RESEND_API_KEY', 'JWT_SECRET'];
  const missingSettings = requiredSettings.filter((setting) => !process.env[setting]);
  if (missingSettings.length > 0) {
    return `Email verification is not configured. Add these settings to backend/.env: ${missingSettings.join(', ')}.`;
  }
  return null;
};

const createOtpHash = (email, code) => crypto
  .createHmac('sha256', process.env.JWT_SECRET)
  .update(`${email}:${code}`)
  .digest();

// Email is sent via the Resend HTTP API (not SMTP) because Render's
// outbound SMTP connections to Gmail time out on every port. Resend works
// over HTTPS, which Render can reach. The sender defaults to Resend's
// onboarding address; set RESEND_FROM to a verified domain sender to use
// a custom from address.
const sendEmailViaResend = async ({ to, subject, text }) => {
  const configurationError = getEmailConfigurationError();
  if (configurationError) throw new Error(configurationError);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'LocalKart <onboarding@resend.dev>',
      to,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Email sending failed (${response.status}): ${detail}`);
  }
};

const sendVerificationEmail = async (email, code) => {
  await sendEmailViaResend({
    to: email,
    subject: 'Your LocalKart verification code',
    text: `Your LocalKart verification code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
  });
};

const sendPasswordResetEmail = async (email, code) => {
  await sendEmailViaResend({
    to: email,
    subject: 'Reset your LocalKart password',
    text: `Your LocalKart password reset code is ${code}. It expires in 10 minutes. If you did not request a password reset, you can ignore this email.`,
  });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!EMAIL_PATTERN.test(cleanEmail) || cleanEmail.length > 254) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const emailConfigurationError = getEmailConfigurationError();
    if (emailConfigurationError) {
      return res.status(503).json({ message: emailConfigurationError });
    }

    const now = new Date();
    let reset = await PasswordReset.findOne({ email: cleanEmail });
    const isWithinSendWindow = reset
      && now.getTime() - reset.sendWindowStartedAt.getTime() < SEND_LIMIT_WINDOW_MS;

    if (reset && now.getTime() - reset.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
      return res.status(429).json({ message: 'Please wait a minute before requesting another code.' });
    }
    if (isWithinSendWindow && reset.sendCount >= MAX_SENDS_PER_WINDOW) {
      return res.status(429).json({ message: 'Too many verification codes requested. Please try again in an hour.' });
    }

    const user = await User.findOne({ email: cleanEmail });
    const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    if (!reset) reset = new PasswordReset({ email: cleanEmail });

    reset.codeHash = createOtpHash(cleanEmail, code);
    reset.expiresAt = new Date(now.getTime() + OTP_TTL_MS);
    reset.attempts = 0;
    reset.lastSentAt = now;
    reset.sendWindowStartedAt = isWithinSendWindow ? reset.sendWindowStartedAt : now;
    reset.sendCount = isWithinSendWindow ? reset.sendCount + 1 : 1;
    reset.resetTokenHash = undefined;
    reset.resetTokenExpiresAt = undefined;
    await reset.save();

    if (user) {
      try {
        await sendPasswordResetEmail(cleanEmail, code);
      } catch (error) {
        console.error('Password reset email delivery failed:', error.message);
        return res.status(503).json({ message: 'Could not send the password reset email. Please try again later.' });
      }
    }

    return res.status(200).json({
      message: 'If an account exists for this email, a verification code has been sent.',
    });
  } catch (error) {
    console.error('Password reset request failed:', error);
    return res.status(500).json({ message: 'Could not start password reset. Please try again.' });
  }
};

const verifyPasswordResetOtp = async (req, res) => {
  try {
    const { email, code } = req.body || {};
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!EMAIL_PATTERN.test(cleanEmail) || cleanEmail.length > 254 || typeof code !== 'string' || !OTP_PATTERN.test(code)) {
      return res.status(400).json({ message: 'Enter a valid email address and 6-digit verification code.' });
    }

    const reset = await PasswordReset.findOne({
      email: cleanEmail,
      expiresAt: { $gt: new Date() },
      attempts: { $lt: MAX_OTP_ATTEMPTS },
      resetTokenHash: { $exists: false },
    });
    if (!reset) {
      return res.status(400).json({ message: 'Verification code is invalid or expired. Please request a new code.' });
    }

    const actualHash = createOtpHash(cleanEmail, code);
    if (!crypto.timingSafeEqual(reset.codeHash, actualHash)) {
      const updatedReset = await PasswordReset.findOneAndUpdate(
        {
          email: cleanEmail,
          codeHash: reset.codeHash,
          expiresAt: { $gt: new Date() },
          attempts: { $lt: MAX_OTP_ATTEMPTS },
          resetTokenHash: { $exists: false },
        },
        { $inc: { attempts: 1 } },
        { new: true }
      );
      if (!updatedReset || updatedReset.attempts >= MAX_OTP_ATTEMPTS) {
        await PasswordReset.deleteOne({ email: cleanEmail, attempts: { $gte: MAX_OTP_ATTEMPTS } });
        return res.status(429).json({ message: 'Too many incorrect codes. Please request a new code.' });
      }
      return res.status(400).json({ message: 'Incorrect verification code. Please try again.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    const verifiedReset = await PasswordReset.findOneAndUpdate(
      {
        email: cleanEmail,
        codeHash: reset.codeHash,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: MAX_OTP_ATTEMPTS },
        resetTokenHash: { $exists: false },
      },
      {
        $set: {
          resetTokenHash: crypto.createHash('sha256').update(resetToken).digest(),
          resetTokenExpiresAt,
          expiresAt: resetTokenExpiresAt,
        },
        $unset: { codeHash: '' },
      },
      { new: true }
    );

    if (!verifiedReset) {
      return res.status(400).json({ message: 'Verification code is invalid or expired. Please request a new code.' });
    }

    return res.status(200).json({ message: 'Email verified. Set your new password.', resetToken });
  } catch (error) {
    console.error('Password reset code verification failed:', error);
    return res.status(500).json({ message: 'Could not verify the code. Please try again.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, password, confirmPassword } = req.body || {};
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!EMAIL_PATTERN.test(cleanEmail) || cleanEmail.length > 254
      || typeof resetToken !== 'string' || !/^[a-f\d]{64}$/i.test(resetToken)) {
      return res.status(400).json({ message: 'Password reset session is invalid. Please verify your email again.' });
    }
    if (typeof password !== 'string' || !PASSWORD_PATTERN.test(password) || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({
        message: 'Password must be at least 10 characters and include an uppercase letter, a number, and one of these symbols: @ , . / (maximum 72 bytes)',
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const reset = await PasswordReset.findOneAndUpdate(
      {
        email: cleanEmail,
        resetTokenHash: crypto.createHash('sha256').update(resetToken).digest(),
        resetTokenExpiresAt: { $gt: new Date() },
      },
      { $unset: { resetTokenHash: '', resetTokenExpiresAt: '' } },
      { new: false }
    );
    if (!reset) {
      return res.status(400).json({ message: 'Password reset session is invalid or expired. Please request a new code.' });
    }

    const result = await User.updateOne(
      { email: cleanEmail },
      { $set: { password: hashedPassword }, $inc: { authVersion: 1 } }
    );
    await PasswordReset.deleteOne({ _id: reset._id });
    if (!result.matchedCount) {
      return res.status(400).json({ message: 'Account was not found. Please create an account first.' });
    }

    clearSessionCookie(res);
    return res.status(200).json({ message: 'Password reset successful. Please log in with your new password.' });
  } catch (error) {
    console.error('Password reset failed:', error);
    return res.status(500).json({ message: 'Could not reset your password. Please try again.' });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, college, phone } = req.body || {};
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    const cleanCollege = typeof college === 'string' ? college.trim() : '';
    if (!cleanName || !cleanEmail || !cleanCollege || typeof password !== 'string' || !password) {
      return res.status(400).json({
        message: 'Please provide your name, university, email and password',
      });
    }

    // Lenient campus match: accept any reasonable variation of the campus
    // name, e.g. "GLA", "GLA University", "GLA University Mathura",
    // "GLA University Mathura Uttar Pradesh". The campus key is the first
    // word of CAMPUS_NAME and must appear as a whole word in the input, so
    // "Glasgow" does not match "GLA".
    const campusName = process.env.CAMPUS_NAME?.trim();
    if (campusName) {
      const campusKey = campusName.split(/\s+/)[0].toLowerCase();
      const collegeWords = cleanCollege.toLowerCase().split(/[\s,]+/).filter(Boolean);
      if (!collegeWords.includes(campusKey)) {
        return res.status(403).json({ message: `LocalKart is currently only available to ${campusName} students` });
      }
    }

    if (!EMAIL_PATTERN.test(cleanEmail) || cleanEmail.length > 254) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (!PASSWORD_PATTERN.test(password) || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({
        message: 'Password must be at least 10 characters and include an uppercase letter, a number, and one of these symbols: @ , . / (maximum 72 bytes)',
      });
    }

    const emailConfigurationError = getEmailConfigurationError();
    if (emailConfigurationError) {
      return res.status(503).json({ message: emailConfigurationError });
    }

    const userExists = await User.findOne({ email: cleanEmail });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const now = new Date();
    let verification = await EmailVerification.findOne({ email: cleanEmail });
    const isWithinSendWindow = verification
      && now.getTime() - verification.sendWindowStartedAt.getTime() < SEND_LIMIT_WINDOW_MS;

    if (verification && now.getTime() - verification.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
      return res.status(429).json({ message: 'Please wait a minute before requesting another code.' });
    }

    if (isWithinSendWindow && verification.sendCount >= MAX_SENDS_PER_WINDOW) {
      return res.status(429).json({ message: 'Too many verification codes requested. Please try again in an hour.' });
    }

    const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const hashedPassword = await bcrypt.hash(password, 10);
    const sendCount = isWithinSendWindow ? verification.sendCount + 1 : 1;

    if (!verification) {
      verification = new EmailVerification({ email: cleanEmail });
    }

    verification.name = cleanName;
    verification.password = hashedPassword;
    verification.college = cleanCollege;
    verification.phone = typeof phone === 'string' ? phone.trim() : '';
    verification.codeHash = createOtpHash(cleanEmail, code);
    verification.expiresAt = new Date(now.getTime() + OTP_TTL_MS);
    verification.attempts = 0;
    verification.lastSentAt = now;
    verification.sendWindowStartedAt = isWithinSendWindow
      ? verification.sendWindowStartedAt
      : now;
    verification.sendCount = sendCount;
    await verification.save();

    try {
      await sendVerificationEmail(cleanEmail, code);
    } catch (error) {
      console.error('Verification email delivery failed:', error.message);
      return res.status(503).json({
        message: error.message.startsWith('Email verification is not configured')
          ? error.message
          : 'Could not send the verification email. Please try again later.',
      });
    }

    return res.status(200).json({
      message: 'Verification code sent. Please check your email.',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please check the registration details' });
    }
    console.error('Registration failed:', error);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body || {};
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!EMAIL_PATTERN.test(cleanEmail) || cleanEmail.length > 254 || typeof code !== 'string' || !OTP_PATTERN.test(code)) {
      return res.status(400).json({ message: 'Enter a valid email address and 6-digit verification code.' });
    }

    const verification = await EmailVerification.findOneAndUpdate(
      {
        email: cleanEmail,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: MAX_OTP_ATTEMPTS },
      },
      { $inc: { attempts: 1 } },
      { new: true }
    );
    if (!verification) {
      return res.status(400).json({ message: 'Verification code is invalid, expired, or has too many failed attempts. Please request a new code.' });
    }

    const actualHash = createOtpHash(cleanEmail, code);
    const isCodeValid = crypto.timingSafeEqual(verification.codeHash, actualHash);

    if (!isCodeValid) {
      if (verification.attempts >= MAX_OTP_ATTEMPTS) {
        await EmailVerification.deleteOne({ _id: verification._id });
        return res.status(429).json({ message: 'Too many incorrect codes. Please request a new code.' });
      }
      return res.status(400).json({ message: 'Incorrect verification code. Please try again.' });
    }

    const user = await User.create({
      name: verification.name,
      email: verification.email,
      password: verification.password,
      college: verification.college,
      phone: verification.phone,
      role: 'student',
    });
    await EmailVerification.deleteOne({ _id: verification._id });

    setSessionCookie(res, generateToken(user._id, user.authVersion));
    return res.status(201).json({
      message: 'Email verified and account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists' });
    }
    console.error('Email verification failed:', error);
    return res.status(500).json({ message: 'Email verification failed. Please try again.' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!EMAIL_PATTERN.test(cleanEmail) || cleanEmail.length > 254 || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: cleanEmail }).select('+authVersion');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    setSessionCookie(res, generateToken(user._id, user.authVersion));
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

const getCurrentUser = (req, res) => {
  const { _id, name, email, college, phone, role } = req.user;
  return res.status(200).json({
    user: { id: _id, name, email, college, phone, role },
  });
};

const logoutUser = async (req, res) => {
  try {
    const token = getCookie(req, SESSION_COOKIE);
    if (token) {
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        if (!(error instanceof jwt.JsonWebTokenError)) throw error;
      }

      if (decoded?.id) {
        await User.updateOne({ _id: decoded.id }, { $inc: { authVersion: 1 } });
      }
    }

    clearSessionCookie(res);
    return res.status(200).json({ message: 'You have been signed out.' });
  } catch (error) {
    console.error('Logout failed:', error);
    return res.status(500).json({ message: 'Could not sign out. Please try again.' });
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
  getCurrentUser,
  logoutUser,
};
