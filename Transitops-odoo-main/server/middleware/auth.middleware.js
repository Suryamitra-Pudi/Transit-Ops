const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

module.exports = function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    const payload = verifyToken(token);
    req.user = payload; // { id, email, role }
    next();
  } catch (err) {
    next(new AppError('Invalid or expired token', 401));
  }
};
