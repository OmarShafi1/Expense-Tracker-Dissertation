const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Express middleware that verifies the JWT in the Authorization header
 * and attaches the authenticated user to `req.user`.
 * Used to protect any route that requires a logged-in user.
 */
const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorised, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorised, token failed' });
  }
};

module.exports = { protect };
