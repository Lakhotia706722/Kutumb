const mongoose = require('mongoose');

/**
 * FamilyMembership links a User to a Family with a role.
 * A user can theoretically belong to multiple families (edge case for now),
 * but the MVP flow only supports one active family per user.
 */
const familyMembershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// A user should appear only once per family
familyMembershipSchema.index({ user: 1, family: 1 }, { unique: true });

module.exports = mongoose.model('FamilyMembership', familyMembershipSchema);
