const jwt = require('jsonwebtoken');
const Marker = require('../models/Marker');
const Volunteer = require('../models/Volunteer');
const Authority = require('../models/Authority');

const modelMap = {
  Marker,
  Volunteer,
  Authority
};

// Verify JWT and attach user to request
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const Model = modelMap[decoded.role];

    if (!Model) {
      return res.status(401).json({ error: 'Invalid role in token.' });
    }

    const user = await Model.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    req.user = user;
    req.userRole = decoded.role;
    req.activeRole = decoded.activeRole || decoded.role;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Role-based access control
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.activeRole)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};

module.exports = { auth, requireRole };
