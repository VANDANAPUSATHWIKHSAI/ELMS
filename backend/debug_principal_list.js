const mongoose = require('mongoose');
const LeaveRequest = require('./models/LeaveRequest');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  const today = new Date();
  today.setHours(0,0,0,0);
  console.log('--- Today Date:', today.toISOString());

  const leaves = await LeaveRequest.find({
    'hodApproval.status': { $in: ['Approved', 'Rejected'] }
  }).sort({ appliedOn: -1 }).limit(10);

  console.log('--- Recent HoD Decided Leaves ---');
  leaves.forEach(l => {
    console.log(`ID: ${l._id}`);
    console.log(`  EmpID: ${l.employeeId}`);
    console.log(`  Start: ${l.startDate.toISOString()}`);
    console.log(`  End:   ${l.endDate.toISOString()}`);
    console.log(`  HoD Status: ${l.hodApproval.status}`);
    console.log(`  Principal Status: ${l.principalApproval?.status}`);
    console.log(`  Current Status: ${l.status}`);
    console.log(`  isFuture (> today): ${l.startDate > today}`);
    console.log(`  isToday or Future (>= today): ${l.startDate >= today}`);
    console.log('---------------------------');
  });

  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
