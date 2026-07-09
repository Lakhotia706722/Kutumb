const jwt = require('jsonwebtoken');

/**
 * Signs a JWT and sets it as an httpOnly cookie on the response.
 */
const sendTokenCookie = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

  res.cookie('kutumb_token', token, {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: maxAgeMs,
    domain: process.env.COOKIE_DOMAIN || undefined,
  });

  return token;
};

const clearTokenCookie = (res) => {
  res.clearCookie('kutumb_token', {
    httpOnly: true,
    sameSite: 'lax',
  });
};

module.exports = { sendTokenCookie, clearTokenCookie };
