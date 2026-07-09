/**
 * Request validation middleware.
 *
 * Each validator is a plain function (req, res, next) — no external library.
 * Rules are explicit and readable; the intent is to surface clear user-facing
 * error messages, not to silently coerce data.
 */

// ── Shared helpers ────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const badRequest = (res, message) => res.status(400).json({ message });

// ── Auth validators ───────────────────────────────────────────────────────────

const validateSignup = (req, res, next) => {
  const { name, email, password, action, familyName, inviteCode } = req.body;

  if (!name || typeof name !== 'string' || !name.trim())
    return badRequest(res, 'Name is required.');
  if (name.trim().length > 100)
    return badRequest(res, 'Name cannot exceed 100 characters.');

  if (!email || typeof email !== 'string' || !email.trim())
    return badRequest(res, 'Email is required.');
  if (!EMAIL_RE.test(email.trim()))
    return badRequest(res, 'Please enter a valid email address.');

  if (!password || typeof password !== 'string')
    return badRequest(res, 'Password is required.');
  if (password.length < 8)
    return badRequest(res, 'Password must be at least 8 characters.');
  if (password.length > 128)
    return badRequest(res, 'Password is too long (max 128 characters).');

  if (!action || !['create', 'join'].includes(action))
    return badRequest(res, 'action must be "create" or "join".');

  if (action === 'create') {
    if (!familyName || typeof familyName !== 'string' || !familyName.trim())
      return badRequest(res, 'Family name is required when creating a family.');
    if (familyName.trim().length > 100)
      return badRequest(res, 'Family name cannot exceed 100 characters.');
  }

  if (action === 'join') {
    if (!inviteCode || typeof inviteCode !== 'string' || !inviteCode.trim())
      return badRequest(res, 'Invite code is required when joining a family.');
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !email.trim())
    return badRequest(res, 'Email is required.');
  if (!EMAIL_RE.test(email.trim()))
    return badRequest(res, 'Please enter a valid email address.');
  if (!password || typeof password !== 'string')
    return badRequest(res, 'Password is required.');

  next();
};

// ── Document validators ───────────────────────────────────────────────────────

const VALID_CATEGORIES = [
  'Property', 'Insurance', 'Investments', 'Vehicles',
  'Government IDs', 'Legal', 'Education',
];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isValidDate = (str) => {
  if (!ISO_DATE_RE.test(str)) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
};

const validateDocumentCreate = (req, res, next) => {
  // NOTE: this runs AFTER multer — body fields are available even for multipart
  const { category, title, issueDate, expiryDate } = req.body;

  if (!category || !VALID_CATEGORIES.includes(category))
    return badRequest(res, `category must be one of: ${VALID_CATEGORIES.join(', ')}.`);

  if (!title || typeof title !== 'string' || !title.trim())
    return badRequest(res, 'title is required.');
  if (title.trim().length > 200)
    return badRequest(res, 'title cannot exceed 200 characters.');

  if (issueDate && !isValidDate(issueDate))
    return badRequest(res, 'issueDate must be a valid date (YYYY-MM-DD).');
  if (expiryDate && !isValidDate(expiryDate))
    return badRequest(res, 'expiryDate must be a valid date (YYYY-MM-DD).');
  if (issueDate && expiryDate && new Date(issueDate) > new Date(expiryDate))
    return badRequest(res, 'issueDate cannot be after expiryDate.');

  next();
};

const validateDocumentUpdate = (req, res, next) => {
  const { category, title, issueDate, expiryDate } = req.body;

  if (category !== undefined && !VALID_CATEGORIES.includes(category))
    return badRequest(res, `category must be one of: ${VALID_CATEGORIES.join(', ')}.`);

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim())
      return badRequest(res, 'title cannot be empty.');
    if (title.trim().length > 200)
      return badRequest(res, 'title cannot exceed 200 characters.');
  }

  if (issueDate !== undefined && issueDate && !isValidDate(issueDate))
    return badRequest(res, 'issueDate must be a valid date (YYYY-MM-DD).');
  if (expiryDate !== undefined && expiryDate && !isValidDate(expiryDate))
    return badRequest(res, 'expiryDate must be a valid date (YYYY-MM-DD).');

  next();
};

module.exports = {
  validateSignup,
  validateLogin,
  validateDocumentCreate,
  validateDocumentUpdate,
};
