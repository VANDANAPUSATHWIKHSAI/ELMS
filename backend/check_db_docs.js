const mongoose = require('mongoose');
const LeaveRequest = require('./models/LeaveRequest');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms')
  .then(async () => {
    const doc = await LeaveRequest.findOne({ documentUrl: { $exists: true, $ne: null } });
    if (doc) {
      console.log('Found doc with documentUrl:', JSON.stringify(doc.documentUrl));
    } else {
      console.log('No documents found in LeaveRequest');
    }
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
