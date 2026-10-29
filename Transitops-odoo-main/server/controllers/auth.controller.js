const bcrypt = require('bcryptjs');
const prisma = require('../services/prisma');
const { signToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/auth/register
// In production you may want to restrict this to ADMIN only; left open
// here so the app is usable out of the box during evaluation/demo.
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    throw new AppError('name, email, password and role are required', 400);
  }

  const validRoles = ['ADMIN', 'FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'];
  if (!validRoles.includes(role)) {
    throw new AppError(`role must be one of: ${validRoles.join(', ')}`, 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('A user with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError('email and password are required', 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new AppError('User not found', 404);
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});
