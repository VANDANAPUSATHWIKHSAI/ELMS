// backend/seed.js
const mongoose = require('mongoose');
const User = require('./models/User'); 
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms'; 

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Read users from JSON file
    const jsonPath = path.join(__dirname, 'users.json');
    const rawUsers = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    // 2. Prepare data (Add default password & Dummy IDs)
    const finalUsers = rawUsers.map(u => ({
      ...u,
      // Convert ID to string to ensure consistency (optional but safe)
      employeeId: String(u.employeeId), 
      password: "password123", 
      dob: new Date("1990-01-01"),
      doj: new Date("2022-06-01"),
      address: "Hyderabad, Telangana",
      aadhaar: `1234${Math.floor(10000000 + Math.random() * 90000000)}`,
      pan: `ABCDE${Math.floor(1000 + Math.random() * 9000)}F`,
      jntuUid: `JNTU-${u.employeeId}`,
      aicteId: `AICTE-${u.employeeId}`
    }));

    // 3. Clear & Insert
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    await User.insertMany(finalUsers);
    console.log(`🌱 Database seeded successfully with ${finalUsers.length} users!`);
    
    mongoose.connection.close();
    console.log('👋 Connection closed');
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();