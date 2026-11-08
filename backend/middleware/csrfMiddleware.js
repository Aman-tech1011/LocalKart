const crypto = require('crypto');
const {
  CSRF_COOKIE,
  getCookie,
  setCsrfCookie,
} = require('../utils/cookies');

const issueCsrfToken = (req, res) => {
  const existingToken = getCookie(req, CSRF_COOKIE);
  const token = typeof existingToken === 'string' && /^[a-f\d]{64}$/i.test(existingToken)
    ? existingToken
    : crypto.randomBytes(32).toString('hex');
  setCsrfCookie(res, token);
  res.status(200).json({ token });
};

const verifyCsrfToken = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const cookieToken = getCookie(req, CSRF_COOKIE);
  const headerToken = req.get('X-CSRF-Token');
  const isValidToken = typeof cookieToken === 'string'
    && typeof headerToken === 'string'
    && /^[a-f\d]{64}$/i.test(cookieToken)
    && /^[a-f\d]{64}$/i.test(headerToken)
    && crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));

  if (!isValidToken) {
    return res.status(403).json({ message: 'Your security token is invalid or expired. Refresh the page and try again.' });
  }

  return next();
};

module.exports = {
  issueCsrfToken,
  verifyCsrfToken,
};
