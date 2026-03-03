const mongoose = require('mongoose');
const LeaveLedger = require('./models/LeaveLedger');
const User = require('./models/User');
const fs = require('fs');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  try {
    const user = await User.findOne({employeeId: '2014'});
    
    const entries = await LeaveLedger.find({employeeId: '2014'});
    let clSum = 0;
    let cclSum = 0;
    entries.forEach(e => {
        if(e.leaveType === 'CL') clSum += e.amount;
        if(e.leaveType === 'CCL') cclSum += e.amount;
    });

    fs.writeFileSync('debug_ccl.json', JSON.stringify({
      leaveBalance: user.leaveBalance,
      netClLedger: clSum,
      netCclLedger: cclSum,
      clLedgerEntriesCount: entries.filter(e => e.leaveType === 'CL').length,
      cclLedgerEntriesCount: entries.filter(e => e.leaveType === 'CCL').length,
    }, null, 2));

    console.log("JSON written successfully.");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
});
