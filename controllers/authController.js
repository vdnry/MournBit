const jwt = require('jsonwebtoken');
const Marker = require('../models/Marker');
const Volunteer = require('../models/Volunteer');
const Authority = require('../models/Authority');

// Generate JWT token
const generateToken = (id, role, activeRole) => {
  return jwt.sign({ id, role, activeRole: activeRole || role }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, fullName, email, password, role } = req.body;

    if (!username || !fullName || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required (username, fullName, email, password, role)' });
    }

    if (!['Marker', 'Volunteer', 'Authority'].includes(role)) {
      return res.status(400).json({ error: 'Role must be Marker, Volunteer, or Authority' });
    }

    // Authority domain check
    if (role === 'Authority') {
      const authorizedDomains = (process.env.AUTHORIZED_DOMAINS || 'gmail.com').split(',');
      const domain = email.split('@')[1];
      if (!authorizedDomains.includes(domain)) {
        return res.status(400).json({
          error: `Authority email must be from: ${authorizedDomains.join(', ')}`
        });
      }

      // Check if authority already exists
      const existingAuth = await Authority.findOne({ $or: [{ email }, { username }] });
      if (existingAuth) {
        return res.status(400).json({ error: 'Authority with this email or username already exists' });
      }

      const authority = await Authority.create({ username, fullName, email, password });
      const token = generateToken(authority._id, 'Authority');

      return res.status(201).json({
        token,
        user: {
          id: authority._id,
          username: authority.username,
          fullName: authority.fullName,
          email: authority.email,
          role: 'Authority',
          activeRole: 'Authority',
          ticketsApproved: authority.ticketsApproved
        }
      });
    }

    // Marker / Volunteer — create dual accounts
    const existingMarker = await Marker.findOne({ $or: [{ email }, { username }] });
    const existingVolunteer = await Volunteer.findOne({ $or: [{ email }, { username }] });

    if (existingMarker || existingVolunteer) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Create both Marker and Volunteer accounts with same credentials
    const marker = await Marker.create({ username, fullName, email, password });
    const volunteer = await Volunteer.create({ username, fullName, email, password });

    // Token defaults to the role they selected
    const primaryId = role === 'Marker' ? marker._id : volunteer._id;
    const token = generateToken(primaryId, role, role);

    return res.status(201).json({
      token,
      user: {
        markerId: marker._id,
        volunteerId: volunteer._id,
        username: marker.username,
        fullName: marker.fullName,
        email: marker.email,
        role,
        activeRole: role,
        markerStats: {
          ticketsGenerated: marker.ticketsGenerated,
          ticketsApproved: marker.ticketsApproved,
          ticketsCleared: marker.ticketsCleared
        },
        volunteerStats: {
          ticketsClaimed: volunteer.ticketsClaimed,
          ticketsClosed: volunteer.ticketsClosed
        }
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Try Authority login
    if (role === 'Authority') {
      const authority = await Authority.findOne({ email });
      if (!authority) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const isMatch = await authority.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken(authority._id, 'Authority');
      return res.json({
        token,
        user: {
          id: authority._id,
          username: authority.username,
          fullName: authority.fullName,
          email: authority.email,
          role: 'Authority',
          activeRole: 'Authority',
          ticketsApproved: authority.ticketsApproved
        }
      });
    }

    // Marker / Volunteer login — find both accounts
    const marker = await Marker.findOne({ email });
    const volunteer = await Volunteer.findOne({ email });

    if (!marker && !volunteer) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password against marker account (both share same password)
    const userToCheck = marker || volunteer;
    const isMatch = await userToCheck.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const activeRole = role || 'Marker';
    const primaryId = activeRole === 'Marker' ? marker._id : volunteer._id;
    const token = generateToken(primaryId, activeRole, activeRole);

    return res.json({
      token,
      user: {
        markerId: marker ? marker._id : null,
        volunteerId: volunteer ? volunteer._id : null,
        username: userToCheck.username,
        fullName: userToCheck.fullName,
        email: userToCheck.email,
        role: activeRole,
        activeRole,
        markerStats: marker ? {
          ticketsGenerated: marker.ticketsGenerated,
          ticketsApproved: marker.ticketsApproved,
          ticketsCleared: marker.ticketsCleared
        } : null,
        volunteerStats: volunteer ? {
          ticketsClaimed: volunteer.ticketsClaimed,
          ticketsClosed: volunteer.ticketsClosed
        } : null
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/switch-role
exports.switchRole = async (req, res) => {
  try {
    const { targetRole } = req.body;
    const currentEmail = req.user.email;

    if (!['Marker', 'Volunteer'].includes(targetRole)) {
      return res.status(400).json({ error: 'Can only switch between Marker and Volunteer' });
    }

    const marker = await Marker.findOne({ email: currentEmail }).select('-password');
    const volunteer = await Volunteer.findOne({ email: currentEmail }).select('-password');

    if (!marker || !volunteer) {
      return res.status(400).json({ error: 'Dual account not found' });
    }

    const primaryId = targetRole === 'Marker' ? marker._id : volunteer._id;
    const token = generateToken(primaryId, targetRole, targetRole);

    return res.json({
      token,
      user: {
        markerId: marker._id,
        volunteerId: volunteer._id,
        username: marker.username,
        fullName: marker.fullName,
        email: marker.email,
        role: targetRole,
        activeRole: targetRole,
        markerStats: {
          ticketsGenerated: marker.ticketsGenerated,
          ticketsApproved: marker.ticketsApproved,
          ticketsCleared: marker.ticketsCleared
        },
        volunteerStats: {
          ticketsClaimed: volunteer.ticketsClaimed,
          ticketsClosed: volunteer.ticketsClosed
        }
      }
    });
  } catch (err) {
    console.error('Switch role error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const email = req.user.email;

    if (req.activeRole === 'Authority') {
      return res.json({
        user: {
          id: req.user._id,
          username: req.user.username,
          fullName: req.user.fullName,
          email: req.user.email,
          role: 'Authority',
          activeRole: 'Authority',
          ticketsApproved: req.user.ticketsApproved
        }
      });
    }

    const marker = await Marker.findOne({ email }).select('-password');
    const volunteer = await Volunteer.findOne({ email }).select('-password');

    return res.json({
      user: {
        markerId: marker ? marker._id : null,
        volunteerId: volunteer ? volunteer._id : null,
        username: req.user.username,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.activeRole,
        activeRole: req.activeRole,
        markerStats: marker ? {
          ticketsGenerated: marker.ticketsGenerated,
          ticketsApproved: marker.ticketsApproved,
          ticketsCleared: marker.ticketsCleared
        } : null,
        volunteerStats: volunteer ? {
          ticketsClaimed: volunteer.ticketsClaimed,
          ticketsClosed: volunteer.ticketsClosed
        } : null
      }
    });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ error: err.message });
  }
};
