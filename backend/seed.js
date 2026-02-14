const mongoose = require('mongoose');
const User = require('./models/User'); 
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms'; 

// 1. Read users from JSON file
const jsonPath = path.join(__dirname, 'users.json');
const rawUsers = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// 2. Enhance users with default password and dummy legal IDs if missing
const finalUsers = rawUsers.map(u => ({
  ...u,
  password: "password123", // <--- Password added here automatically
  dob: new Date("1990-01-01"),
  doj: new Date("2022-06-01"),
  address: u.address || "Hyderabad, Telangana",
  aadhaar: u.aadhaar || `1234${Math.floor(10000000 + Math.random() * 90000000)}`,
  pan: u.pan || `ABCDE${Math.floor(1000 + Math.random() * 9000)}F`,
  jntuUid: u.jntuUid || `JNTU-${u.employeeId}`,
  aicteId: u.aicteId || `AICTE-${u.employeeId}`
}));

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Insert new data
    await User.insertMany(finalUsers);
    console.log(`🌱 Database seeded successfully with ${finalUsers.length} users!`);
    console.log('   - Includes Admin, Principal, HoDs, and Employees');
    console.log('   - Default Password for all: password123');
    
    mongoose.connection.close();
    console.log('👋 Connection closed');
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();