// backend/seeds/full_reset_seed.js
// Full database reset: removes all HODs and Employees (preserves Admin ID:1 and Principal ID:501)
// Creates 8 HODs (91-98) and 100 faculty employees with full Indian demographic data.

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kmit_elms';

// ─── HOD DATA ───────────────────────────────────────────────────────────────
const HODS = [
  { employeeId: '91', firstName: 'Balakrishna', lastName: 'Rao',     department: 'H&S', gender: 'Male',   dob: '1970-05-10', doj: '2007-06-01' },
  { employeeId: '92', firstName: 'Saritha',     lastName: 'Devi',    department: 'H&S', gender: 'Female', dob: '1972-08-15', doj: '2008-07-01' },
  { employeeId: '93', firstName: 'Rupa',        lastName: 'Devi',    department: 'CSE', gender: 'Female', dob: '1975-03-22', doj: '2007-07-01' },
  { employeeId: '94', firstName: 'Sri',         lastName: 'Devi',    department: 'CSM', gender: 'Female', dob: '1971-11-30', doj: '2009-06-01' },
  { employeeId: '95', firstName: 'Priyanka',    lastName: 'Saxena',  department: 'CSE', gender: 'Female', dob: '1978-01-17', doj: '2010-07-01' },
  { employeeId: '96', firstName: 'Narendar',    lastName: 'Kumar',   department: 'IT',  gender: 'Male',   dob: '1973-07-04', doj: '2007-07-01' },
  { employeeId: '97', firstName: 'K',           lastName: 'Anil',    department: 'CSD', gender: 'Male',   dob: '1976-09-19', doj: '2011-06-01' },
  { employeeId: '98', firstName: 'Upendar',     lastName: 'Naidu',   department: 'CSE', gender: 'Male',   dob: '1974-04-25', doj: '2008-07-01' },
];

// ─── FACULTY GROUPS ──────────────────────────────────────────────────────────
const FACULTY_GROUPS = [
  { idStart: 101, idEnd: 110, dept: 'H&S', year: '1st yr', hodId: '91' },
  { idStart: 111, idEnd: 120, dept: 'H&S', year: '1st yr', hodId: '92' },
  { idStart: 201, idEnd: 210, dept: 'CSE', year: '2nd yr', hodId: '93' },
  { idStart: 211, idEnd: 220, dept: 'CSM', year: '2nd yr', hodId: '94' },
  { idStart: 301, idEnd: 310, dept: 'CSE', year: '3rd yr', hodId: '95' },
  { idStart: 311, idEnd: 320, dept: 'CSM', year: '3rd yr', hodId: '94' },
  { idStart: 321, idEnd: 325, dept: 'IT',  year: '3rd yr', hodId: '96' },
  { idStart: 326, idEnd: 330, dept: 'CSD', year: '3rd yr', hodId: '97' },
  { idStart: 401, idEnd: 410, dept: 'CSE', year: '4th yr', hodId: '98' },
  { idStart: 411, idEnd: 420, dept: 'CSM', year: '4th yr', hodId: '94' },
  { idStart: 421, idEnd: 425, dept: 'IT',  year: '4th yr', hodId: '96' },
  { idStart: 426, idEnd: 430, dept: 'CSD', year: '4th yr', hodId: '97' },
];

// ─── DESIGNATIONS (cycled for employees) ─────────────────────────────────────
const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor'];

