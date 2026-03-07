const mongoose = require('mongoose');
const LeaveRequest = require('./models/LeaveRequest');
const User = require('./models/User');
const LeaveLedger = require('./models/LeaveLedger');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  const employeeId = '842';
  
  // Find leave 13
  const leave13 = await LeaveRequest.findOne({ employeeId, startDate: new Date('2026-03-13') });

  if (!leave13) {
    console.log("Leave 13 not found.");
    process.exit();
  }

  const user = await User.findOne({ employeeId });
  if (!user) {
    console.log("User not found.");
    process.exit();
  }

  console.log(`Deducting missing 1 day for Leave #${leave13._id} (March 13)...`);
  
  const deductionAmt = 1;
  const breakdown = leave13.deductionBreakdown || { cl: 0, ccl: 0, al: 0, lop: 0 };
  const ledgerEntries = [];

  // Deduct from CL if available, else LOP
  if (user.leaveBalance.cl > 0) {
    user.leaveBalance.cl -= deductionAmt;
    breakdown.cl = (breakdown.cl || 0) + deductionAmt;
    ledgerEntries.push({
      employeeId, transactionType: 'Debit', leaveType: 'CL', amount: -deductionAmt,
      reason: `RETROACTIVE: Missing Deduction for Overruled Leave #${leave13._id}`,
      referenceId: leave13._id, balanceAfter: user.leaveBalance.cl
    });
  } else {
    user.leaveBalance.lop = (user.leaveBalance.lop || 0) + deductionAmt;
    breakdown.lop = (breakdown.lop || 0) + deductionAmt;
    ledgerEntries.push({
      employeeId, transactionType: 'Debit', leaveType: 'LOP', amount: -deductionAmt,
      reason: `RETROACTIVE: Missing Deduction for Overruled Leave #${leave13._id}`,
      referenceId: leave13._id, balanceAfter: user.leaveBalance.lop
    });
  }

  // Save changes
  leave13.deductionBreakdown = breakdown;
  leave13.markModified('deductionBreakdown');
  await leave13.save();

  user.markModified('leaveBalance');
  await user.save();

  if (ledgerEntries.length > 0) {
    await LeaveLedger.insertMany(ledgerEntries);
  }

  console.log("Fix completed successfully! 1 additional day deducted.");
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
