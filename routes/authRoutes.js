const express = require('express');
const router = express.Router();
const { register, login, switchRole, getMe } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', auth, getMe);
router.post('/switch-role', auth, switchRole);

module.exports = router;
