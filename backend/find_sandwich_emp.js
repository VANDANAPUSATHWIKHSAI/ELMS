const mongoose = require('mongoose');
const LeaveRequest = require('./models/LeaveRequest');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  const leaves = await LeaveRequest.find({
    startDate: { $gte: new Date('2026-03-10'), $lte: new Date('2026-03-20') }
  });
  
  console.log('--- Leaves between March 10th and 20th ---');
  leaves.forEach(l => {
    console.log(`Emp: ${l.employeeId} | Start: ${l.startDate.toISOString().split('T')[0]} | End: ${l.endDate.toISOString().split('T')[0]} | Status: ${l.status}`);
  });
  
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
