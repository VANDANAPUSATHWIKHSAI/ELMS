const mongoose = require('mongoose');
const LeaveRequest = require('./models/LeaveRequest');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  const result = await LeaveRequest.updateMany(
    { 
      employeeId: '808', 
      startDate: { $gte: new Date('2026-03-20') }, 
      leaveType: 'OD', 
      'principalApproval.status': 'Approved' 
    }, 
    { $set: { 'principalApproval.status': 'N/A' } }
  );
  console.log('Fixed auto-approved OD leaves for 808:', result.modifiedCount);
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
