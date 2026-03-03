const mongoose = require('mongoose');
const LeaveLedger = require('./models/LeaveLedger');
const User = require('./models/User');
const fs = require('fs');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  try {
    const user = await User.findOne({ firstName: /pooja/i });
    if (!user) { console.log('not found'); process.exit(); }
    
    console.log(`Found Employee: ${user.employeeId} - ${user.firstName} ${user.lastName}`);
    
    const entries = await LeaveLedger.find({employeeId: user.employeeId});
    let clSum = 0;
    entries.forEach(e => {
        if(e.leaveType === 'CL') clSum += e.amount;
    });

    fs.writeFileSync('debug_pooja.json', JSON.stringify({
      employeeId: user.employeeId,
      leaveBalance: user.leaveBalance,
      netClLedger: clSum,
      clLedgerEntriesCount: entries.filter(e => e.leaveType === 'CL').length,
    }, null, 2));

    console.log("JSON written successfully.");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
});
