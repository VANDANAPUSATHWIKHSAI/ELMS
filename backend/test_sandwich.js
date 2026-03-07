const mongoose = require('mongoose');
const User = require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');
const Holiday = require('./models/Holiday');
const http = require('http');

const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms';

function requestPath(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;

    const req = http.request(options, res => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(responseBody) }));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTest() {
  try {
    await mongoose.connect(MONGO_URI);
    
    // Clear old data for 801
    await LeaveRequest.deleteMany({ employeeId: '801' });
    let user = await User.findOne({ employeeId: '801' });
    user.leaveBalance = { cl: 20, ccl: 0, al: 0, lop: 0 };
    await user.save();

    const y = 2026;
    const m = 3; // April (0-indexed 3)

    // Make 26th and 27th holidays (e.g. 26 is custom, 27 is Sunday)
    await Holiday.deleteMany({ name: 'Test Holiday' });
    await Holiday.create({ name: 'Test Holiday', startDate: new Date(y, m, 26), endDate: new Date(y, m, 26), type: 'Public Holiday' });

    // Login
    const loginRes = await requestPath('/api/auth/login', 'POST', { employeeId: '801', password: '678' });
    console.log("LOGIN RESPONSE:", loginRes.body);
    const token = loginRes.body.token;

    console.log("--- SCENARIO 1 ---");
    // Half day 25th
    const r1 = await requestPath('/api/leave/apply', 'POST', {
        employeeId: '801', leaveType: 'CL', startDate: `${y}-04-25`, endDate: `${y}-04-25`, isHalfDay: true, reason: 'test'
    }, token);
    console.log("25th Half Day:", r1.body);

    // Full day 28th
    const r2 = await requestPath('/api/leave/apply', 'POST', {
        employeeId: '801', leaveType: 'CL', startDate: `${y}-04-28`, endDate: `${y}-04-28`, isHalfDay: false, reason: 'test'
    }, token);
    console.log("28th Full Day:", r2.body.message);

    let l1 = await LeaveRequest.findOne({ startDate: `${y}-04-25` });
    let l2 = await LeaveRequest.findOne({ startDate: `${y}-04-28` });
    console.log("SD1 deduction:", l1.days, "SD2 deduction:", l2.days);
    console.log("Total deduced for Scenario 1:", l1.days + l2.days); // Should be 1.5

    console.log("--- SCENARIO 2 ---");
    await LeaveRequest.deleteMany({ employeeId: '801' });
    user.leaveBalance.cl = 20; await user.save();

    // Half day 24th
    const r3 = await requestPath('/api/leave/apply', 'POST', {
        employeeId: '801', leaveType: 'CL', startDate: `${y}-04-24`, endDate: `${y}-04-24`, isHalfDay: true, reason: 'test'
    }, token);
    console.log("24th Half Day:", r3.body.message);
    const r4 = await requestPath('/api/leave/apply', 'POST', {
        employeeId: '801', leaveType: 'CL', startDate: `${y}-04-25`, endDate: `${y}-04-25`, isHalfDay: false, reason: 'test'
    }, token);
    console.log("25th Full Day:", r4.body.message);
    const r5 = await requestPath('/api/leave/apply', 'POST', {
        employeeId: '801', leaveType: 'CL', startDate: `${y}-04-28`, endDate: `${y}-04-28`, isHalfDay: false, reason: 'test'
    }, token);
    console.log("28th Full Day:", r5.body.message);

    let leavesS2 = await LeaveRequest.find({ employeeId: '801' });
    console.log("Leaves for S2:");
    leavesS2.forEach(l => {
        const deduced = Object.values(l.deductionBreakdown || {}).reduce((s, x) => s + x, 0);
        console.log(`  ${l.startDate} to ${l.endDate} (Half: ${l.isHalfDay}) -> Deduced: ${deduced}`);
    });
    
    let totalS2 = leavesS2.reduce((acc, l) => acc + Object.values(l.deductionBreakdown || {}).reduce((s, x) => s + x, 0), 0);
    console.log("Total deduced for Scenario 2:", totalS2);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

runTest();
