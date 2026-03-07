const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms';

async function reseedEmployees() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Remove all current employees (Role: Employee)
    const delRes = await User.deleteMany({ role: 'Employee' });
    console.log(`🗑️ Deleted ${delRes.deletedCount} old employees.`);

    const depts = ['CSE', 'CSM'];
    const years = ['1st yr', '2nd yr', '3rd yr', '4th yr'];
    const employeesPerYear = 6;
    let nextId = 801;
    const employees = [];

    for (const dept of depts) {
      for (const year of years) {
        for (let i = 1; i <= employeesPerYear; i++) {
          employees.push({
            employeeId: nextId.toString(),
            password: '678',
            firstName: `${dept} ${year.split(' ')[0]}`,
            lastName: `Teacher ${i}`,
            email: `${dept.toLowerCase()}_${year[0]}_${i}_8${nextId}@test.com`, // Unique email
            role: 'Employee',
            department: dept,
            teachingYear: year,
            leaveBalance: { cl: 12, ccl: 0, al: 0, lop: 0 }
          });
          nextId++;
        }
      }
    }

    // 2. Bulk insert
    await User.insertMany(employees);
    console.log(`🚀 Successfully seeded 48 employees (IDs 801-${nextId - 1}) with password 678.`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error re-seeding employees:', err);
    process.exit(1);
  }
}

reseedEmployees();
