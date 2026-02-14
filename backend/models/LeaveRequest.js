const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, ref: 'User' },
  leaveType: { 
    type: String, 
    enum: ['CL', 'CCL', 'AL', 'LoP', 'OD', 'SCL'], // Added standard types
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  
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
    enum: ['Pending', 'Approved', 'Rejected', 'Auto-Approved'], 
    default: 'Pending' 
  },
  hodApproval: {
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    comment: String,
    date: Date
  },
  principalApproval: {
    // Only required if HoD rejects or specific policy triggers
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'N/A'], default: 'N/A' },
    comment: String,
    date: Date
  },
  
  appliedOn: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);