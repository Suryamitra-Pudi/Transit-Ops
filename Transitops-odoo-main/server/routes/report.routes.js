const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/report.controller');
const authenticate = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/dashboard', ctrl.dashboard);
router.get('/analytics', ctrl.analytics);
router.get('/export/csv', ctrl.exportCsv);

module.exports = router;
