const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[@,./]).{10,}$/;
const OTP_PATTERN = /^\d{6}$/;
const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const SEND_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const MAX_OTP_ATTEMPTS = 5;

const getEmailConfigurationError = () => {
  const requiredSettings = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'JWT_SECRET'];
  const missingSettings = requiredSettings.filter((setting) => !process.env[setting]);
  if (missingSettings.length > 0) {
    return `Email verification is not configured. Add these settings to backend/.env: ${missingSettings.join(', ')}.`;
  }

  const port = Number(process.env.SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return 'SMTP_PORT must be a valid port number.';
  }
  return null;
};

const createOtpHash = (email, code) => crypto
  .createHmac('sha256', process.env.JWT_SECRET)
  .update(`${email}:${code}`)
  .digest();

const sendVerificationEmail = async (email, code) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  const configurationError = getEmailConfigurationError();
  if (configurationError) throw new Error(configurationError);

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || SMTP_USER,
    to: email,
    subject: 'Your LocalKart verification code',
    text: `Your LocalKart verification code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
  });
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
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

    if (process.env.CAMPUS_NAME && cleanCollege.toLowerCase() !== process.env.CAMPUS_NAME.trim().toLowerCase()) {
      return res.status(403).json({ message: `LocalKart is currently only available to ${process.env.CAMPUS_NAME.trim()} students` });
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

    return res.status(201).json({
      message: 'Email verified and account created successfully',
      token: generateToken(user._id),
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

    if (!cleanEmail || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({
      message: 'Login successful',
      token: generateToken(user._id),
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

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
};
