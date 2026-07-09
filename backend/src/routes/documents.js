const express = require('express');
const router = express.Router();
const {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  serveFile,
} = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const { validateDocumentCreate, validateDocumentUpdate } = require('../middleware/validate');

router.use(protect);

router.get('/', listDocuments);
// Note: validateDocumentCreate runs AFTER multer (inside createDocument) because
// multer must parse the multipart body before we can read the fields.
// The controller handles that ordering internally.
router.post('/', createDocument);
router.get('/:id', getDocument);
router.patch('/:id', validateDocumentUpdate, updateDocument);
router.delete('/:id', deleteDocument);
router.get('/:id/file', serveFile);

module.exports = router;
