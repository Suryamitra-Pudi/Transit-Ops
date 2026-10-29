const prisma = require('../services/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const DRIVER_STATUSES = ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'];

// GET /api/drivers/me — returns the driver linked to the current user
exports.getMyDriverProfile = asyncHandler(async (req, res) => {
  const driver = await prisma.driver.findFirst({ where: { userId: req.user.id } });
  if (!driver) throw new AppError('No driver profile linked to your account', 404);
  res.json(driver);
});

// GET /api/drivers?status=&dispatchable=true
exports.listDrivers = asyncHandler(async (req, res) => {
  const { status, dispatchable } = req.query;
  const where = {};
  if (status) where.status = status;

  let drivers = await prisma.driver.findMany({ where, orderBy: { createdAt: 'desc' } });

  if (dispatchable === 'true') {
    // Business rule: drivers with expired licenses or Suspended status
    // cannot be assigned to trips.
    const now = new Date();
    drivers = drivers.filter(
      (d) => d.status === 'AVAILABLE' && new Date(d.licenseExpiryDate) > now
    );
  }

  res.json(drivers);
});

exports.getDriver = asyncHandler(async (req, res) => {
  const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
  if (!driver) throw new AppError('Driver not found', 404);
  res.json(driver);
});

// POST /api/drivers
exports.createDriver = asyncHandler(async (req, res) => {
  const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, safetyScore } = req.body;

  if (!name || !licenseNumber || !licenseCategory || !licenseExpiryDate || !contactNumber) {
    throw new AppError('name, licenseNumber, licenseCategory, licenseExpiryDate and contactNumber are required', 400);
  }

  const existing = await prisma.driver.findUnique({ where: { licenseNumber } });
  if (existing) {
    throw new AppError(`License number "${licenseNumber}" is already registered`, 409);
  }

  const driver = await prisma.driver.create({
    data: {
      name,
      licenseNumber,
      licenseCategory,
      licenseExpiryDate: new Date(licenseExpiryDate),
      contactNumber,
      safetyScore: safetyScore !== undefined ? Number(safetyScore) : 100,
      status: 'AVAILABLE',
    },
  });

  res.status(201).json(driver);
});

// PUT /api/drivers/:id
exports.updateDriver = asyncHandler(async (req, res) => {
  const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
  if (!driver) throw new AppError('Driver not found', 404);

  // DRIVER role can only edit their own linked profile
  if (req.user.role === 'DRIVER' && driver.userId !== req.user.id) {
    throw new AppError('You can only edit your own driver profile', 403);
  }

  const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, safetyScore, status } = req.body;

  if (licenseNumber && licenseNumber !== driver.licenseNumber) {
    const dup = await prisma.driver.findUnique({ where: { licenseNumber } });
    if (dup) throw new AppError(`License number "${licenseNumber}" is already registered`, 409);
  }

  if (status && !DRIVER_STATUSES.includes(status)) {
    throw new AppError(`status must be one of: ${DRIVER_STATUSES.join(', ')}`, 400);
  }

  const updated = await prisma.driver.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(licenseNumber && { licenseNumber }),
      ...(licenseCategory && { licenseCategory }),
      ...(licenseExpiryDate && { licenseExpiryDate: new Date(licenseExpiryDate) }),
      ...(contactNumber && { contactNumber }),
      ...(safetyScore !== undefined && { safetyScore: Number(safetyScore) }),
      ...(status && { status }),
    },
  });

  res.json(updated);
});

// DELETE /api/drivers/:id
exports.deleteDriver = asyncHandler(async (req, res) => {
  const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
  if (!driver) throw new AppError('Driver not found', 404);

  if (driver.status === 'ON_TRIP') {
    throw new AppError('Cannot delete a driver who is currently on a trip', 400);
  }

  await prisma.driver.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// GET /api/drivers/expiring-licenses?days=30
exports.expiringLicenses = asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 30;
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const drivers = await prisma.driver.findMany({
    where: { licenseExpiryDate: { lte: cutoff } },
    orderBy: { licenseExpiryDate: 'asc' },
  });

  res.json(drivers.map((d) => ({ ...d, expired: new Date(d.licenseExpiryDate) < now })));
});
