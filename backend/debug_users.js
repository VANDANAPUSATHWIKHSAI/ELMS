const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  try {
    const users = await User.find({});
    users.forEach(u => {
        console.log(`${u.employeeId} - ${u.firstName} - CL: ${u.leaveBalance?.cl}`);
    });
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
});
