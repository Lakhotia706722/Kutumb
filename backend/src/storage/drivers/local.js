/**
 * Local disk storage driver.
 *
 * Files are stored under LOCAL_UPLOAD_DIR (default: "uploads/") relative to
 * the process working directory. Each file is saved with a UUID filename to
 * avoid collisions and path-traversal attacks.
 *
 * Interface (must be consistent across all drivers):
 *   multerMiddleware  – Express middleware that handles the multipart upload
 *   buildFileRecord   – Converts the multer file object to a plain storage record
 *   getServeUrl       – Returns a URL path that can be served via Express static
 *   deleteFile        – Deletes a file from disk given its storage record
 */

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { randomUUID } = require('crypto');

const UPLOAD_DIR = path.resolve(process.cwd(), process.env.LOCAL_UPLOAD_DIR || 'uploads');
const MAX_FILE_SIZE_MB = 20;
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// Ensure the upload directory exists at startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type "${file.mimetype}". Only PDF, JPG, and PNG are allowed.`
      ),
      false
    );
  }
};

const multerMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
}).single('file');

/**
 * Wraps multer's callback-based middleware in a Promise so controllers can
 * use async/await cleanly.
 */
const handleUpload = (req, res) =>
  new Promise((resolve, reject) => {
    multerMiddleware(req, res, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

/**
 * Converts a multer file object to the storage record shape that the
 * Document model expects in its `file` field.
 */
const buildFileRecord = (multerFile) => ({
  driver: 'local',
  path: multerFile.filename, // relative filename only, not full disk path
  key: null,
  originalName: multerFile.originalname,
  mimeType: multerFile.mimetype,
  sizeBytes: multerFile.size,
});

/**
 * Returns the URL path at which this file can be accessed via the Express
 * static file server (mounted at /uploads).
 */
const getServeUrl = (fileRecord) => {
  if (!fileRecord || !fileRecord.path) return null;
  return `/uploads/${fileRecord.path}`;
};

/**
 * Deletes a file from disk. Silently ignores ENOENT (already deleted).
 */
const deleteFile = async (fileRecord) => {
  if (!fileRecord || !fileRecord.path) return;
  const fullPath = path.join(UPLOAD_DIR, fileRecord.path);
  try {
    await fs.promises.unlink(fullPath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
};

module.exports = { handleUpload, buildFileRecord, getServeUrl, deleteFile };
