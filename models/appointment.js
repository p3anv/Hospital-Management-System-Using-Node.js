// models/appointment.js

const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  patientId: { type: String },
  doctor: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  reason: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['confirmed', 'cancelled', 'completed'], default: 'confirmed' },
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
