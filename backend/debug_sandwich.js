const mongoose = require('mongoose');
const LeaveRequest = require('./models/LeaveRequest');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  const leaves = await LeaveRequest.find({
    startDate: { $gte: new Date('2026-03-01') }
  }).sort({ appliedOn: -1 }).limit(20);

  console.log('--- Recent Leaves ---');
  leaves.forEach(l => {
    console.log(`ID: ${l._id}`);
    console.log(`  Emp: ${l.employeeId}`);
    console.log(`  Type: ${l.leaveType}`);
    console.log(`  Start: ${l.startDate.toISOString().split('T')[0]}`);
    console.log(`  End:   ${l.endDate.toISOString().split('T')[0]}`);
    console.log(`  Status: ${l.status}`);
    console.log(`  Breakdown: ${JSON.stringify(l.deductionBreakdown)}`);
  });

  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
