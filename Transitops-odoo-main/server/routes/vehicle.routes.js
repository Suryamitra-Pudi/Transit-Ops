const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/vehicle.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/', ctrl.listVehicles);
router.get('/:id', ctrl.getVehicle);
router.post('/', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.createVehicle);
router.put('/:id', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.updateVehicle);
router.delete('/:id', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.deleteVehicle);

module.exports = router;
