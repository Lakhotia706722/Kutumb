const FamilyMembership = require('../models/FamilyMembership');
const { computeScore } = require('../scoring/scoreEngine');

// ─── GET /api/score ───────────────────────────────────────────────────────────
const getScore = async (req, res) => {
  try {
    const membership = await FamilyMembership.findOne({ user: req.userId }).lean();
    if (!membership) {
      return res.status(403).json({ message: 'You are not part of any family.' });
    }

    const result = await computeScore(membership.family);
    res.json(result);
  } catch (err) {
    console.error('getScore error:', err);
    res.status(500).json({ message: 'Something went wrong computing the score.' });
  }
};

module.exports = { getScore };