// ─── INDIAN NAMES ────────────────────────────────────────────────────────────
const MALE_FIRST = [
  'Arun', 'Suresh', 'Ramesh', 'Mahesh', 'Dinesh', 'Rajesh', 'Ganesh', 'Naresh', 'Venkat', 'Krishna',
  'Ravi', 'Siva', 'Mohan', 'Rakesh', 'Praveen', 'Kiran', 'Srikanth', 'Harish', 'Girish', 'Satish',
  'Anil', 'Sunil', 'Kapil', 'Vijay', 'Sanjay', 'Ajay', 'Naveen', 'Pavan', 'Tarun', 'Varun',
  'Chandu', 'Venu', 'Raghu', 'Srinivas', 'Subhash', 'Aditya', 'Chaitanya', 'Prasad', 'Babu', 'Balaji',
  'Vinod', 'Akhil', 'Nikhil', 'Rohit', 'Arjun', 'Vikram', 'Deepak', 'Ashok', 'Manoj', 'Santosh',
];
const FEMALE_FIRST = [
  'Priya', 'Deepa', 'Kavya', 'Swathi', 'Lakshmi', 'Anitha', 'Sowmya', 'Padma', 'Radha', 'Sunitha',
  'Nisha', 'Suma', 'Rekha', 'Jyothi', 'Madhavi', 'Hema', 'Revathi', 'Bharathi', 'Usha', 'Kamala',
  'Pooja', 'Sneha', 'Divya', 'Meghana', 'Sravani', 'Anusha', 'Manasa', 'Tejaswi', 'Bhavana', 'Nandini',
  'Sarita', 'Geetha', 'Vimala', 'Indira', 'Savitha', 'Ramya', 'Pavani', 'Yamini', 'Sirisha', 'Mounika',
  'Lalitha', 'Sujatha', 'Vijaya', 'Nirmala', 'Chandana', 'Aparna', 'Shalini', 'Varsha', 'Archana', 'Sujana',
];
const LAST_NAMES = [
  'Reddy', 'Rao', 'Sharma', 'Gupta', 'Kumar', 'Singh', 'Naidu', 'Raju', 'Babu', 'Prasad',
  'Devi', 'Varma', 'Chandra', 'Nair', 'Murthy', 'Goud', 'Yadav', 'Patel', 'Shah', 'Pillai',
  'Verma', 'Mishra', 'Joshi', 'Sinha', 'Iyer', 'Menon', 'Bhat', 'Das', 'Patil', 'Jain',
];

const ADDRESSES = [
  'Flat 201, Sri Sai Apartments, Dilsukhnagar, Hyderabad',
  'H.No. 12-5-67, LB Nagar, Hyderabad',
  'Plot 45, Srinagar Colony, Kukatpally, Hyderabad',
  'Flat 302, Vasavi Residency, Uppal, Hyderabad',
  '8-2-293, Banjara Hills Road No. 14, Hyderabad',
  'Flat 101, Green Valley Apartments, Kondapur, Hyderabad',
  'D.No. 4-11-154, Ramanthapur, Hyderabad',
  '6-3-249/2, Narayanaguda, Hyderabad',
  'Plot 22, Sri Ram Nagar, ECIL, Hyderabad',
  'H.No. 7-1-29, Ameerpet, Hyderabad',
  'Flat 504, Prestige Towers, Gachibowli, Hyderabad',
  'D.No. 15, Sri Krishna Nagar, Malkajgiri, Hyderabad',
  '22-B, Teachers Colony, Himayatnagar, Hyderabad',
  'H.No. 5-9-81, Basheerbagh, Hyderabad',
  'Flat 403, Orchid Heights, Miyapur, Hyderabad',
  'Plot 7, Ashok Nagar, Saidabad, Hyderabad',
  'D.No. 3-5-474, Narayanguda, Hyderabad',
  '10-3-78, Mehdipatnam, Hyderabad',
  'Flat 204, Rainbow Residency, Madhapur, Hyderabad',
  'H.No. 8-7-120, Tolichowki, Hyderabad',
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomMobile() {
  const starts = ['6', '7', '8', '9'];
  return starts[Math.floor(Math.random() * starts.length)] + 
    String(Math.floor(Math.random() * 900000000 + 100000000));
}

function randomAadhaar() {
  return String(Math.floor(Math.random() * 900000000000 + 100000000000));
}

function randomPAN() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  let pan = '';
  for (let i = 0; i < 5; i++) pan += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 4; i++) pan += digits[Math.floor(Math.random() * digits.length)];
  pan += letters[Math.floor(Math.random() * letters.length)];
  return pan;
}

