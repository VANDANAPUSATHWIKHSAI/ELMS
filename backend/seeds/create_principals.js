const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms';

async function seedPrincipals() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const years = ['1st yr', '2nd yr', '3rd yr', '4th yr'];

    for (let i = 0; i < years.length; i++) {
      const year = years[i];
      const yearDigit = year.charAt(0);
      const empId = (501 + i).toString(); // 501, 502, 503, 504
      
      const existing = await User.findOne({ employeeId: empId });
      if (existing) {
        console.log(`⚠️  Principal ${empId} already exists, skipping...`);
        continue;
      }

      const newUser = new User({
        employeeId: empId,
        password: '678',
        role: 'Principal',
        firstName: `BL`,
        lastName: `Malleswari`,
        department: 'Administration',
        teachingYear: year,
        email: `principal${yearDigit}@kmit.in`,
        mobile: `988888880${yearDigit}`,
        gender: 'Male',
        designation: 'Principal',
        address: 'KMIT Campus',
        aadhaar: `88888888888${yearDigit}`,
        pan: `PRIN${yearDigit}123Z`,
        dob: new Date('1975-01-01'),
        doj: new Date('2015-01-01'),
        leaveBalance: { cl: 15, ccl: 0, al: 0, lop: 0 }
      });

      await newUser.save();
      console.log(`✅ Created Principal: ${empId} (${year})`);
    }

    console.log('🚀 Principal Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding Principals:', err);
    process.exit(1);
  }
}

seedPrincipals();
