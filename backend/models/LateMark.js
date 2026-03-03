const mongoose = require('mongoose');

const lateMarkSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  date: { type: Date, required: true },
  reason: { type: String, default: 'Late Arrival' },
  addedBy: { type: String, required: true }, // Admin who added it
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LateMark', lateMarkSchema);
