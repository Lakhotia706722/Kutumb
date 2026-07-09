const Family = require('../models/Family');
const FamilyMembership = require('../models/FamilyMembership');
const User = require('../models/User');

// ─── GET /api/family/me ───────────────────────────────────────────────────────
// Returns the current user's family details and member list
const getMyFamily = async (req, res) => {
  try {
    const membership = await FamilyMembership.findOne({ user: req.userId })
      .populate('family')
      .lean();

    if (!membership) {
      return res.status(404).json({ message: 'You are not part of any family yet.' });
    }

    const family = membership.family;

    // Fetch all members of this family
    const memberships = await FamilyMembership.find({ family: family._id })
      .populate('user', 'name email')
      .lean();

    const members = memberships.map((m) => ({
      _id: m.user._id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    res.json({
      family: {
        _id: family._id,
        name: family.name,
        owner: family.owner,
        inviteCode: family.inviteCode,
        inviteCodeExpiresAt: family.inviteCodeExpiresAt,
        createdAt: family.createdAt,
      },
      members,
      myRole: membership.role,
    });
  } catch (err) {
    console.error('getMyFamily error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// ─── POST /api/family/refresh-invite ─────────────────────────────────────────
// Owner regenerates the invite code
const refreshInviteCode = async (req, res) => {
  try {
    const membership = await FamilyMembership.findOne({ user: req.userId }).lean();
    if (!membership) {
      return res.status(404).json({ message: 'You are not part of any family.' });
    }
    if (membership.role !== 'owner') {
      return res.status(403).json({ message: 'Only the family owner can refresh the invite code.' });
    }

    const family = await Family.findById(membership.family);
    if (!family) {
      return res.status(404).json({ message: 'Family not found.' });
    }

    family.refreshInviteCode();
    await family.save();

    res.json({
      message: 'Invite code refreshed.',
      inviteCode: family.inviteCode,
      inviteCodeExpiresAt: family.inviteCodeExpiresAt,
    });
  } catch (err) {
    console.error('refreshInviteCode error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// ─── POST /api/family/join ────────────────────────────────────────────────────
// Logged-in user joins an existing family by invite code
// (Used for users who are already registered and want to join a second family,
//  or re-join. The primary join-on-signup flow is in authController.)
const joinFamily = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ message: 'inviteCode is required.' });
    }

    const family = await Family.findOne({ inviteCode: inviteCode.trim() });
    if (!family) {
      return res.status(404).json({ message: 'Invite code not found.' });
    }
    if (family.inviteCodeExpiresAt < new Date()) {
      return res.status(410).json({ message: 'This invite code has expired. Ask the family owner to generate a new one.' });
    }

    const alreadyMember = await FamilyMembership.findOne({ user: req.userId, family: family._id });
    if (alreadyMember) {
      return res.status(409).json({ message: 'You are already a member of this family.' });
    }

    await FamilyMembership.create({ user: req.userId, family: family._id, role: 'member' });

    res.status(201).json({
      message: 'Joined family successfully.',
      family: { _id: family._id, name: family.name },
    });
  } catch (err) {
    console.error('joinFamily error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

module.exports = { getMyFamily, refreshInviteCode, joinFamily };
