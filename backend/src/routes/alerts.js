const express = require('express');
const router = express.Router();
const { listAlerts, resolveAlert, dismissAlert, triggerSweep } = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', listAlerts);
router.patch('/:id/resolve', resolveAlert);
router.patch('/:id/dismiss', dismissAlert);
router.post('/sweep', triggerSweep);       // dev trigger — manual sweep

module.exports = router;
