const express = require('express');
const router = express.Router();
const { getScore } = require('../controllers/scoreController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getScore);

module.exports = router;
