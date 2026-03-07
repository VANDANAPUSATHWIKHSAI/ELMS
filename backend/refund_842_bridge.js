const mongoose = require('mongoose');
const User = require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');
const LeaveLedger = require('./models/LeaveLedger');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
    const employeeId = '842';
    const user = await User.findOne({ employeeId });
    if (!user) {
        console.error("User 842 not found");
        process.exit(1);
    }

    // Find the bridge deduction for March 14-15
    // We previously used 'fix_missing_deduction_842.js' or 'repair_sandwich_final.js'
    // Let's find the ledger entry representing that 1.0 day deduction
    const bridgeEntry = await LeaveLedger.findOne({
        employeeId,
        transactionType: 'Debit',
        reason: /Bridge|Sandwich/i,
        amount: -1.0,
        createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Recent
    });

    if (!bridgeEntry) {
        console.log("Could not find a recent 1.0 day bridge deduction for 842. Checking general balance...");
    }

    // Manual Refund: Add 1.0 back to CL
    user.leaveBalance.cl += 1.0;
    user.markModified('leaveBalance');
    await user.save();

    await LeaveLedger.create({
        employeeId,
        transactionType: 'Credit',
        leaveType: 'CL',
        amount: 1.0,
        reason: "Refund: Sandwich rule incorrectly applied to half-day (March 14-15 bridge)",
        balanceAfter: user.leaveBalance.cl
    });

    console.log(`Refunded 1.0 CL to Employee 842. New Balance: ${user.leaveBalance.cl}`);

    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
