const Ticket = require('../models/Ticket');
const Marker = require('../models/Marker');
const Volunteer = require('../models/Volunteer');
const Authority = require('../models/Authority');

// POST /api/tickets — Create a new ticket (Marker only)
exports.createTicket = async (req, res) => {
  try {
    const { latitude, longitude, severity } = req.body;

    if (!latitude || !longitude || !severity) {
      return res.status(400).json({ error: 'latitude, longitude, and severity are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Photo is required' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    const ticket = await Ticket.create({
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      photoUrl,
      severity,
      status: 'Pending',
      generatedBy: req.user._id,
      generationTime: new Date()
    });

    // Update marker stats
    await Marker.findByIdAndUpdate(req.user._id, { $inc: { ticketsGenerated: 1 } });

    // Populate and emit
    const populated = await Ticket.findById(ticket._id)
      .populate('generatedBy', 'username fullName')
      .populate('approvedBy', 'username fullName')
      .populate('claimedBy', 'username fullName');

    const io = req.app.get('io');
    io.emit('ticket:created', populated);

    res.status(201).json(populated);
  } catch (err) {
    console.error('Create ticket error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tickets — Public, returns non-cleared tickets by default
exports.getTickets = async (req, res) => {
  try {
    const { status, lat, lng, radius, includeCleared } = req.query;
    let filter = {};

    // Filter by status
    if (status) {
      filter.status = status;
    } else if (includeCleared !== 'true') {
      // Exclude cleared by default
      filter.status = { $ne: 'Cleared' };
    }

    // Geospatial filter (radius in km, default 10km)
    if (lat && lng) {
      const radiusKm = parseFloat(radius) || 10;
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radiusKm * 1000 // Convert to meters
        }
      };
    }

    const tickets = await Ticket.find(filter)
      .populate('generatedBy', 'username fullName')
      .populate('approvedBy', 'username fullName')
      .populate('claimedBy', 'username fullName')
      .sort({ generationTime: -1 });

    res.json(tickets);
  } catch (err) {
    console.error('Get tickets error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tickets/all — Authenticated, includes cleared
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('generatedBy', 'username fullName')
      .populate('approvedBy', 'username fullName')
      .populate('claimedBy', 'username fullName')
      .sort({ generationTime: -1 });

    res.json(tickets);
  } catch (err) {
    console.error('Get all tickets error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tickets/:id
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('generatedBy', 'username fullName')
      .populate('approvedBy', 'username fullName')
      .populate('claimedBy', 'username fullName');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (err) {
    console.error('Get ticket error:', err);
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/tickets/:id/approve — Authority approves ticket
exports.approveTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status !== 'Pending') {
      return res.status(400).json({ error: `Cannot approve ticket with status: ${ticket.status}` });
    }

    ticket.status = 'Unclaimed';
    ticket.approvedBy = req.user._id;
    ticket.approvalTime = new Date();
    await ticket.save();

    // Update authority stats
    await Authority.findByIdAndUpdate(req.user._id, { $inc: { ticketsApproved: 1 } });

    // Update marker's ticketsApproved
    await Marker.findByIdAndUpdate(ticket.generatedBy, { $inc: { ticketsApproved: 1 } });

    const populated = await Ticket.findById(ticket._id)
      .populate('generatedBy', 'username fullName')
      .populate('approvedBy', 'username fullName')
      .populate('claimedBy', 'username fullName');

    const io = req.app.get('io');
    io.emit('ticket:approved', populated);

    res.json(populated);
  } catch (err) {
    console.error('Approve ticket error:', err);
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/tickets/:id/claim — Volunteer claims a ticket
exports.claimTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status !== 'Unclaimed') {
      return res.status(400).json({ error: `Cannot claim ticket with status: ${ticket.status}` });
    }

    // Ensure ticket is not already claimed
    if (ticket.claimedBy) {
      return res.status(400).json({ error: 'Ticket already claimed by another volunteer' });
    }

    const now = new Date();
    const deadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days

    ticket.status = 'In Progress';
    ticket.claimedBy = req.user._id;
    ticket.claimTime = now;
    ticket.claimDeadline = deadline;
    await ticket.save();

    // Update volunteer stats
    await Volunteer.findByIdAndUpdate(req.user._id, { $inc: { ticketsClaimed: 1 } });

    const populated = await Ticket.findById(ticket._id)
      .populate('generatedBy', 'username fullName')
      .populate('approvedBy', 'username fullName')
      .populate('claimedBy', 'username fullName');

    const io = req.app.get('io');
    io.emit('ticket:claimed', populated);

    res.json(populated);
  } catch (err) {
    console.error('Claim ticket error:', err);
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/tickets/:id/clear — Volunteer submits cleanup photo
exports.clearTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status !== 'In Progress') {
      return res.status(400).json({ error: `Cannot clear ticket with status: ${ticket.status}` });
    }

    // Only the volunteer who claimed it can clear it
    if (ticket.claimedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the volunteer who claimed this ticket can clear it' });
    }

    // Check 3-day deadline
    if (ticket.claimDeadline && new Date() > ticket.claimDeadline) {
      // Deadline expired — unclaim the ticket
      ticket.status = 'Unclaimed';
      ticket.claimedBy = null;
      ticket.claimTime = null;
      ticket.claimDeadline = null;
      await ticket.save();

      const io = req.app.get('io');
      io.emit('ticket:expired', ticket);

      return res.status(400).json({ error: '3-day deadline expired. Ticket has been unclaimed.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Cleanup photo is required' });
    }

    ticket.cleanupPhotoUrl = `/uploads/${req.file.filename}`;
    ticket.clearedTime = new Date();
    // Keep status as 'In Progress' until authority closes it
    // But mark it as ready for review
    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate('generatedBy', 'username fullName')
      .populate('approvedBy', 'username fullName')
      .populate('claimedBy', 'username fullName');

    const io = req.app.get('io');
    io.emit('ticket:clearRequested', populated);

    res.json(populated);
  } catch (err) {
    console.error('Clear ticket error:', err);
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/tickets/:id/close — Authority closes the ticket
exports.closeTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status !== 'In Progress') {
      return res.status(400).json({ error: `Cannot close ticket with status: ${ticket.status}` });
    }

    if (!ticket.cleanupPhotoUrl || ticket.cleanupPhotoUrl === '') {
      return res.status(400).json({ error: 'Volunteer has not submitted a cleanup photo yet' });
    }

    ticket.status = 'Cleared';
    ticket.clearedTime = ticket.clearedTime || new Date();
    await ticket.save();

    // Update volunteer stats
    await Volunteer.findByIdAndUpdate(ticket.claimedBy, { $inc: { ticketsClosed: 1 } });

    // Update marker stats
    await Marker.findByIdAndUpdate(ticket.generatedBy, { $inc: { ticketsCleared: 1 } });

    const populated = await Ticket.findById(ticket._id)
      .populate('generatedBy', 'username fullName')
      .populate('approvedBy', 'username fullName')
      .populate('claimedBy', 'username fullName');

    const io = req.app.get('io');
    io.emit('ticket:closed', populated);

    res.json(populated);
  } catch (err) {
    console.error('Close ticket error:', err);
    res.status(500).json({ error: err.message });
  }
};
