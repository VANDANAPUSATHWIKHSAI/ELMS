const mongoose = require('mongoose');
const LeaveRequest = require('./models/LeaveRequest');
const User = require('./models/User');
const LeaveLedger = require('./models/LeaveLedger');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  const employeeId = '842';
  
  // Find both leaves
  const leave13 = await LeaveRequest.findOne({ employeeId, startDate: new Date('2026-03-13') });
  const leave16 = await LeaveRequest.findOne({ employeeId, startDate: new Date('2026-03-16') });

  if (!leave13 || !leave16) {
    console.log("One or both leaves not found.");
    process.exit();
  }

  // Ensure both are marked as Approved (User said Principal accepted both)
  if (leave13.status !== 'Approved') {
      console.log(`Setting Leave 13 status to Approved (current: ${leave13.status})`);
      leave13.status = 'Approved';
      await leave13.save();
  }

  const user = await User.findOne({ employeeId });
  if (!user) {
    console.log("User not found.");
    process.exit();
  }

  console.log(`Repairing Sandwich for Emp 842: March 13 and March 16 both Approved.`);
  
  // Bridge is March 14 (Sat) and March 15 (Sun) = 2 days
  const bridgeDays = 2;
  let remaining = bridgeDays;
  const breakdown = leave16.deductionBreakdown || {}; 
  const ledgerEntries = [];

  // Deduct from CL if available, else LOP
  if (remaining > 0 && user.leaveBalance.cl > 0) {
    const use = Math.min(remaining, user.leaveBalance.cl);
    user.leaveBalance.cl -= use;
    breakdown.cl = (breakdown.cl || 0) + use;
    remaining -= use;
    ledgerEntries.push({
      employeeId, transactionType: 'Debit', leaveType: 'CL', amount: -use,
      reason: `RETROACTIVE: Sandwich Rule Bridge (Mar 14, 15) for Leave #${leave16._id}`,
      referenceId: leave16._id, balanceAfter: user.leaveBalance.cl
    });
  }

  if (remaining > 0) {
    user.leaveBalance.lop = (user.leaveBalance.lop || 0) + remaining;
    breakdown.lop = (breakdown.lop || 0) + remaining;
    ledgerEntries.push({
      employeeId, transactionType: 'Debit', leaveType: 'LOP', amount: -remaining,
      reason: `RETROACTIVE: Sandwich Rule Bridge (Mar 14, 15) for Leave #${leave16._id}`,
      referenceId: leave16._id, balanceAfter: user.leaveBalance.lop
    });
    remaining = 0;
  }

  // Save changes
  leave16.deductionBreakdown = breakdown;
  leave16.markModified('deductionBreakdown');
  await leave16.save();

  user.markModified('leaveBalance');
  await user.save();

  if (ledgerEntries.length > 0) {
    await LeaveLedger.insertMany(ledgerEntries);
  }

  console.log("Repair completed successfully! 2 bridge days deducted.");
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
