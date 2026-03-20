const jwt = require('jsonwebtoken');

const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requirePortalAuth = (req, res, next) => {
  const token = req.headers['x-portal-token'];
  if (!token) return res.status(401).json({ error: 'Portal auth required' });
  try {
    req.portal = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid portal token' });
  }
};

module.exports = { requireAdmin, requirePortalAuth };
