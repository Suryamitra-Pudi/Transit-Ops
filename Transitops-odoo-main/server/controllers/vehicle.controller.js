const prisma = require('../services/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const VEHICLE_STATUSES = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];

// GET /api/vehicles?status=&type=&region=&dispatchable=true
exports.listVehicles = asyncHandler(async (req, res) => {
  const { status, type, region, dispatchable } = req.query;

  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (region) where.region = region;
  if (dispatchable === 'true') {
    // Business rule: Retired or In Shop vehicles must never appear in the
    // dispatch selection.
    where.status = 'AVAILABLE';
  }

  const vehicles = await prisma.vehicle.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(vehicles);
});

exports.getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle) throw new AppError('Vehicle not found', 404);
  res.json(vehicle);
});

// POST /api/vehicles
exports.createVehicle = asyncHandler(async (req, res) => {
  const { registrationNumber, name, type, maxLoadCapacityKg, odometerKm, acquisitionCost, region } = req.body;

  if (!registrationNumber || !name || !type || !maxLoadCapacityKg || !acquisitionCost) {
    throw new AppError('registrationNumber, name, type, maxLoadCapacityKg and acquisitionCost are required', 400);
  }

  const existing = await prisma.vehicle.findUnique({ where: { registrationNumber } });
  if (existing) {
    // Business rule: registration number must be unique.
    throw new AppError(`Registration number "${registrationNumber}" is already in use`, 409);
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      registrationNumber,
      name,
      type,
      maxLoadCapacityKg: Number(maxLoadCapacityKg),
      odometerKm: Number(odometerKm) || 0,
      acquisitionCost: Number(acquisitionCost),
      region: region || null,
      status: 'AVAILABLE',
    },
  });

  res.status(201).json(vehicle);
});

// PUT /api/vehicles/:id
exports.updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  const { registrationNumber, name, type, maxLoadCapacityKg, odometerKm, acquisitionCost, region, status } = req.body;

  if (registrationNumber && registrationNumber !== vehicle.registrationNumber) {
    const dup = await prisma.vehicle.findUnique({ where: { registrationNumber } });
    if (dup) throw new AppError(`Registration number "${registrationNumber}" is already in use`, 409);
  }

  if (status && !VEHICLE_STATUSES.includes(status)) {
    throw new AppError(`status must be one of: ${VEHICLE_STATUSES.join(', ')}`, 400);
  }

  // Guard against manually forcing a vehicle out of IN_SHOP/ON_TRIP outside
  // of the workflows that own those transitions (maintenance / trips).
  if (status === 'AVAILABLE' && vehicle.status === 'IN_SHOP') {
    const openMaintenance = await prisma.maintenanceLog.findFirst({
      where: { vehicleId: vehicle.id, status: 'OPEN' },
    });
    if (openMaintenance) {
      throw new AppError('Close the open maintenance record before marking this vehicle Available', 400);
    }
  }

  const updated = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: {
      ...(registrationNumber && { registrationNumber }),
      ...(name && { name }),
      ...(type && { type }),
      ...(maxLoadCapacityKg !== undefined && { maxLoadCapacityKg: Number(maxLoadCapacityKg) }),
      ...(odometerKm !== undefined && { odometerKm: Number(odometerKm) }),
      ...(acquisitionCost !== undefined && { acquisitionCost: Number(acquisitionCost) }),
      ...(region !== undefined && { region }),
      ...(status && { status }),
    },
  });

  res.json(updated);
});

// DELETE /api/vehicles/:id
exports.deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  if (vehicle.status === 'ON_TRIP') {
    throw new AppError('Cannot delete a vehicle that is currently on a trip', 400);
  }

  await prisma.vehicle.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
