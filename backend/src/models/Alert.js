const mongoose = require('mongoose');

/**
 * Alert represents a single time-bound notification about an upcoming
 * (or overdue) document event.
 *
 * One document can produce multiple Alert records — one per trigger offset.
 * e.g. a motor insurance expiring in 45 days produces three:
 *   - triggerDate = expiryDate - 45d  (status: pending)
 *   - triggerDate = expiryDate - 15d  (status: pending)
 *   - triggerDate = expiryDate - 3d   (status: pending)
 *
 * The cron job creates/reconciles these records daily.
 * The family members resolve or dismiss them from the Feed.
 */
const alertSchema = new mongoose.Schema(
  {
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
      index: true,
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    // Human-readable message shown on the Feed card
    message: {
      type: String,
      required: true,
    },
    // The calendar date on which this alert becomes "active" (visible on Feed)
    triggerDate: {
      type: Date,
      required: true,
    },
    // How many days before expiry this alert fires (stored for deduplication)
    daysBeforeExpiry: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index used for deduplication in the cron sweep:
// "does an alert already exist for this document at this offset?"
alertSchema.index({ document: 1, daysBeforeExpiry: 1 }, { unique: true });

// Index for the Feed query: "all pending alerts for this family, sorted by triggerDate"
alertSchema.index({ family: 1, status: 1, triggerDate: 1 });

module.exports = mongoose.model('Alert', alertSchema);
