const mongoose = require('mongoose');
const LeaveLedger = require('./models/LeaveLedger');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  try {
    const employeeId = '2016';
    const year = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const currentQIdx = Math.floor(currentMonth / 3);

    const ledgerEntries = await LeaveLedger.find({ 
      employeeId, 
      date: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31) } 
    });

    const getNetUsed = (type) => {
        const typeLedger = ledgerEntries.filter(e => e.leaveType.toLowerCase() === type.toLowerCase());
        const debits = typeLedger.filter(e => e.transactionType === 'Debit');
        const totalDebitAmount = debits.reduce((sum, e) => sum + Math.abs(e.amount), 0);
        
        const debitRefIds = debits.map(d => d.referenceId ? d.referenceId.toString() : null).filter(Boolean);
        const refunds = typeLedger.filter(e => 
            e.transactionType === 'Credit' && 
            e.referenceId && 
            debitRefIds.includes(e.referenceId.toString())
        );
        const totalRefundAmount = refunds.reduce((sum, e) => sum + Math.abs(e.amount), 0);
        console.log(`[${type}] totalDebitAmount: ${totalDebitAmount}, totalRefundAmount: ${totalRefundAmount}`);
        return Math.max(0, totalDebitAmount - totalRefundAmount);
    };

    let clAllocatedUntilNow = (currentQIdx + 1) * 4;
    console.log(`clAllocatedUntilNow: ${clAllocatedUntilNow}`);
    
    const clUsedTotal = getNetUsed('cl');
    console.log(`clUsedTotal: ${clUsedTotal}`);
    
    const clRemainingNow = Math.max(0, clAllocatedUntilNow - clUsedTotal);
    console.log(`FINAL clRemainingNow: ${clRemainingNow}`);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
});
