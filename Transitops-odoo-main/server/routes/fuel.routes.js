const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/fuel.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/', ctrl.listFuelLogs);
router.get('/:id', ctrl.getFuelLog);
router.put('/:id', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.updateFuelLog);
router.post('/', authorize('ADMIN', 'FLEET_MANAGER', 'DRIVER'), ctrl.createFuelLog);
router.post('/:id/approve', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.approveFuelLog);
router.post('/:id/reject', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.rejectFuelLog);
router.delete('/:id', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.deleteFuelLog);

module.exports = router;
