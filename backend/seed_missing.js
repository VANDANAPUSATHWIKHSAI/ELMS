const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');
const LeaveType = require('./models/LeaveType');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
  console.log('Connected to DB');
  
  // 1. Seed Departments based on unique users + identifying HoDs
  const users = await User.find();
  const depMap = {};

  for (const u of users) {
    if (u.department && u.department !== 'Administration' && u.department !== 'IT Support') {
      if (!depMap[u.department]) depMap[u.department] = { name: u.department, hodEmployeeId: null, description: `${u.department} Department` };
      if (u.role === 'HoD') {
        depMap[u.department].hodEmployeeId = u.employeeId;
      }
    }
  }

  await Department.deleteMany({});
  await Department.insertMany(Object.values(depMap));
  console.log(`Seeded ${Object.values(depMap).length} departments`);

  // 2. Seed default Leave Types
  await LeaveType.deleteMany({});
  await LeaveType.insertMany([
    { code: 'CL', name: 'Casual Leave', defaultDays: 12 },
    { code: 'CCL', name: 'Compensatory/Child Care Leave', defaultDays: 10 },
    { code: 'AL', name: 'Academic Leave', defaultDays: 10 },
    { code: 'LOP', name: 'Loss of Pay', defaultDays: 0 }
  ]);
  console.log('Seeded 4 default leave types');

  mongoose.connection.close();
}).catch(console.error);
