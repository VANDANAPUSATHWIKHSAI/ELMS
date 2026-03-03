const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['National', 'Festival', 'Optional', 'Summer Holidays', 'Other'], default: 'Festival' }
}, { timestamps: true });

module.exports = mongoose.model('Holiday', HolidaySchema);
