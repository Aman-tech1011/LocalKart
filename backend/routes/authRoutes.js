const express = require('express');
const {
  registerUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
  getCurrentUser,
  logoutUser,
} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const { issueCsrfToken } = require('../middleware/csrfMiddleware');
const { rateLimit } = require('express-rate-limit');

const router = express.Router();

const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please wait a few minutes and try again.' },
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Please wait 15 minutes and try again.' },
});
const emailCodeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many code requests. Please wait an hour and try again.' },
});

router.get('/csrf-token', issueCsrfToken);
router.get('/me', protect, getCurrentUser);
router.post('/logout', mutationLimiter, logoutUser);
router.post('/register', mutationLimiter, emailCodeLimiter, registerUser);
router.post('/verify-email', mutationLimiter, verifyEmail);
router.post('/login', mutationLimiter, loginLimiter, loginUser);
router.post('/forgot-password', mutationLimiter, emailCodeLimiter, forgotPassword);
router.post('/forgot-password/verify-otp', mutationLimiter, verifyPasswordResetOtp);
router.post('/reset-password', mutationLimiter, resetPassword);

module.exports = router;
