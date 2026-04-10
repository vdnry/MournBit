require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Marker = require('../models/Marker');
const Volunteer = require('../models/Volunteer');
const Authority = require('../models/Authority');
const Ticket = require('../models/Ticket');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mournbit';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // Clear existing data
    await Promise.all([
      Marker.deleteMany({}),
      Volunteer.deleteMany({}),
      Authority.deleteMany({}),
      Ticket.deleteMany({})
    ]);
    console.log('🧹 Cleared existing data');

    // Create demo users
    const marker = await Marker.create({
      username: 'demo_marker',
      fullName: 'Raj Kumar',
      email: 'marker@demo.com',
      password: 'password123'
    });

    const volunteer = await Volunteer.create({
      username: 'demo_marker',
      fullName: 'Raj Kumar',
      email: 'marker@demo.com',
      password: 'password123'
    });

    const volunteer2 = await Volunteer.create({
      username: 'demo_volunteer',
      fullName: 'Priya Sharma',
      email: 'volunteer@demo.com',
      password: 'password123'
    });

    const marker2 = await Marker.create({
      username: 'demo_volunteer',
      fullName: 'Priya Sharma',
      email: 'volunteer@demo.com',
      password: 'password123'
    });

    const authority = await Authority.create({
      username: 'demo_authority',
      fullName: 'Admin Officer',
      email: 'authority@gmail.com',
      password: 'password123'
    });

    console.log('👤 Created demo users:');
    console.log('   Marker/Volunteer: marker@demo.com / password123');
    console.log('   Volunteer/Marker: volunteer@demo.com / password123');
    console.log('   Authority:        authority@gmail.com / password123');

    // Create 5 demo tickets at Bangalore coordinates
    const tickets = [
      {
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        photoUrl: '/uploads/demo-garbage-1.jpg',
        severity: 'High',
        status: 'Unclaimed',
        generatedBy: marker._id,
        approvedBy: authority._id,
        generationTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        approvalTime: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000)
      },
      {
        location: { type: 'Point', coordinates: [77.5930, 12.9721] },
        photoUrl: '/uploads/demo-garbage-2.jpg',
        severity: 'Medium',
        status: 'Unclaimed',
        generatedBy: marker._id,
        approvedBy: authority._id,
        generationTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        approvalTime: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000)
      },
      {
        location: { type: 'Point', coordinates: [77.5962, 12.9698] },
        photoUrl: '/uploads/demo-garbage-3.jpg',
        severity: 'Low',
        status: 'In Progress',
        generatedBy: marker2._id,
        approvedBy: authority._id,
        claimedBy: volunteer2._id,
        generationTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        approvalTime: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000),
        claimTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        claimDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        location: { type: 'Point', coordinates: [77.5922, 12.9735] },
        photoUrl: '/uploads/demo-garbage-4.jpg',
        severity: 'High',
        status: 'Pending',
        generatedBy: marker2._id,
        generationTime: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000)
      },
      {
        location: { type: 'Point', coordinates: [77.5950, 12.9700] },
        photoUrl: '/uploads/demo-garbage-5.jpg',
        severity: 'Medium',
        status: 'Unclaimed',
        generatedBy: marker._id,
        approvedBy: authority._id,
        generationTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        approvalTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      }
    ];

    await Ticket.insertMany(tickets);

    // Update user stats to match seed data
    await Marker.findByIdAndUpdate(marker._id, {
      ticketsGenerated: 3,
      ticketsApproved: 3,
      ticketsCleared: 0
    });
    await Marker.findByIdAndUpdate(marker2._id, {
      ticketsGenerated: 2,
      ticketsApproved: 1,
      ticketsCleared: 0
    });
    await Volunteer.findByIdAndUpdate(volunteer2._id, {
      ticketsClaimed: 1,
      ticketsClosed: 0
    });
    await Authority.findByIdAndUpdate(authority._id, {
      ticketsApproved: 4
    });

    console.log('🗑️  Created 5 demo tickets in Bangalore area');
    console.log('');
    console.log('╔═══════════════════════════════════════╗');
    console.log('║    ✅ Seed completed successfully!     ║');
    console.log('║    Run: npm run dev                    ║');
    console.log('╚═══════════════════════════════════════╝');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
