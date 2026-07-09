const User = require('../models/User');
const Family = require('../models/Family');
const FamilyMembership = require('../models/FamilyMembership');
const { sendTokenCookie, clearTokenCookie } = require('../utils/jwt');

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    const { name, email, password, phone, action, familyName, inviteCode } = req.body;

    // Basic required-field validation (more thorough validation in the route layer)
    if (!name || !email || !password || !action) {
      return res.status(400).json({ message: 'name, email, password and action are required.' });
    }

    if (!['create', 'join'].includes(action)) {
      return res.status(400).json({ message: 'action must be "create" or "join".' });
    }

    // Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Create the user
    const user = await User.create({ name, email, password, phone: phone || null });

    let family;
    let role;

    if (action === 'create') {
      // Founder creates a new family
      if (!familyName) {
        return res.status(400).json({ message: 'familyName is required when action is "create".' });
      }
      family = await Family.create({ name: familyName, owner: user._id });
      role = 'owner';
    } else {
      // action === 'join' — redeem an invite code
      if (!inviteCode) {
        return res.status(400).json({ message: 'inviteCode is required when action is "join".' });
      }

      family = await Family.findOne({ inviteCode: inviteCode.trim() });
      if (!family) {
        return res.status(404).json({ message: 'Invite code not found. Please check and try again.' });
      }
      if (family.inviteCodeExpiresAt < new Date()) {
        return res.status(410).json({ message: 'This invite code has expired. Ask the family owner to generate a new one.' });
      }

      // Prevent joining a family the user is already in (shouldn't happen on signup but be safe)
      const alreadyMember = await FamilyMembership.findOne({ user: user._id, family: family._id });
      if (alreadyMember) {
        return res.status(409).json({ message: 'You are already a member of this family.' });
      }

      role = 'member';
    }

    // Create the membership record
    await FamilyMembership.create({ user: user._id, family: family._id, role });

    // Issue JWT cookie
    sendTokenCookie(res, user._id);

    res.status(201).json({
      message: action === 'create' ? 'Family created successfully.' : 'Joined family successfully.',
      user: { _id: user._id, name: user.name, email: user.email },
      family: { _id: family._id, name: family.name },
      role,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Need to explicitly select password since it's excluded by default
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    // Fetch the user's family membership
    const membership = await FamilyMembership.findOne({ user: user._id })
      .populate('family', 'name inviteCode')
      .lean();

    sendTokenCookie(res, user._id);

    res.json({
      message: 'Logged in successfully.',
      user: { _id: user._id, name: user.name, email: user.email },
      family: membership ? { _id: membership.family._id, name: membership.family.name } : null,
      role: membership ? membership.role : null,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
const logout = (req, res) => {
  clearTokenCookie(res);
  res.json({ message: 'Logged out successfully.' });
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const membership = await FamilyMembership.findOne({ user: req.userId })
      .populate('family', 'name inviteCode inviteCodeExpiresAt')
      .lean();

    res.json({
      user: { _id: req.user._id, name: req.user.name, email: req.user.email },
      family: membership
        ? {
            _id: membership.family._id,
            name: membership.family.name,
            inviteCode: membership.family.inviteCode,
            inviteCodeExpiresAt: membership.family.inviteCodeExpiresAt,
          }
        : null,
      role: membership ? membership.role : null,
    });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

module.exports = { signup, login, logout, getMe };
