const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  lastAttempt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);