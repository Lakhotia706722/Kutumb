const Alert = require('../models/Alert');
const FamilyMembership = require('../models/FamilyMembership');
const { runAlertSweep } = require('../alerts/alertEngine');

// ─── Helper ───────────────────────────────────────────────────────────────────
const getFamilyId = async (userId) => {
  const m = await FamilyMembership.findOne({ user: userId }).lean();
  if (!m) throw Object.assign(new Error('Not part of any family.'), { status: 403 });
  return m.family.toString();
};

// ─── GET /api/alerts ─────────────────────────────────────────────────────────
// Returns all pending alerts for the caller's family, sorted by triggerDate.
// Includes alerts whose triggerDate is in the past (overdue) — the Feed needs those.
const listAlerts = async (req, res) => {
  try {
    const familyId = await getFamilyId(req.userId);

    const alerts = await Alert.find({ family: familyId, status: 'pending' })
      .populate('document', 'title category expiryDate fileUrl')
      .sort({ triggerDate: 1 })
      .lean();

    res.json({ alerts: alerts.map(formatAlert), total: alerts.length });
  } catch (err) {
    handleError(res, err, 'listAlerts');
  }
};

// ─── PATCH /api/alerts/:id/resolve ────────────────────────────────────────────
const resolveAlert = async (req, res) => {
  try {
    const familyId = await getFamilyId(req.userId);
    const alert = await Alert.findOne({ _id: req.params.id, family: familyId });
    if (!alert) return res.status(404).json({ message: 'Alert not found.' });
    if (alert.status !== 'pending')
      return res.status(400).json({ message: `Alert is already ${alert.status}.` });

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    await alert.save();

    res.json({ message: 'Alert marked as resolved.', alert: formatAlert(alert.toObject()) });
  } catch (err) {
    handleError(res, err, 'resolveAlert');
  }
};

// ─── PATCH /api/alerts/:id/dismiss ────────────────────────────────────────────
const dismissAlert = async (req, res) => {
  try {
    const familyId = await getFamilyId(req.userId);
    const alert = await Alert.findOne({ _id: req.params.id, family: familyId });
    if (!alert) return res.status(404).json({ message: 'Alert not found.' });
    if (alert.status !== 'pending')
      return res.status(400).json({ message: `Alert is already ${alert.status}.` });

    alert.status = 'dismissed';
    alert.resolvedAt = new Date();
    await alert.save();

    res.json({ message: 'Alert dismissed.', alert: formatAlert(alert.toObject()) });
  } catch (err) {
    handleError(res, err, 'dismissAlert');
  }
};

// ─── POST /api/alerts/sweep (dev/admin only) ──────────────────────────────────
// Manually trigger the alert sweep — useful during development and testing.
// Protected by auth; in a future version this could be admin-only.
const triggerSweep = async (req, res) => {
  try {
    await getFamilyId(req.userId); // just verify user is authenticated + in a family
    const summary = await runAlertSweep();
    res.json({ message: 'Alert sweep completed.', summary });
  } catch (err) {
    handleError(res, err, 'triggerSweep');
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatAlert = (alert) => ({
  _id: alert._id,
  family: alert.family,
  document: alert.document,
  message: alert.message,
  triggerDate: alert.triggerDate,
  daysBeforeExpiry: alert.daysBeforeExpiry,
  status: alert.status,
  resolvedAt: alert.resolvedAt,
  createdAt: alert.createdAt,
});

const handleError = (res, err, context) => {
  console.error(`${context} error:`, err);
  if (err.status) return res.status(err.status).json({ message: err.message });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID.' });
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
};

module.exports = { listAlerts, resolveAlert, dismissAlert, triggerSweep };
