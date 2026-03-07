const mongoose = require('mongoose');
const LeaveRequest = require('./models/LeaveRequest');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  const leaves = await LeaveRequest.find({
    employeeId: '842',
    startDate: { $gte: new Date('2026-03-10'), $lte: new Date('2026-03-20') }
  });
  
  console.log('--- Status of Leaves for Emp 842 ---');
  leaves.forEach(l => {
    console.log(`ID: ${l._id}`);
    console.log(`  Start: ${l.startDate.toISOString().split('T')[0]}`);
    console.log(`  End:   ${l.endDate.toISOString().split('T')[0]}`);
    console.log(`  Status: ${l.status}`);
    console.log(`  Prin Status: ${l.principalApproval?.status}`);
    console.log(`  HoD Status: ${l.hodApproval?.status}`);
    console.log(`  Breakdown: ${JSON.stringify(l.deductionBreakdown)}`);
  });
  
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
