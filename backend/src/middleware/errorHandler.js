/**
 * Catches errors thrown anywhere in the request pipeline and returns
 * a consistent JSON response.
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Mongoose validation errors -> 400
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Mongoose duplicate key (e.g. duplicate username/email) -> 409
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      message: `An account with that ${field} already exists`,
    });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Server error',
  });
};

const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

module.exports = { errorHandler, notFound };
