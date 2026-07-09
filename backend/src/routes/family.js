const express = require('express');
const router = express.Router();
const { getMyFamily, refreshInviteCode, joinFamily } = require('../controllers/familyController');
const { protect } = require('../middleware/auth');

// All family routes require authentication
router.use(protect);

router.get('/me', getMyFamily);
router.post('/refresh-invite', refreshInviteCode);
router.post('/join', joinFamily);

module.exports = router;
