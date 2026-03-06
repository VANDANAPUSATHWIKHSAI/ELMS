const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, ref: 'User' },
  leaveType: { 
    type: String, 
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  isHalfDay: { type: Boolean, default: false },
  halfDayType: { type: String, enum: ['FN', 'AN', null], default: null }, // Forenoon or Afternoon
  documentUrl: { type: String }, // For AL and On Duty file uploads
  
  // Tracks how many of each leaf type were actually deducted for this request
  deductionBreakdown: {
    type: Map,
    of: Number,
    default: {}
  },
  
  // Class Adjustments (SRS Requirement 6.4)
  adjustments: [{
    date: Date,
    period: String, // e.g., "10:00 AM - 11:00 AM"
    yearAndSection: String, // e.g., "III CSE-B"
    adjustedWith: { type: String, required: true } // Employee ID of substitute
  }],

  // Approval Workflow
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Auto-Approved', 'Cancelled'], 
    default: 'Pending' 
  },
  hodApproval: {
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    comment: String,
    date: Date,
    actionBy: String
  },
  principalApproval: {
    // Only required if HoD rejects or specific policy triggers
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'N/A'], default: 'N/A' },
    comment: String,
    date: Date,
    actionBy: String
  },
  
  appliedOn: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);