const prisma = require('../services/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/maintenance?status=&vehicleId=
exports.listMaintenance = asyncHandler(async (req, res) => {
  const { status, vehicleId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (vehicleId) where.vehicleId = vehicleId;

  const logs = await prisma.maintenanceLog.findMany({
    where,
    include: { vehicle: true },
    orderBy: { openedAt: 'desc' },
  });
  res.json(logs);
});

// GET /api/maintenance/:id
exports.getMaintenance = asyncHandler(async (req, res) => {
  const log = await prisma.maintenanceLog.findUnique({
    where: { id: req.params.id },
    include: { vehicle: true },
  });
  if (!log) throw new AppError('Maintenance record not found', 404);
  res.json(log);
});

// PUT /api/maintenance/:id
exports.updateMaintenance = asyncHandler(async (req, res) => {
  const log = await prisma.maintenanceLog.findUnique({ where: { id: req.params.id } });
  if (!log) throw new AppError('Maintenance record not found', 404);

  if (log.status === 'CLOSED') {
    throw new AppError('Cannot edit a closed maintenance record', 400);
  }

  const { description, cost } = req.body;

  const updated = await prisma.maintenanceLog.update({
    where: { id: log.id },
    data: {
      ...(description !== undefined && { description }),
      ...(cost !== undefined && { cost: Number(cost) }),
    },
    include: { vehicle: true },
  });

  res.json(updated);
});

// POST /api/maintenance
// Business rule: creating an active maintenance record automatically
// changes vehicle status to In Shop, removing it from dispatch selection.
exports.createMaintenance = asyncHandler(async (req, res) => {
  const { vehicleId, description, cost } = req.body;
  if (!vehicleId || !description) {
    throw new AppError('vehicleId and description are required', 400);
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  if (vehicle.status === 'ON_TRIP') {
    throw new AppError('Cannot open a maintenance record for a vehicle that is currently on a trip', 400);
  }

  const [log] = await prisma.$transaction([
    prisma.maintenanceLog.create({
      data: {
        vehicleId,
        description,
        cost: cost !== undefined ? Number(cost) : 0,
        status: 'OPEN',
      },
      include: { vehicle: true },
    }),
    prisma.vehicle.update({ where: { id: vehicleId }, data: { status: 'IN_SHOP' } }),
  ]);

  res.status(201).json(log);
});

// POST /api/maintenance/:id/close
// Business rule: closing maintenance restores the vehicle to Available,
// unless the vehicle has been retired.
exports.closeMaintenance = asyncHandler(async (req, res) => {
  const log = await prisma.maintenanceLog.findUnique({
    where: { id: req.params.id },
    include: { vehicle: true },
  });
  if (!log) throw new AppError('Maintenance record not found', 404);

  if (log.status === 'CLOSED') {
    throw new AppError('Maintenance record is already closed', 400);
  }

  const { cost } = req.body;

  const otherOpenLogs = await prisma.maintenanceLog.count({
    where: { vehicleId: log.vehicleId, status: 'OPEN', id: { not: log.id } },
  });

  const [updatedLog] = await prisma.$transaction([
    prisma.maintenanceLog.update({
      where: { id: log.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        ...(cost !== undefined && { cost: Number(cost) }),
      },
      include: { vehicle: true },
    }),
    // Only flip the vehicle back to Available if there isn't another open
    // maintenance record still holding it In Shop, and it isn't retired.
    ...(otherOpenLogs === 0 && log.vehicle.status !== 'RETIRED'
      ? [prisma.vehicle.update({ where: { id: log.vehicleId }, data: { status: 'AVAILABLE' } })]
      : []),
  ]);

  res.json(updatedLog);
});
