const mongoose = require('mongoose');

const AdjustmentSchema = new mongoose.Schema({
  requesterId: { type: String, required: true },
  requesterName: { type: String, required: true },
  targetEmployeeId: { type: String, required: true },
  targetName: { type: String, required: true },
  date: { type: Date, required: true },
  period: { type: String, required: true },
  classSection: { type: String, required: true },
  reason: { type: String },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Adjustment', AdjustmentSchema);
