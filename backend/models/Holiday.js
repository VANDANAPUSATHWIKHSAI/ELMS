const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  type: { type: String, default: 'Festival' }
}, { timestamps: true });

module.exports = mongoose.model('Holiday', HolidaySchema);
