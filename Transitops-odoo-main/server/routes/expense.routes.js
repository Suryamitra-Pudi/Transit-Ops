const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/expense.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/', ctrl.listExpenses);
router.get('/:id', ctrl.getExpense);
router.put('/:id', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.updateExpense);
router.post('/', authorize('ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'), ctrl.createExpense);
router.post('/:id/approve', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.approveExpense);
router.post('/:id/reject', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.rejectExpense);
router.delete('/:id', authorize('ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'), ctrl.deleteExpense);

module.exports = router;
