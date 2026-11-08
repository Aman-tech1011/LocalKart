const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getCookie, SESSION_COOKIE } = require('../utils/cookies');

const protect = async (req, res, next) => {
  const token = getCookie(req, SESSION_COOKIE);
  if (!token) {
    return res.status(401).json({ message: 'Please sign in to continue.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Your session is invalid or expired. Please sign in again.' });
  }

  try {
    req.user = await User.findById(decoded.id).select('+authVersion -password');

    if (!req.user) {
      return res.status(401).json({ message: 'Your account could not be found. Please sign in again.' });
    }
    if (Number(decoded.authVersion || 0) !== Number(req.user.authVersion || 0)) {
      return res.status(401).json({ message: 'Your session has ended. Please sign in again.' });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = protect;
