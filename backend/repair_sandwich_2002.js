const mongoose = require('mongoose');
const LeaveRequest = require('./models/LeaveRequest');
const User = require('./models/User');
const LeaveLedger = require('./models/LeaveLedger');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  const employeeId = '2002';
  const bridgeDays = 2; // March 14 (Holiday) and March 15 (Sunday)
  
  // Find the leave that should carry the bridge (usually the later one, March 16)
  const leave = await LeaveRequest.findOne({
    employeeId,
    startDate: new Date('2026-03-16'),
    status: { $in: ['Approved', 'Auto-Approved'] }
  });

  if (!leave) {
    console.log("March 16 leave not found or not approved.");
    process.exit();
  }

  const user = await User.findOne({ employeeId });
  if (!user) {
    console.log("User not found.");
    process.exit();
  }

  console.log(`Repairing Leave #${leave._id} for Employee ${employeeId}...`);
  console.log(`Found ${bridgeDays} bridge days to deduct.`);

  let remaining = bridgeDays;
  const breakdown = leave.deductionBreakdown || { cl: 0, ccl: 0, al: 0, lop: 0 };
  const ledgerEntries = [];

  // Deduct from CL if available, else LOP
  if (remaining > 0 && user.leaveBalance.cl > 0) {
    const use = Math.min(remaining, user.leaveBalance.cl);
    user.leaveBalance.cl -= use;
    breakdown.cl = (breakdown.cl || 0) + use;
    remaining -= use;
    ledgerEntries.push({
      employeeId, transactionType: 'Debit', leaveType: 'CL', amount: -use,
      reason: `RETROACTIVE: Sandwich Rule Bridge (Mar 14, 15) for Leave #${leave._id}`,
      referenceId: leave._id, balanceAfter: user.leaveBalance.cl
    });
  }

  if (remaining > 0) {
    user.leaveBalance.lop = (user.leaveBalance.lop || 0) + remaining;
    breakdown.lop = (breakdown.lop || 0) + remaining;
    ledgerEntries.push({
      employeeId, transactionType: 'Debit', leaveType: 'LOP', amount: -remaining,
      reason: `RETROACTIVE: Sandwich Rule Bridge (Mar 14, 15) for Leave #${leave._id}`,
      referenceId: leave._id, balanceAfter: user.leaveBalance.lop
    });
    remaining = 0;
  }

  // Save changes
  leave.deductionBreakdown = breakdown;
  leave.markModified('deductionBreakdown');
  await leave.save();

  user.markModified('leaveBalance');
  await user.save();

  if (ledgerEntries.length > 0) {
    await LeaveLedger.insertMany(ledgerEntries);
  }

  console.log("Repair completed successfully!");
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
