const mongoose = require('mongoose');

const summerConfigSchema = new mongoose.Schema({
  // Array of month numbers (0-indexed, like JS Date)
  // e.g. [2, 3] for March, April
  summerMonths: [{ type: Number }],
  
  // Rules based on tenure (years worked)
  rules: [{
    minYears: { type: Number, required: true },
    maxYears: { type: Number }, // Optional, null means "and above"
    leaveCount: { type: Number, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('SummerConfig', summerConfigSchema);
