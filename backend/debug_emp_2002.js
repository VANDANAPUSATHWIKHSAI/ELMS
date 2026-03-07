const mongoose = require('mongoose');
const LeaveRequest = require('./models/LeaveRequest');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  const empId = '2002';
  const leaves = await LeaveRequest.find({
    employeeId: empId,
    startDate: { $gte: new Date('2026-03-01'), $lte: new Date('2026-03-31') }
  });

  console.log(`--- Leaves for Employee ${empId} in March ---`);
  leaves.forEach(l => {
    console.log(`ID: ${l._id}`);
    console.log(`  Start: ${l.startDate.toISOString().split('T')[0]}`);
    console.log(`  End:   ${l.endDate.toISOString().split('T')[0]}`);
    console.log(`  Status: ${l.status}`);
    console.log(`  HoD: ${l.hodApproval?.status}`);
    console.log(`  Prin: ${l.principalApproval?.status}`);
    console.log(`  Breakdown: ${JSON.stringify(l.deductionBreakdown)}`);
  });

  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
