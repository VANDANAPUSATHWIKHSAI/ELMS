const mongoose = require('mongoose');
const LeaveLedger = require('./models/LeaveLedger');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
    try {
        const ledger = await LeaveLedger.find({ 
            employeeId: '2014', 
            leaveType: 'CL', 
            date: { $gte: new Date(2026, 0, 1), $lte: new Date(2026, 11, 31) } 
        });
        console.log(JSON.stringify(ledger, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
});
