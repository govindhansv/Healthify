// middleware/isAdmin.js
// Require `protect` first (it sets req.user)
const { protect } = require('./auth');

function isAdmin(req, res, next) {
  // Make sure protect was used before this middleware
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

  if (req.user.role && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({ message: 'Forbidden: admin only' });
}

module.exports = { isAdmin, protect };
