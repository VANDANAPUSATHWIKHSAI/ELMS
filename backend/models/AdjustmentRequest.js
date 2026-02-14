const mongoose = require('mongoose');

const AdjustmentSchema = new mongoose.Schema({
  requesterId: { type: String, required: true }, // Who is asking (Employee A)
  targetEmployeeId: { type: String, required: true }, // Who they are asking (Employee B)
  date: { type: Date, required: true },
  period: { type: String, required: true }, // e.g., "1st Hour", "Lab Session"
  classSection: { type: String, required: true }, // e.g., "CSE-3A"
  reason: { type: String },
  status: { 
    type: String, 
    enum: ['Pending', 'Accepted', 'Rejected'], 
    default: 'Pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdjustmentRequest', AdjustmentSchema);