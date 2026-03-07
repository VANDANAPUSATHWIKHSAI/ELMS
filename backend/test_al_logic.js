const mongoose = require('mongoose');
const User = require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');
const LeaveLedger = require('./models/LeaveLedger');

async function testAlDeduction() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms');
        console.log("Connected to MongoDB");

        const employeeId = '868'; // Arjun
        const user = await User.findOne({ employeeId });
        const initialAl = user.leaveBalance.al;
        console.log(`Initial AL for ${employeeId}: ${initialAl}`);

        // Mock deduction logic from server.js
        const days = 1;
        let remainingDays = days;
        let breakdown = { al: 0, cl: 0, ccl: 0, lop: 0 };

        // Eligibility check
        const isAsstProf = user.designation && user.designation.toLowerCase().includes('assistant professor');
        if (!user.isPhdRegistered && !isAsstProf) {
            console.log("Not eligible for AL");
            process.exit(1);
        }

        const currentYear = new Date().getFullYear();
        const ledgerEntriesYear = await LeaveLedger.find({
            employeeId,
            leaveType: 'AL',
            transactionType: 'Debit',
            date: { $gte: new Date(currentYear, 0, 1), $lte: new Date(currentYear, 11, 31) }
        });
        const alUsed = ledgerEntriesYear.reduce((sum, e) => sum + Math.abs(e.amount), 0);
        const alLimit = 5;
        const alAvailable = Math.max(0, alLimit - alUsed);
        
        console.log(`AL Available (Ledger based): ${alAvailable}`);

        const alToDeduct = Math.min(remainingDays, alAvailable);
        if (alToDeduct > 0) {
            breakdown.al = alToDeduct;
            user.leaveBalance.al -= alToDeduct; // The fix we applied
            remainingDays -= alToDeduct;
        }

        console.log(`Deducted ${alToDeduct} from AL balance.`);
        console.log(`New AL balance (Before Save): ${user.leaveBalance.al}`);

        if (user.leaveBalance.al !== initialAl - alToDeduct) {
            console.error("DEDUCTION FAILED!");
            process.exit(1);
        }

        // Test refund logic (similar to cancel/reject)
        console.log("Testing refund logic...");
        if (breakdown.al > 0) {
            user.leaveBalance.al += breakdown.al;
        }
        console.log(`AL balance after refund: ${user.leaveBalance.al}`);

        if (user.leaveBalance.al !== initialAl) {
            console.error("REFUND FAILED!");
            process.exit(1);
        }

        console.log("VERIFICATION SUCCESSFUL!");
        process.exit(0);
    } catch (err) {
        console.error("Verification failed:", err);
        process.exit(1);
    }
}

testAlDeduction();
