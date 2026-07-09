const Document = require('../models/Document');
const { CATEGORIES } = require('../models/Document');
const FamilyMembership = require('../models/FamilyMembership');
const storage = require('../storage');
const { deleteAlertsForDocument } = require('../alerts/alertEngine');

// ─── Helper: resolve the caller's familyId (cached on req after first call) ──
const getFamilyId = async (userId) => {
  const membership = await FamilyMembership.findOne({ user: userId }).lean();
  if (!membership) throw Object.assign(new Error('You are not part of any family.'), { status: 403 });
  return membership.family.toString();
};

// ─── GET /api/documents ──────────────────────────────────────────────────────
// Returns all documents for the caller's family, grouped by category.
const listDocuments = async (req, res) => {
  try {
    const familyId = await getFamilyId(req.userId);

    const docs = await Document.find({ family: familyId })
      .populate('uploadedBy', 'name')
      .sort({ category: 1, createdAt: -1 })
      .lean();

    // Group into a map: { Category: [doc, ...] }
    const grouped = {};
    for (const cat of CATEGORIES) grouped[cat] = [];
    for (const doc of docs) {
      if (grouped[doc.category]) {
        grouped[doc.category].push(formatDoc(doc));
      }
    }

    res.json({ documents: grouped, total: docs.length });
  } catch (err) {
    handleError(res, err, 'listDocuments');
  }
};

// ─── GET /api/documents/:id ───────────────────────────────────────────────────
const getDocument = async (req, res) => {
  try {
    const familyId = await getFamilyId(req.userId);
    const doc = await Document.findOne({ _id: req.params.id, family: familyId })
      .populate('uploadedBy', 'name')
      .lean();

    if (!doc) return res.status(404).json({ message: 'Document not found.' });
    res.json({ document: formatDoc(doc) });
  } catch (err) {
    handleError(res, err, 'getDocument');
  }
};

// ─── POST /api/documents ─────────────────────────────────────────────────────
// Accepts multipart/form-data (file + metadata fields).
const createDocument = async (req, res) => {
  try {
    // Run the multer upload middleware first
    await storage.handleUpload(req, res);
  } catch (uploadErr) {
    return res.status(400).json({ message: uploadErr.message });
  }

  try {
    const familyId = await getFamilyId(req.userId);
    const { category, title, issueDate, expiryDate, renewalRequired, notes } = req.body;

    // Server-side validation
    if (!category || !CATEGORIES.includes(category)) {
      if (req.file) await storage.deleteFile({ path: req.file.filename });
      return res.status(400).json({
        message: `category must be one of: ${CATEGORIES.join(', ')}.`,
      });
    }
    if (!title || !title.trim()) {
      if (req.file) await storage.deleteFile({ path: req.file.filename });
      return res.status(400).json({ message: 'title is required.' });
    }

    const fileRecord = req.file ? storage.buildFileRecord(req.file) : null;

    const doc = await Document.create({
      family: familyId,
      uploadedBy: req.userId,
      category,
      title: title.trim(),
      issueDate: issueDate || null,
      expiryDate: expiryDate || null,
      renewalRequired: renewalRequired === 'true' || renewalRequired === true,
      notes: notes || '',
      file: fileRecord || {},
    });

    await doc.populate('uploadedBy', 'name');
    res.status(201).json({ message: 'Document added.', document: formatDoc(doc.toObject()) });
  } catch (err) {
    // If the DB write fails, clean up the uploaded file
    if (req.file) {
      await storage.deleteFile({ path: req.file.filename }).catch(() => {});
    }
    handleError(res, err, 'createDocument');
  }
};

// ─── PATCH /api/documents/:id ─────────────────────────────────────────────────
// Metadata-only update (no file replacement in MVP — user deletes+re-adds instead).
const updateDocument = async (req, res) => {
  try {
    const familyId = await getFamilyId(req.userId);
    const doc = await Document.findOne({ _id: req.params.id, family: familyId });
    if (!doc) return res.status(404).json({ message: 'Document not found.' });

    const { category, title, issueDate, expiryDate, renewalRequired, notes } = req.body;

    if (category !== undefined) {
      if (!CATEGORIES.includes(category))
        return res.status(400).json({ message: `Invalid category.` });
      doc.category = category;
    }
    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ message: 'title cannot be empty.' });
      doc.title = title.trim();
    }
    if (issueDate !== undefined) doc.issueDate = issueDate || null;
    if (expiryDate !== undefined) doc.expiryDate = expiryDate || null;
    if (renewalRequired !== undefined)
      doc.renewalRequired = renewalRequired === 'true' || renewalRequired === true;
    if (notes !== undefined) doc.notes = notes;

    await doc.save();
    await doc.populate('uploadedBy', 'name');
    res.json({ message: 'Document updated.', document: formatDoc(doc.toObject()) });
  } catch (err) {
    handleError(res, err, 'updateDocument');
  }
};

// ─── DELETE /api/documents/:id ────────────────────────────────────────────────
// 🚩 PERMISSION MODEL (flagged to founder as required):
//    Only the uploader OR the family owner can delete.
//    Any family member can VIEW and ADD.
const deleteDocument = async (req, res) => {
  try {
    const membership = await FamilyMembership.findOne({ user: req.userId }).lean();
    if (!membership) return res.status(403).json({ message: 'Not part of any family.' });

    const familyId = membership.family.toString();
    const doc = await Document.findOne({ _id: req.params.id, family: familyId }).lean();
    if (!doc) return res.status(404).json({ message: 'Document not found.' });

    const isUploader = doc.uploadedBy.toString() === req.userId;
    const isOwner = membership.role === 'owner';

    if (!isUploader && !isOwner) {
      return res.status(403).json({
        message: 'Only the person who uploaded this document or the family owner can delete it.',
      });
    }

    // Delete the physical file first, then the DB record
    if (doc.file && doc.file.path) {
      await storage.deleteFile(doc.file);
    }
    await Document.deleteOne({ _id: doc._id });
    // Cascade-delete all alerts for this document
    await deleteAlertsForDocument(doc._id);

    res.json({ message: 'Document deleted.' });
  } catch (err) {
    handleError(res, err, 'deleteDocument');
  }
};

// ─── GET /api/documents/:id/file ─────────────────────────────────────────────
// Returns the file contents (or redirects to a signed URL for S3 in the future).
const serveFile = async (req, res) => {
  try {
    const familyId = await getFamilyId(req.userId);
    const doc = await Document.findOne({ _id: req.params.id, family: familyId }).lean();
    if (!doc) return res.status(404).json({ message: 'Document not found.' });
    if (!doc.file || !doc.file.path) {
      return res.status(404).json({ message: 'No file attached to this document.' });
    }

    const url = storage.getServeUrl(doc.file);
    // Redirect to the static file URL — the Express static middleware handles it.
    res.redirect(url);
  } catch (err) {
    handleError(res, err, 'serveFile');
  }
};

// ─── Shared helpers ───────────────────────────────────────────────────────────
const formatDoc = (doc) => ({
  ...doc,
  fileUrl: doc.file && doc.file.path ? storage.getServeUrl(doc.file) : null,
});

const handleError = (res, err, context) => {
  console.error(`${context} error:`, err);
  if (err.status) return res.status(err.status).json({ message: err.message });
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map((e) => e.message).join('; ');
    return res.status(400).json({ message: msg });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid document ID.' });
  }
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
};

module.exports = { listDocuments, getDocument, createDocument, updateDocument, deleteDocument, serveFile };
