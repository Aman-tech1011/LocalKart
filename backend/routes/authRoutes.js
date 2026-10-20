const express = require('express');
const {
  registerUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-email', verifyEmail);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/forgot-password/verify-otp', verifyPasswordResetOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
