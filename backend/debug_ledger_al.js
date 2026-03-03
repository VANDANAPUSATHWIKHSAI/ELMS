const mongoose = require('mongoose');
const User = require('./models/User');
const LeaveLedger = require('./models/LeaveLedger');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  try {
    const employeeId = '2014';
    const year = new Date().getFullYear();
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const ledgerData = monthNames.map(name => ({
      month: name,
      cl: 0, ccl: 0, od: 0, al: 0, 
      total: 0, lates: 0, availed: 0, remaining: 0, lop: 0
    }));

    const user = await User.findOne({ employeeId });
    const isAssistantProfessor = user && (user.designation === 'Assistant Professor' || user.designation?.toLowerCase().includes('phd'));
    
    console.log("Is Assistant Professor?", isAssistantProfessor);

    if (isAssistantProfessor) {
        ledgerData[0].al = 5;
    }

    const ledgerEntries = await LeaveLedger.find({ 
      employeeId, 
      date: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31) } 
    }).sort({ date: 1 });

    let runningCl = 0, runningCcl = 0, runningAl = isAssistantProfessor ? 5 : 0;

    ledgerEntries.forEach(entry => {
      const monthIdx = new Date(entry.date).getMonth();
      const type = entry.leaveType.toLowerCase();
      
      if (entry.transactionType === 'Credit' || entry.transactionType === 'CarryForward' || entry.transactionType === 'Reset') {
        if (type === 'cl') { ledgerData[monthIdx].cl += entry.amount; runningCl += entry.amount; }
        if (type === 'ccl') { ledgerData[monthIdx].ccl += entry.amount; runningCcl += entry.amount; }
        if (type === 'al' && !isAssistantProfessor) { 
           ledgerData[monthIdx].al += entry.amount; 
           runningAl += entry.amount; 
        }
      } else if (entry.transactionType === 'Debit') {
        const absAmount = Math.abs(entry.amount);
        ledgerData[monthIdx].availed += absAmount;
        if (type === 'lop') ledgerData[monthIdx].lop += absAmount;
        if (type === 'cl') runningCl -= absAmount;
        if (type === 'ccl') runningCcl -= absAmount;
        if (type === 'al') runningAl -= absAmount;
      }
    });

    let previousRemaining = isAssistantProfessor ? 5 : 0;
    let totalClCredits = 0;
    let totalCclCredits = 0;
    let totalAlCredits = isAssistantProfessor ? 5 : 0;
    let totalAvailed = 0;

    ledgerData.forEach((m, index) => {
      totalClCredits += m.cl;
      totalCclCredits += m.ccl;
      if (!isAssistantProfessor || index === 0) { 
          totalAlCredits += m.al; 
      }
      
      totalAvailed += m.availed;

      m.total = m.cl + m.ccl + m.al; 
      
      m.remaining = (totalClCredits + totalCclCredits + totalAlCredits) - totalAvailed;
    });

    console.log(JSON.stringify(ledgerData.slice(0, 3), null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
});
