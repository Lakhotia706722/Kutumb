const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const familySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Family name is required'],
      trim: true,
      maxlength: [100, 'Family name cannot exceed 100 characters'],
    },
    // The user who created this family (denormalised for fast lookups)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Invite code used by the second member to join
    inviteCode: {
      type: String,
      unique: true,
      default: () => nanoid(10), // e.g. "V1StGXR8_Z"
    },
    inviteCodeExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  },
  { timestamps: true }
);

// Regenerate invite code on demand (called from the controller)
familySchema.methods.refreshInviteCode = function () {
  const { nanoid: gen } = require('nanoid');
  this.inviteCode = gen(10);
  this.inviteCodeExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
};

module.exports = mongoose.model('Family', familySchema);
