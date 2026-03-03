const mongoose = require('mongoose');
const LeaveLedger = require('./models/LeaveLedger');
const fs = require('fs');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  try {
    const entries = await LeaveLedger.find({employeeId: '2014'});
    fs.writeFileSync('debug_pooja2.json', JSON.stringify(entries, null, 2));
    console.log("JSON written successfully.");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
});
