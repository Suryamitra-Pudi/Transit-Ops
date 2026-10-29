const prisma = require('../services/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/trips?status=
exports.listTrips = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const where = {};
  if (status) where.status = status;

  const trips = await prisma.trip.findMany({
    where,
    include: { vehicle: true, driver: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(trips);
});

exports.getTrip = asyncHandler(async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id },
    include: { vehicle: true, driver: true },
  });
  if (!trip) throw new AppError('Trip not found', 404);
  res.json(trip);
});

// POST /api/trips  -> creates a Draft trip
exports.createTrip = asyncHandler(async (req, res) => {
  const { source, destination, vehicleId, driverId, cargoWeightKg, plannedDistanceKm } = req.body;

  if (!source || !destination || !vehicleId || !driverId || cargoWeightKg === undefined || !plannedDistanceKm) {
    throw new AppError(
      'source, destination, vehicleId, driverId, cargoWeightKg and plannedDistanceKm are required',
      400
    );
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) throw new AppError('Driver not found', 404);

  // Business rule: cargo weight must not exceed the vehicle's max load capacity.
  if (Number(cargoWeightKg) > vehicle.maxLoadCapacityKg) {
    throw new AppError(
      `Cargo weight (${cargoWeightKg} kg) exceeds vehicle max load capacity (${vehicle.maxLoadCapacityKg} kg)`,
      400
    );
  }

  const trip = await prisma.trip.create({
    data: {
      source,
      destination,
      vehicleId,
      driverId,
      cargoWeightKg: Number(cargoWeightKg),
      plannedDistanceKm: Number(plannedDistanceKm),
      status: 'DRAFT',
    },
    include: { vehicle: true, driver: true },
  });

  res.status(201).json(trip);
});

// POST /api/trips/:id/dispatch
exports.dispatchTrip = asyncHandler(async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id },
    include: { vehicle: true, driver: true },
  });
  if (!trip) throw new AppError('Trip not found', 404);

  if (trip.status !== 'DRAFT') {
    throw new AppError(`Only Draft trips can be dispatched (current status: ${trip.status})`, 400);
  }

  // Re-validate all mandatory business rules at dispatch time, since state
  // may have changed since the trip was drafted.
  const { vehicle, driver } = trip;

  if (vehicle.status === 'RETIRED' || vehicle.status === 'IN_SHOP') {
    throw new AppError(`Vehicle is ${vehicle.status.replace('_', ' ')} and cannot be dispatched`, 400);
  }
  if (vehicle.status === 'ON_TRIP') {
    throw new AppError('Vehicle is already on another trip', 400);
  }

  if (driver.status === 'SUSPENDED') {
    throw new AppError('Driver is suspended and cannot be assigned to trips', 400);
  }
  if (new Date(driver.licenseExpiryDate) < new Date()) {
    throw new AppError('Driver license has expired and cannot be assigned to trips', 400);
  }
  if (driver.status === 'ON_TRIP') {
    throw new AppError('Driver is already on another trip', 400);
  }

  if (trip.cargoWeightKg > vehicle.maxLoadCapacityKg) {
    throw new AppError(
      `Cargo weight (${trip.cargoWeightKg} kg) exceeds vehicle max load capacity (${vehicle.maxLoadCapacityKg} kg)`,
      400
    );
  }

  // All checks passed - perform the dispatch as a single transaction so
  // vehicle/driver/trip status stay consistent.
  const [, , updatedTrip] = await prisma.$transaction([
    prisma.vehicle.update({ where: { id: vehicle.id }, data: { status: 'ON_TRIP' } }),
    prisma.driver.update({ where: { id: driver.id }, data: { status: 'ON_TRIP' } }),
    prisma.trip.update({
      where: { id: trip.id },
      data: { status: 'DISPATCHED', dispatchedAt: new Date() },
      include: { vehicle: true, driver: true },
    }),
  ]);

  res.json(updatedTrip);
});

// POST /api/trips/:id/complete
// body: { finalOdometerKm, fuelConsumedL }
exports.completeTrip = asyncHandler(async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip) throw new AppError('Trip not found', 404);

  if (trip.status !== 'DISPATCHED') {
    throw new AppError(`Only Dispatched trips can be completed (current status: ${trip.status})`, 400);
  }

  const { finalOdometerKm, fuelConsumedL } = req.body;
  const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });

  const actualDistanceKm =
    finalOdometerKm !== undefined ? Math.max(0, Number(finalOdometerKm) - vehicle.odometerKm) : trip.plannedDistanceKm;

  const [, , updatedTrip] = await prisma.$transaction([
    prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: {
        status: 'AVAILABLE',
        ...(finalOdometerKm !== undefined && { odometerKm: Number(finalOdometerKm) }),
      },
    }),
    prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } }),
    prisma.trip.update({
      where: { id: trip.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        actualDistanceKm,
        ...(fuelConsumedL !== undefined && { fuelConsumedL: Number(fuelConsumedL) }),
      },
      include: { vehicle: true, driver: true },
    }),
  ]);

  // Optionally log the fuel consumed for this trip so it feeds reports.
  if (fuelConsumedL) {
    await prisma.fuelLog.create({
      data: {
        vehicleId: trip.vehicleId,
        liters: Number(fuelConsumedL),
        cost: 0,
        date: new Date(),
      },
    });
  }

  res.json(updatedTrip);
});

// PUT /api/trips/:id — edit a DRAFT trip's route details
exports.updateTrip = asyncHandler(async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip) throw new AppError('Trip not found', 404);

  if (trip.status !== 'DRAFT') {
    throw new AppError(`Only Draft trips can be edited (current status: ${trip.status})`, 400);
  }

  const { source, destination, cargoWeightKg, plannedDistanceKm } = req.body;

  const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });

  if (cargoWeightKg !== undefined && Number(cargoWeightKg) > vehicle.maxLoadCapacityKg) {
    throw new AppError(
      `Cargo weight (${cargoWeightKg} kg) exceeds vehicle max load capacity (${vehicle.maxLoadCapacityKg} kg)`,
      400
    );
  }

  const updated = await prisma.trip.update({
    where: { id: trip.id },
    data: {
      ...(source !== undefined && { source }),
      ...(destination !== undefined && { destination }),
      ...(cargoWeightKg !== undefined && { cargoWeightKg: Number(cargoWeightKg) }),
      ...(plannedDistanceKm !== undefined && { plannedDistanceKm: Number(plannedDistanceKm) }),
    },
    include: { vehicle: true, driver: true },
  });

  res.json(updated);
});

// POST /api/trips/:id/cancel
exports.cancelTrip = asyncHandler(async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip) throw new AppError('Trip not found', 404);

  if (!['DRAFT', 'DISPATCHED'].includes(trip.status)) {
    throw new AppError(`Cannot cancel a trip with status ${trip.status}`, 400);
  }

  const wasDispatched = trip.status === 'DISPATCHED';

  const ops = [
    prisma.trip.update({
      where: { id: trip.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
      include: { vehicle: true, driver: true },
    }),
  ];

  // Business rule: cancelling a dispatched trip restores vehicle & driver
  // to Available. A still-Draft trip never changed their status, so nothing
  // to restore.
  if (wasDispatched) {
    ops.unshift(
      prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE' } }),
      prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } })
    );
  }

  const results = await prisma.$transaction(ops);
  res.json(results[results.length - 1]);
});
