const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms';

async function updatePasswords() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to DB');
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('678', salt);
    
    const result = await User.updateMany({ role: 'Employee' }, { $set: { password: hash } });
    console.log(`✅ Hashed passwords for ${result.modifiedCount} employees.`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updatePasswords();
