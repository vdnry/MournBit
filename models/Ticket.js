const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Coordinates are required']
    }
  },
  photoUrl: {
    type: String,
    required: [true, 'Photo is required']
  },
  cleanupPhotoUrl: {
    type: String,
    default: ''
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: [true, 'Severity is required']
  },
  status: {
    type: String,
    enum: ['Pending', 'Unclaimed', 'In Progress', 'Cleared'],
    default: 'Pending'
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marker',
    required: [true, 'Marker ID is required']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Authority',
    default: null
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer',
    default: null
  },
  generationTime: {
    type: Date,
    default: Date.now
  },
  approvalTime: {
    type: Date,
    default: null
  },
  claimTime: {
    type: Date,
    default: null
  },
  clearedTime: {
    type: Date,
    default: null
  },
  claimDeadline: {
    type: Date,
    default: null
  }
});

// 2dsphere index for geospatial queries
ticketSchema.index({ location: '2dsphere' });

// Index for common queries
ticketSchema.index({ status: 1 });
ticketSchema.index({ generatedBy: 1 });
ticketSchema.index({ claimedBy: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
