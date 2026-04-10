const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getAllTickets,
  getTicketById,
  approveTicket,
  claimTicket,
  clearTicket,
  closeTicket
} = require('../controllers/ticketController');
const { auth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getTickets);

// Protected routes
router.get('/all', auth, getAllTickets);
router.get('/:id', getTicketById);

// Marker creates ticket (with photo upload)
router.post('/', auth, requireRole('Marker'), upload.single('photo'), createTicket);

// Authority approves ticket
router.patch('/:id/approve', auth, requireRole('Authority'), approveTicket);

// Volunteer claims ticket
router.patch('/:id/claim', auth, requireRole('Volunteer'), claimTicket);

// Volunteer submits cleanup photo
router.patch('/:id/clear', auth, requireRole('Volunteer'), upload.single('photo'), clearTicket);

// Authority closes ticket
router.patch('/:id/close', auth, requireRole('Authority'), closeTicket);

module.exports = router;
