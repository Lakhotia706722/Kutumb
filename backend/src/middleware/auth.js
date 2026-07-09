const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the JWT stored in the httpOnly cookie.
 * Attaches req.user (the full user document) and req.userId on success.
 */
const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.kutumb_token;

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
    }

    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.userId = user._id.toString();
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ message: 'Internal server error during authentication.' });
  }
};

module.exports = { protect };
