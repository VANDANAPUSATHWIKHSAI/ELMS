const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // e.g. 'cl', 'ml'
  name: { type: String, required: true }, // e.g. 'Casual Leave'
  defaultDays: { type: Number, default: 0 }
});

module.exports = mongoose.model('LeaveType', leaveTypeSchema);
