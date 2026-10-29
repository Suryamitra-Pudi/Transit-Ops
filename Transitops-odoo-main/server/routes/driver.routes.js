const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/driver.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/', ctrl.listDrivers);
router.get('/me', ctrl.getMyDriverProfile);
router.get('/expiring-licenses', ctrl.expiringLicenses);
router.get('/:id', ctrl.getDriver);
router.post('/', authorize('ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER'), ctrl.createDriver);
router.put('/:id', authorize('ADMIN', 'FLEET_MANAGER', 'DRIVER'), ctrl.updateDriver);
router.delete('/:id', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.deleteDriver);

module.exports = router;
