const mongoose = require('mongoose');
const User = require('./models/User');
const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms';

async function verify() {
  await mongoose.connect(MONGO_URI);
  const user = await User.findOne({ employeeId: '1' });
  if (user) {
    console.log(`User 1 found. Password matches: ${user.password === 'password123'}`);
    console.log(`Stored password: ${user.password}`);
  } else {
    console.log('User 1 NOT found');
  }
  process.exit();
}
verify();
