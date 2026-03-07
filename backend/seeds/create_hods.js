const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');

const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms';

async function seedHods() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const depts = ['CSE', 'CSM'];
    const years = ['1st yr', '2nd yr', '3rd yr', '4th yr'];

    // 1. Ensure Departments Exist
    for (const dName of depts) {
      const existing = await Department.findOne({ name: dName });
      if (!existing) {
        await Department.create({ name: dName, description: `${dName} Department` });
        console.log(`✅ Created Department: ${dName}`);
      }
    }

    // 2. Create HoDs
    for (const dept of depts) {
      for (const year of years) {
        const yearDigit = year.charAt(0); // '1', '2', etc.
        const empId = `${dept.toLowerCase()}_hod_${yearDigit}`;
        
        const existing = await User.findOne({ employeeId: empId });
        if (existing) {
          console.log(`⚠️  HoD ${empId} already exists, skipping...`);
          continue;
        }

        const newUser = new User({
          employeeId: empId,
          password: 'password123', // Default password
          role: 'HoD',
          firstName: dept,
          lastName: `HoD ${year}`,
          department: dept,
          teachingYear: year,
          email: `${empId}@kmit.in`,
          mobile: '9999999999',
          gender: 'Male',
          designation: 'HoD',
          address: 'KMIT',
          aadhaar: '123412341234',
          pan: 'ABCDE1234F',
          dob: new Date('1980-01-01'),
          doj: new Date('2010-01-01'),
          leaveBalance: { cl: 12, ccl: 0, al: 0, lop: 0 }
        });

        await newUser.save();
        console.log(`✅ Created HoD: ${empId} (${year})`);
      }
    }

    console.log('🚀 Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding HoDs:', err);
    process.exit(1);
  }
}

seedHods();
