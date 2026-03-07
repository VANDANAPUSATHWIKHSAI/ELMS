const mongoose = require('mongoose');
const User = require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
    // 1. Check Assistant Professors
    const profs = await User.find({ 
        employeeId: { $gte: '868', $lte: '872' }, 
        designation: 'Assistant Professor' 
    });
    console.log('--- Assistant Professors Check ---');
    console.log(`Newly Added (868-872): ${profs.length}`);
    profs.forEach(p => console.log(`- ID: ${p.employeeId} | Name: ${p.firstName} ${p.lastName}`));

    // 2. Check for "Unknown" Users in Leaves
    const allLeaves = await LeaveRequest.find();
    let orphanLeaves = [];
    for (const l of allLeaves) {
        const u = await User.findOne({ employeeId: l.employeeId });
        if (!u) orphanLeaves.push(l.employeeId);
    }
    console.log('\n--- Orphan Records (Deleted Users) ---');
    console.log(`Total Orphan Leaves (should be filtered out by backend): ${orphanLeaves.length}`);
    if (orphanLeaves.length > 0) {
        console.log(`Sample Orphan IDs: ${[...new Set(orphanLeaves)].join(', ')}`);
    }

    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
