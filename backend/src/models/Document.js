const mongoose = require('mongoose');

/**
 * Document categories map to the 7 vault sections shown in the UI.
 * Subtypes are free-form strings (e.g. "Car Insurance", "Term Life", "Aadhaar").
 */
const CATEGORIES = [
  'Property',
  'Insurance',
  'Investments',
  'Vehicles',
  'Government IDs',
  'Legal',
  'Education',
];

const documentSchema = new mongoose.Schema(
  {
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: [true, 'Category is required'],
    },
    // Human-readable label within the category (e.g. "Car Insurance – Maruti Swift")
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    issueDate: {
      type: Date,
      default: null,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    renewalRequired: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
    // Storage abstraction — store driver name + key/path, not a hardcoded URL.
    // For local driver: { driver: 'local', path: 'uploads/abc.pdf', originalName: 'policy.pdf' }
    // For S3 driver (future): { driver: 's3', key: 'families/xxx/abc.pdf', bucket: '...', url: '...' }
    file: {
      driver: { type: String, enum: ['local', 's3'], default: 'local' },
      path: { type: String, default: null },       // local relative path
      key: { type: String, default: null },         // s3 object key (future)
      originalName: { type: String, default: null },
      mimeType: { type: String, default: null },
      sizeBytes: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

// Index for fast per-family queries (the primary access pattern)
documentSchema.index({ family: 1, category: 1 });
documentSchema.index({ family: 1, expiryDate: 1 });

module.exports = mongoose.model('Document', documentSchema);
module.exports.CATEGORIES = CATEGORIES;
