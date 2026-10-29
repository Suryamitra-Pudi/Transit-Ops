const prisma = require('../services/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/expenses?vehicleId=&category=
exports.listExpenses = asyncHandler(async (req, res) => {
  const { vehicleId, category } = req.query;
  const where = {};
  if (vehicleId) where.vehicleId = vehicleId;
  if (category) where.category = category;

  const expenses = await prisma.expense.findMany({
    where,
    include: { vehicle: true },
    orderBy: { date: 'desc' },
  });
  res.json(expenses);
});

// POST /api/expenses
// Non-manager roles (FINANCIAL_ANALYST) create PENDING expenses that require manager approval.
exports.createExpense = asyncHandler(async (req, res) => {
  const { vehicleId, category, amount, date, notes } = req.body;
  if (!vehicleId || !category || amount === undefined) {
    throw new AppError('vehicleId, category and amount are required', 400);
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  const isManager = req.user.role === 'ADMIN' || req.user.role === 'FLEET_MANAGER';

  const expense = await prisma.expense.create({
    data: {
      vehicleId,
      category,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      notes: notes || null,
      status: isManager ? 'APPROVED' : 'PENDING',
    },
    include: { vehicle: true },
  });

  res.status(201).json(expense);
});

// GET /api/expenses/:id
exports.getExpense = asyncHandler(async (req, res) => {
  const expense = await prisma.expense.findUnique({
    where: { id: req.params.id },
    include: { vehicle: true },
  });
  if (!expense) throw new AppError('Expense not found', 404);
  res.json(expense);
});

// PUT /api/expenses/:id
exports.updateExpense = asyncHandler(async (req, res) => {
  const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
  if (!expense) throw new AppError('Expense not found', 404);

  const { vehicleId, category, amount, date, notes } = req.body;

  if (vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new AppError('Vehicle not found', 404);
  }

  const updated = await prisma.expense.update({
    where: { id: expense.id },
    data: {
      ...(vehicleId !== undefined && { vehicleId }),
      ...(category !== undefined && { category }),
      ...(amount !== undefined && { amount: Number(amount) }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(notes !== undefined && { notes }),
    },
    include: { vehicle: true },
  });

  res.json(updated);
});

// POST /api/expenses/:id/approve
exports.approveExpense = asyncHandler(async (req, res) => {
  const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
  if (!expense) throw new AppError('Expense not found', 404);
  if (expense.status !== 'PENDING') throw new AppError('Expense is not in PENDING status', 400);

  const updated = await prisma.expense.update({
    where: { id: expense.id },
    data: { status: 'APPROVED' },
    include: { vehicle: true },
  });
  res.json(updated);
});

// POST /api/expenses/:id/reject
exports.rejectExpense = asyncHandler(async (req, res) => {
  const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
  if (!expense) throw new AppError('Expense not found', 404);
  if (expense.status !== 'PENDING') throw new AppError('Expense is not in PENDING status', 400);

  await prisma.expense.delete({ where: { id: expense.id } });
  res.status(204).send();
});

exports.deleteExpense = asyncHandler(async (req, res) => {
  const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
  if (!expense) throw new AppError('Expense not found', 404);
  await prisma.expense.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
