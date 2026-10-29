const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/maintenance.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/', ctrl.listMaintenance);
router.get('/:id', ctrl.getMaintenance);
router.put('/:id', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.updateMaintenance);
router.post('/', authorize('ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER'), ctrl.createMaintenance);
router.post('/:id/close', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.closeMaintenance);

module.exports = router;
