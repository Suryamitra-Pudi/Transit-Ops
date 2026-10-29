const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/trip.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/', ctrl.listTrips);
router.get('/:id', ctrl.getTrip);
router.post('/', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.createTrip);
router.put('/:id', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.updateTrip);
router.post('/:id/dispatch', authorize('ADMIN', 'FLEET_MANAGER', 'DRIVER'), ctrl.dispatchTrip);
router.post('/:id/complete', authorize('ADMIN', 'FLEET_MANAGER', 'DRIVER'), ctrl.completeTrip);
router.post('/:id/cancel', authorize('ADMIN', 'FLEET_MANAGER', 'DRIVER'), ctrl.cancelTrip);

module.exports = router;
