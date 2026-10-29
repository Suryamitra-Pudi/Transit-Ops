module.exports = function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  if (!err.isOperational) {
    // Unexpected error - log full stack for debugging.
    console.error(err.stack);
  }
  res.status(statusCode).json({
    error: err.message || 'Something went wrong',
  });
};
