const mongoose = require('mongoose');
const User = require('./models/User');
const LeaveLedger = require('./models/LeaveLedger');
const LeaveRequest = require('./models/LeaveRequest');
const Holiday = require('./models/Holiday');

const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms';

async function testDeduction() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const testEmployeeId = 'UNIT_TEST_EMP';
    
    // Clean up
    await User.deleteOne({ employeeId: testEmployeeId });
    await LeaveLedger.deleteMany({ employeeId: testEmployeeId });
    await LeaveRequest.deleteMany({ employeeId: testEmployeeId });

    // 1. Create Test User (Assistant Professor)
    const user = new User({
        employeeId: testEmployeeId,
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
        designation: 'Assistant Professor', // Should have 5 AL
        leaveBalance: { cl: 2, ccl: 1, al: 0, lop: 0 } // Start with 2 CL, 1 CCL
    });
    await user.save();
    console.log('Created Test User');

    // 2. Mock AL Application (3 days)
    // Expect: 3 AL deducted (if we manually seed AL or logic handles it)
    // Wait, the logic calculates AL used from ledger.
    // Let's test Standard Leave first: 2 days
    // Expect: 1 CCL, 1 CL. Remaining: 0 CCL, 1 CL.
    
    console.log('\n--- Test 1: Standard Leave (2 days) ---');
    await applyLeave(testEmployeeId, 'Standard', 2, true); // true for "Standard" or "CL"
    
    let updatedUser = await User.findOne({ employeeId: testEmployeeId });
    console.log('Balance After Test 1:', updatedUser.leaveBalance);
    // Expected: { cl: 1, ccl: 0, al: 0, lop: 0 }

    // 3. Mock AL Application (2 days)
    // Expect: 2 AL deducted (since limit 5 and used 0).
    // Ledger check...
    
    console.log('\n--- Test 2: AL Leave (2 days) ---');
    await applyLeave(testEmployeeId, 'AL', 2, false, true); // true for documentUrl
    
    updatedUser = await User.findOne({ employeeId: testEmployeeId });
    console.log('Balance After Test 2:', updatedUser.leaveBalance);
    // Expected: { cl: 1, ccl: 0, al: 0, lop: 0 } (AL doesn't affect user.leaveBalance in DB usually, it's tracked in ledger)
    // Actually, in the code, AL *can* fall back to CL.
    
    // 4. Mock AL Application (6 days total, but we used 2 already, so 3 more AL available)
    // Let's apply 4 days AL.
    // Expect: 3 AL, 1 CL.
    console.log('\n--- Test 3: AL Leave (4 days) ---');
    await applyLeave(testEmployeeId, 'AL', 4, false, true);
    
    updatedUser = await User.findOne({ employeeId: testEmployeeId });
    console.log('Balance After Test 3:', updatedUser.leaveBalance);
    // Expected: { cl: 0, ccl: 0, al: 0, lop: 0 } (Since it used 1 CL for overflow)

    // 5. Mock Standard Leave (1 day)
    // Expect: 1 LOP (since all others zero)
    console.log('\n--- Test 4: Standard Leave (1 day) ---');
    await applyLeave(testEmployeeId, 'Standard', 1, true);
    
    updatedUser = await User.findOne({ employeeId: testEmployeeId });
    console.log('Balance After Test 4:', updatedUser.leaveBalance);
    // Expected: { cl: 0, ccl: 0, al: 0, lop: 1 }

    await mongoose.disconnect();
}

// Simplified applyLeave mock based on server.js logic
async function applyLeave(employeeId, leaveType, days, docNotRequired = false, hasDoc = true) {
    const user = await User.findOne({ employeeId });
    let remainingDays = days;
    let breakdown = { ccl: 0, cl: 0, al: 0, lop: 0 };
    const documentUrl = hasDoc ? 'mock.pdf' : null;

    if (leaveType === 'AL') {
        const isAsstProf = user.designation && user.designation.toLowerCase().includes('assistant professor');
        if (!user.isPhdRegistered && !isAsstProf) {
            console.log('FAIL: Not eligible for AL'); return;
        }
        if (!documentUrl) {
            console.log('FAIL: Mandatory document missing'); return;
        }

        const currentYear = new Date().getFullYear();
        const ledgerEntriesYear = await LeaveLedger.find({
            employeeId,
            leaveType: 'AL',
            transactionType: 'Debit',
            date: { $gte: new Date(currentYear, 0, 1), $lte: new Date(currentYear, 11, 31) }
        });
        const alUsed = ledgerEntriesYear.reduce((sum, e) => sum + Math.abs(e.amount), 0);
        const alAvailable = Math.max(0, 5 - alUsed);
        
        const alToDeduct = Math.min(remainingDays, alAvailable);
        if (alToDeduct > 0) {
            breakdown.al = alToDeduct;
            remainingDays -= alToDeduct;
        }
        if (remainingDays > 0 && user.leaveBalance.cl > 0) {
            const clToDeduct = Math.min(remainingDays, user.leaveBalance.cl);
            user.leaveBalance.cl -= clToDeduct;
            breakdown.cl = clToDeduct;
            remainingDays -= clToDeduct;
        }
    } else if (leaveType === 'Standard' || leaveType === 'CL') {
        if (remainingDays > 0 && user.leaveBalance.ccl > 0) {
            const cclToDeduct = Math.min(remainingDays, user.leaveBalance.ccl);
            user.leaveBalance.ccl -= cclToDeduct;
            breakdown.ccl = cclToDeduct;
            remainingDays -= cclToDeduct;
        }
        if (remainingDays > 0 && user.leaveBalance.cl > 0) {
            const clToDeduct = Math.min(remainingDays, user.leaveBalance.cl);
            user.leaveBalance.cl -= clToDeduct;
            breakdown.cl = clToDeduct;
            remainingDays -= clToDeduct;
        }
    }

    if (remainingDays > 0) {
        user.leaveBalance.lop += remainingDays;
        breakdown.lop = remainingDays;
        remainingDays = 0;
    }

    await User.updateOne({ employeeId }, { $set: { leaveBalance: user.leaveBalance } });
    
    // Log to ledger for AL tracking
    if (breakdown.al > 0) {
        await new LeaveLedger({
            employeeId, 
            transactionType: 'Debit', 
            leaveType: 'AL', 
            amount: -breakdown.al, 
            date: new Date(),
            reason: 'Test AL Deduction',
            balanceAfter: 0 // Mock value
        }).save();
    }

    console.log(`Applied ${days}d ${leaveType}:`, breakdown);
}

testDeduction().catch(console.error);
