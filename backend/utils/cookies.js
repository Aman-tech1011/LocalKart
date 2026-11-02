const isProduction = () => process.env.NODE_ENV === 'production';
const cookiePath = () => (isProduction() ? '/' : '/api');
const SESSION_COOKIE = isProduction() ? '__Host-lk_session' : 'lk_session';
const CSRF_COOKIE = isProduction() ? '__Host-lk_csrf' : 'lk_csrf';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const getCookie = (req, name) => {
  const cookies = req.headers.cookie?.split(';') || [];
  const cookie = cookies.map((value) => value.trim()).find((value) => value.startsWith(`${name}=`));
  if (!cookie) return null;

  try {
    return decodeURIComponent(cookie.slice(name.length + 1));
  } catch {
    return null;
  }
};

const setSessionCookie = (res, token) => {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: cookiePath(),
    maxAge: SESSION_MAX_AGE,
  });
};

const clearSessionCookie = (res) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: cookiePath(),
  });
};

const setCsrfCookie = (res, token) => {
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: cookiePath(),
    maxAge: SESSION_MAX_AGE,
  });
};

module.exports = {
  CSRF_COOKIE,
  SESSION_COOKIE,
  clearSessionCookie,
  getCookie,
  setCsrfCookie,
  setSessionCookie,
};
