// backend/seed.js
const mongoose = require('mongoose');
const User = require('./models/User'); 
require('dotenv').config();

// Replace with your local DB string or Atlas URI
const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms'; 

const seedUsers = [
  // 1. EMPLOYEE (Existing)
  {
    employeeId: "562",
    password: "password123",
    role: "Employee",
    firstName: "A V",
    lastName: "NAGIREDDY",
    email: "nagireddykmit@gmail.com",
    mobile: "7989671309",
    gender: "Male",
    dob: new Date("1989-07-05"),
    doj: new Date("2016-12-05"),
    address: "Hyderabad, Telangana",
    department: "COMPUTER SCIENCE AND ENGINEERING-III",
    designation: "Assistant Professor",
    aadhaar: "347288429977",
    pan: "AOHPA95320",
    jntuUid: "51150404-152919",
    aicteId: "1-2496066169",
    leaveBalance: { cl: 12, ccl: 4, al: 6, lop: 0 }
  },

  // 2. HEAD OF DEPARTMENT (HoD) - Matches Employee's Dept
  {
    employeeId: "HOD01",
    password: "hodpassword",
    role: "HoD",
    firstName: "Sreenivasa",
    lastName: "Rao",
    email: "hod.cse3@kmit.in",
    mobile: "9876543210",
    gender: "Male",
    dob: new Date("1980-01-01"),
    doj: new Date("2010-06-15"),
    address: "Hyderabad, Telangana",
    department: "COMPUTER SCIENCE AND ENGINEERING-III", // Same dept as Employee
    designation: "Head of Department",
    aadhaar: "111122223333",
    pan: "ABCDE1234F",
    jntuUid: "HOD-101",
    aicteId: "AICTE-HOD-1",
    leaveBalance: { cl: 12, ccl: 10, al: 0, lop: 0 }
  },

  // 3. DEAN / PRINCIPAL (Global Access)
  {
    employeeId: "PRIN01",
    password: "principalpassword",
    role: "Principal", // Matches schema enum
    firstName: "Maheshwar",
    lastName: "Dutta",
    email: "principal@kmit.in",
    mobile: "9988776655",
    gender: "Male",
    dob: new Date("1975-08-15"),
    doj: new Date("2005-04-01"),
    address: "Hyderabad, Telangana",
    department: "Administration",
    designation: "Principal",
    aadhaar: "444455556666",
    pan: "PRIN98765G",
    jntuUid: "PRIN-001",
    aicteId: "AICTE-PRIN-1",
    leaveBalance: { cl: 12, ccl: 0, al: 0, lop: 0 }
  },

  // 4. ADMIN (System Configuration)
  {
    employeeId: "ADMIN01",
    password: "adminpassword",
    role: "Admin",
    firstName: "System",
    lastName: "Admin",
    email: "admin@kmit.in",
    mobile: "1231231234",
    gender: "Female",
    dob: new Date("1990-01-01"),
    doj: new Date("2020-01-01"),
    address: "KMIT Campus",
    department: "IT Support",
    designation: "System Administrator",
    aadhaar: "777788889999",
    pan: "ADM12345H",
    jntuUid: "ADM-001",
    aicteId: "AICTE-ADM-1",
    leaveBalance: { cl: 12, ccl: 0, al: 0, lop: 0 }
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data to avoid duplicates
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Insert new data
    await User.insertMany(seedUsers);
    console.log('🌱 Database seeded successfully!');
    console.log(`   - Created ${seedUsers.length} users (Employee, HoD, Principal, Admin)`);
    
    mongoose.connection.close();
    console.log('👋 Connection closed');
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();