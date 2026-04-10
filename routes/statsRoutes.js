const express = require('express');
const router = express.Router();
const { getPublicStats, getMyStats, getLeaderboard } = require('../controllers/statsController');
const { auth } = require('../middleware/auth');

// Public stats
router.get('/', getPublicStats);

// Leaderboard stats (Public)
router.get('/leaderboard', getLeaderboard);

// Role-specific dashboard stats
router.get('/me', auth, getMyStats);

module.exports = router;
