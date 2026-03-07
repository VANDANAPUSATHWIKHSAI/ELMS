const mongoose = require('mongoose');
const User = require('./models/User');
const LeaveLedger = require('./models/LeaveLedger');

async function repairAlBalances() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms');
        console.log("Connected to MongoDB");

        const users = await User.find({});
        console.log(`Checking ${users.length} users...`);

        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31);

        for (const user of users) {
            const isAsstProf = user.designation && user.designation.toLowerCase().includes('assistant professor');
            const isPhd = user.isPhdRegistered;

            if (isAsstProf || isPhd) {
                // Calculate AL used this year
                const ledgerEntriesYear = await LeaveLedger.find({
                    employeeId: user.employeeId,
                    leaveType: 'AL',
                    transactionType: 'Debit',
                    date: { $gte: startOfYear, $lte: endOfYear }
                });

                const alUsed = ledgerEntriesYear.reduce((sum, e) => sum + Math.abs(e.amount), 0);
                const alLimit = 5;
                const alRemaining = Math.max(0, alLimit - alUsed);

                if (user.leaveBalance.al !== alRemaining) {
                    console.log(`Updating user ${user.employeeId} (${user.firstName}): AL ${user.leaveBalance.al} -> ${alRemaining}`);
                    user.leaveBalance.al = alRemaining;
                    user.markModified('leaveBalance');
                    await user.save();
                } else {
                    console.log(`User ${user.employeeId} (${user.firstName}) already has correct AL balance: ${alRemaining}`);
                }
            } else {
                if (user.leaveBalance.al !== 0) {
                    console.log(`Resetting user ${user.employeeId} (${user.firstName}) AL balance to 0 (Not eligible).`);
                    user.leaveBalance.al = 0;
                    user.markModified('leaveBalance');
                    await user.save();
                }
            }
        }

        console.log("Repair completed!");
        process.exit(0);
    } catch (err) {
        console.error("Repair failed:", err);
        process.exit(1);
    }
}

repairAlBalances();
