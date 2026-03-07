const mongoose = require('mongoose');
const LeaveRequest = require('./models/LeaveRequest');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log('--- Today:', today.toISOString());
  console.log('--- Tomorrow:', tomorrow.toISOString());

  const leavesToday = await LeaveRequest.find({
    startDate: { $gte: today, $lt: tomorrow },
    'hodApproval.status': { $in: ['Approved', 'Rejected'] }
  });

  console.log('--- Leaves starting TODAY:', leavesToday.length);
  leavesToday.forEach(l => {
    console.log(`ID: ${l._id}`);
    console.log(`  EmpID: ${l.employeeId}`);
    console.log(`  HoD Status: ${l.hodApproval.status}`);
    console.log(`  Principal Status: ${l.principalApproval?.status}`);
    console.log(`  Status: ${l.status}`);
  });

  const leavesFuture = await LeaveRequest.find({
    startDate: { $gte: tomorrow },
    'hodApproval.status': { $in: ['Approved', 'Rejected'] }
  }).limit(5);

  console.log('--- Future Leaves:', leavesFuture.length);
  leavesFuture.forEach(l => {
    console.log(`ID: ${l._id} | Start: ${l.startDate.toISOString()} | EmpID: ${l.employeeId}`);
  });

  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
