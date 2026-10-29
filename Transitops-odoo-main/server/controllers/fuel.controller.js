const prisma = require('../services/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/fuel-logs?vehicleId=
exports.listFuelLogs = asyncHandler(async (req, res) => {
  const { vehicleId } = req.query;
  const where = {};
  if (vehicleId) where.vehicleId = vehicleId;

  const logs = await prisma.fuelLog.findMany({
    where,
    include: { vehicle: true },
    orderBy: { date: 'desc' },
  });
  res.json(logs);
});

// POST /api/fuel-logs
// Non-manager roles (DRIVER) create PENDING logs that require manager approval.
exports.createFuelLog = asyncHandler(async (req, res) => {
  const { vehicleId, liters, cost, date } = req.body;
  if (!vehicleId || liters === undefined || cost === undefined) {
    throw new AppError('vehicleId, liters and cost are required', 400);
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  const isManager = req.user.role === 'ADMIN' || req.user.role === 'FLEET_MANAGER';

  const log = await prisma.fuelLog.create({
    data: {
      vehicleId,
      liters: Number(liters),
      cost: Number(cost),
      date: date ? new Date(date) : new Date(),
      status: isManager ? 'APPROVED' : 'PENDING',
    },
    include: { vehicle: true },
  });

  res.status(201).json(log);
});

// GET /api/fuel-logs/:id
exports.getFuelLog = asyncHandler(async (req, res) => {
  const log = await prisma.fuelLog.findUnique({
    where: { id: req.params.id },
    include: { vehicle: true },
  });
  if (!log) throw new AppError('Fuel log not found', 404);
  res.json(log);
});

// PUT /api/fuel-logs/:id
exports.updateFuelLog = asyncHandler(async (req, res) => {
  const log = await prisma.fuelLog.findUnique({ where: { id: req.params.id } });
  if (!log) throw new AppError('Fuel log not found', 404);

  const { vehicleId, liters, cost, date } = req.body;

  if (vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new AppError('Vehicle not found', 404);
  }

  const updated = await prisma.fuelLog.update({
    where: { id: log.id },
    data: {
      ...(vehicleId !== undefined && { vehicleId }),
      ...(liters !== undefined && { liters: Number(liters) }),
      ...(cost !== undefined && { cost: Number(cost) }),
      ...(date !== undefined && { date: new Date(date) }),
    },
    include: { vehicle: true },
  });

  res.json(updated);
});

// POST /api/fuel-logs/:id/approve
exports.approveFuelLog = asyncHandler(async (req, res) => {
  const log = await prisma.fuelLog.findUnique({ where: { id: req.params.id } });
  if (!log) throw new AppError('Fuel log not found', 404);
  if (log.status !== 'PENDING') throw new AppError('Fuel log is not in PENDING status', 400);

  const updated = await prisma.fuelLog.update({
    where: { id: log.id },
    data: { status: 'APPROVED' },
    include: { vehicle: true },
  });
  res.json(updated);
});

// POST /api/fuel-logs/:id/reject
exports.rejectFuelLog = asyncHandler(async (req, res) => {
  const log = await prisma.fuelLog.findUnique({ where: { id: req.params.id } });
  if (!log) throw new AppError('Fuel log not found', 404);
  if (log.status !== 'PENDING') throw new AppError('Fuel log is not in PENDING status', 400);

  await prisma.fuelLog.delete({ where: { id: log.id } });
  res.status(204).send();
});

exports.deleteFuelLog = asyncHandler(async (req, res) => {
  const log = await prisma.fuelLog.findUnique({ where: { id: req.params.id } });
  if (!log) throw new AppError('Fuel log not found', 404);
  await prisma.fuelLog.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
