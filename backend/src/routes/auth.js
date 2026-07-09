const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { signup, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateSignup, validateLogin } = require('../middleware/validate');

// Strict rate limit on auth endpoints — 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait 15 minutes and try again.' },
  skipSuccessfulRequests: false,
});

router.post('/signup', authLimiter, validateSignup, signup);
router.post('/login',  authLimiter, validateLogin,  login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
