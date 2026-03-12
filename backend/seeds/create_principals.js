const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms';

async function seedPrincipals() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const empId = "501";
    
    const existing = await User.findOne({ employeeId: empId });
    if (existing) {
      existing.password = '678';
      await existing.save();
      console.log(`✅ Principal ${empId} password ensured as 678`);
    } else {
      const newUser = new User({
        employeeId: empId,
        password: '678',
        role: 'Principal',
        firstName: `BL`,
        lastName: `Malleswari`,
        department: 'Administration',
        teachingYear: 'All',
        email: `principal@kmit.in`,
        mobile: `9888888800`,
        gender: 'Female',
        designation: 'Principal',
        address: 'KMIT Campus',
        aadhaar: `888888888888`,
        pan: `PRIN00123Z`,
        dob: new Date('1975-01-01'),
        doj: new Date('2015-01-01'),
        leaveBalance: { cl: 15, ccl: 0, al: 0, lop: 0 }
      });

      await newUser.save();
      console.log(`✅ Created Principal: ${empId}`);
    }

    // Clean up others if they exist
    await User.deleteMany({ employeeId: { $in: ["502", "503", "504"] }, role: "Principal" });
    console.log('🗑️  Removed extra Principal accounts (502, 503, 504) if they existed');

    console.log('🚀 Principal Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding Principals:', err);
    process.exit(1);
  }
}

seedPrincipals();
