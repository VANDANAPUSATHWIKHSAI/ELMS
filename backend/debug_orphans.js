const mongoose = require('mongoose');
const User = require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  const leaves = await LeaveRequest.find({'hodApproval.status': {$in: ['Approved', 'Rejected']}});
  console.log('Total reviewed leaves:', leaves.length);
  
  for (const l of leaves) {
    const eid = String(l.employeeId).trim();
    const u = await User.findOne({employeeId: eid});
    if (!u) {
      console.log('ORPHAN FOUND: ID="' + l.employeeId + '" (ID Length: ' + String(l.employeeId).length + '), SearchID="' + eid + '", LeaveID=' + l._id);
    }
  }
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