// DOB: Between 1966 and 2002 (all faculty aged 24–60 as of 2026)
function randomDOB() {
  const startYear = 1966;
  const endYear = 2002; // at least 24 years old in 2026
  const year = startYear + Math.floor(Math.random() * (endYear - startYear + 1));
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`);
}

// DOJ: Between 2007 and 2025 (college started 2007, DOJ after dob + 21 years minimum)
function randomDOJ(dob) {
  const minYear = Math.max(2007, dob.getFullYear() + 21);
  const maxYear = 2025;
  if (minYear > maxYear) return new Date('2022-07-01');
  const year = minYear + Math.floor(Math.random() * (maxYear - minYear + 1));
  const month = [1, 6, 7][Math.floor(Math.random() * 3)]; // Jan, Jun, Jul typical joining months
  return new Date(`${year}-${String(month).padStart(2,'0')}-01`);
}

// ─── MAIN SEED ────────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Delete ALL HODs and Employees (preserve Admin=1 and Principal=501)
    const delResult = await User.deleteMany({ role: { $in: ['HoD', 'Employee'] } });
    console.log(`🗑️  Deleted ${delResult.deletedCount} HODs and Employees.`);

    // Also ensure no extra Principals exist
    await User.deleteMany({ employeeId: { $in: ["502", "503", "504"] }, role: 'Principal' });
    console.log('🗑️  Removed extra Principal accounts (502, 503, 504) if they existed.');

    // 2. Create HODs
    for (const hod of HODS) {
      const u = new User({
        employeeId: hod.employeeId,
        password: '678',
        role: 'HoD',
        firstName: hod.firstName,
        lastName: hod.lastName,
        email: `${hod.firstName.toLowerCase()}.${hod.lastName.toLowerCase()}@kmit.in`,
        mobile: randomMobile(),
        gender: hod.gender,
        department: hod.department,
        designation: 'Head of Department',
        address: getRandom(ADDRESSES),
        aadhaar: randomAadhaar(),
        pan: randomPAN(),
        dob: new Date(hod.dob),
        doj: new Date(hod.doj),
        leaveBalance: { cl: 6, ccl: 0, al: 5, lop: 0 }
      });
      await u.save();
      console.log(`👔 HOD: ${hod.firstName} ${hod.lastName} (${hod.employeeId}) – ${hod.department}`);
    }

    // 3. Create Faculty Employees
    let totalCreated = 0;
    let desigIndex = 0;
    let maleIdx = 0, femaleIdx = 0, lastIdx = 0;

    for (const group of FACULTY_GROUPS) {
      for (let id = group.idStart; id <= group.idEnd; id++) {
        const gender = totalCreated % 2 === 0 ? 'Male' : 'Female';
        const firstName = gender === 'Male'
          ? MALE_FIRST[maleIdx++ % MALE_FIRST.length]
          : FEMALE_FIRST[femaleIdx++ % FEMALE_FIRST.length];
        const lastName = LAST_NAMES[lastIdx++ % LAST_NAMES.length];
        const designation = DESIGNATIONS[desigIndex++ % DESIGNATIONS.length];
        const dob = randomDOB();
        const doj = randomDOJ(dob);
        const empId = String(id);
        const emailName = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${empId}`;

        const u = new User({
          employeeId: empId,
          password: '678',
          role: 'Employee',
          firstName,
          lastName,
          email: `${emailName}@kmit.in`,
          mobile: randomMobile(),
          gender,
          department: group.dept,
          teachingYear: group.year,
          hodId: group.hodId,
          designation,
          address: getRandom(ADDRESSES),
          aadhaar: randomAadhaar(),
          pan: randomPAN(),
          dob,
          doj,
          leaveBalance: { cl: 6, ccl: 0, al: 5, lop: 0 }
        });

        await u.save();
        totalCreated++;
      }
      console.log(`✅ Group ${group.dept} ${group.year} (${group.idStart}–${group.idEnd}): HOD=${group.hodId}`);
    }

    console.log(`\n🎉 Done! Created ${HODS.length} HODs + ${totalCreated} Faculty Employees.`);
    console.log(`📊 Designation Distribution: ~${Math.round(totalCreated/3)} per type (Professor / Associate / Assistant)`);
    console.log('📌 Admin (ID:1) and Principal (ID:501) preserved.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
