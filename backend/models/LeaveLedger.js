const mongoose = require('mongoose');

const LeaveLedgerSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, ref: 'User' },
  transactionType: { 
    type: String, 
    enum: ['Credit', 'Debit', 'Reset', 'CarryForward'], 
    required: true 
  },
  leaveType: { type: String, required: true }, // CL, CCL, AL
  amount: { type: Number, required: true }, // Positive for credit, negative for debit
  
  reason: { type: String, required: true }, // e.g., "Quarterly Credit", "Leave #12345"
  referenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest' }, // Link to specific leave
  
  date: { type: Date, default: Date.now },
  
  // Snapshot of balance AFTER this transaction (for quick lookup)
  balanceAfter: { type: Number, required: true }
});

module.exports = mongoose.model('LeaveLedger', LeaveLedgerSchema);