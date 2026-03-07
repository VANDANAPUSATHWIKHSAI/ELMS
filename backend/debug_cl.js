const mongoose = require('mongoose');
const User = require('./models/User');
const LeaveLedger = require('./models/LeaveLedger');
const LeaveRequest = require('./models/LeaveRequest');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  const employeeId = '601';
  const u = await User.findOne({ employeeId });
  console.log('cl:', u.leaveBalance.cl);
  
  const all = await LeaveLedger.find({ employeeId });
  console.log('ALL ledger entries:', all.length);
  
  const leaves = await LeaveRequest.find({ employeeId });
  console.log('Leave Requests:', leaves.length);
  leaves.forEach(l => console.log(l.status, l.leaveType, l.startDate?.toISOString()?.slice(0,10)));
  
  process.exit();
});
