const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms';

async function resetAndSeed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Remove all employees except Admin and HoDs
    const preservedIds = [
      '1', // Admin
      'cse_hod_1', 'cse_hod_2', 'cse_hod_3', 'cse_hod_4',
      'csm_hod_1', 'csm_hod_2', 'csm_hod_3', 'csm_hod_4'
    ];

    const deleteResult = await User.deleteMany({ 
      employeeId: { $nin: preservedIds },
      role: { $ne: 'Admin' } // Extra safety
    });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} old employees.`);

    // 2. Seed 48 Employees
    const depts = ['CSE', 'CSM'];
    const years = ['1st yr', '2nd yr', '3rd yr', '4th yr'];
    let count = 0;

    for (const dept of depts) {
      for (const year of years) {
        const yearDigit = year.charAt(0);
        for (let i = 1; i <= 6; i++) {
          const empId = `${dept.toLowerCase()}_${yearDigit}_${i}`;
          
          const newUser = new User({
            employeeId: empId,
            password: '678', // Default password as requested
            role: 'Employee',
            firstName: `${dept} ${yearDigitsToWords(yearDigit)}`,
            lastName: `Teacher ${i}`,
            department: dept,
            teachingYear: year,
            email: `${empId}@kmit.in`,
            mobile: `9${Math.floor(Math.random() * 900000000 + 100000000)}`,
            gender: i % 2 === 0 ? 'Female' : 'Male',
            designation: 'Assistant Professor',
            address: 'Hyderabad',
            aadhaar: `12345678901${i}`,
            pan: `ABCDE123${i}F`,
            dob: new Date('1990-01-01'),
            doj: new Date('2022-01-01'),
            leaveBalance: { cl: 6, ccl: 0, al: 5, lop: 0 }
          });

          await newUser.save();
          count++;
        }
      }
    }

    console.log(`✅ Seeded ${count} new employees.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during reset and seed:', err);
    process.exit(1);
  }
}

function yearDigitsToWords(digit) {
  const map = { '1': 'First', '2': 'Second', '3': 'Third', '4': 'Fourth' };
  return map[digit] || digit;
}

resetAndSeed();
