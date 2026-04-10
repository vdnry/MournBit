const Ticket = require('../models/Ticket');
const Marker = require('../models/Marker');
const Volunteer = require('../models/Volunteer');

// GET /api/stats — Public stats
exports.getPublicStats = async (req, res) => {
  try {
    const [totalReports, pending, unclaimed, inProgress, cleared] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'Pending' }),
      Ticket.countDocuments({ status: 'Unclaimed' }),
      Ticket.countDocuments({ status: 'In Progress' }),
      Ticket.countDocuments({ status: 'Cleared' })
    ]);

    res.json({
      totalReports,
      pending,
      unclaimed,
      inProgress,
      cleared
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/stats/me — Role-specific dashboard stats
exports.getMyStats = async (req, res) => {
  try {
    const { activeRole } = req;
    const email = req.user.email;

    if (activeRole === 'Marker') {
      const marker = await Marker.findOne({ email }).select('-password');
      const myTickets = await Ticket.countDocuments({ generatedBy: marker._id });

      return res.json({
        role: 'Marker',
        ticketsGenerated: marker.ticketsGenerated,
        ticketsApproved: marker.ticketsApproved,
        ticketsCleared: marker.ticketsCleared,
        totalMyTickets: myTickets
      });
    }

    if (activeRole === 'Volunteer') {
      const volunteer = await Volunteer.findOne({ email }).select('-password');

      // Count tickets in 10km radius (if location provided)
      const { lat, lng } = req.query;
      let nearbyCount = 0;
      let claimedNearby = 0;

      if (lat && lng) {
        nearbyCount = await Ticket.countDocuments({
          status: { $in: ['Unclaimed', 'In Progress'] },
          location: {
            $near: {
              $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
              $maxDistance: 10000
            }
          }
        });

        claimedNearby = await Ticket.countDocuments({
          claimedBy: volunteer._id,
          status: 'In Progress',
          location: {
            $near: {
              $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
              $maxDistance: 10000
            }
          }
        });
      }

      return res.json({
        role: 'Volunteer',
        ticketsClaimed: volunteer.ticketsClaimed,
        ticketsClosed: volunteer.ticketsClosed,
        nearbyTickets: nearbyCount,
        claimedNearby
      });
    }

    if (activeRole === 'Authority') {
      const pendingCount = await Ticket.countDocuments({ status: 'Pending' });
      const awaitingClose = await Ticket.countDocuments({
        status: 'In Progress',
        cleanupPhotoUrl: { $ne: '' }
      });

      return res.json({
        role: 'Authority',
        ticketsApproved: req.user.ticketsApproved,
        pendingApproval: pendingCount,
        awaitingClose
      });
    }

    res.status(400).json({ error: 'Unknown role' });
  } catch (err) {
    console.error('My stats error:', err);
    res.status(500).json({ error: err.message });
  }
};
