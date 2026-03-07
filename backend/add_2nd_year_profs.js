const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
    const professors = [
        { id: '873', f: 'Rahul', l: 'Sharma', d: 'CSE', y: '2nd Year' },
        { id: '874', f: 'Ananya', l: 'Pandey', d: 'CSE', y: '2nd Year' },
        { id: '875', f: 'Suresh', l: 'Raina', d: 'IT', y: '2nd Year' },
        { id: '876', f: 'Meera', l: 'Bhai', d: 'IT', y: '2nd Year' }
    ];

    for (const p of professors) {
        const password = p.id;
        const newUser = new User({
            employeeId: p.id,
            password: password,
            role: 'Employee',
            firstName: p.f,
            lastName: p.l,
            email: `${p.f.toLowerCase()}.${p.id}@kmit.in`,
            department: p.d,
            designation: 'Assistant Professor',
            mobile: '9988776' + p.id,
            gender: 'Female',
            address: 'Hyderabad',
            teachingYear: p.y,
            aadhaar: '987654321' + p.id,
            pan: 'PQR' + p.id + 'Z',
            dob: new Date('1992-05-15'),
            doj: new Date('2024-07-01'),
            leaveBalance: { cl: 12, ccl: 0, al: 0, lop: 0 }
        });
        
        const existing = await User.findOne({ employeeId: p.id });
        if (!existing) {
            await newUser.save();
            console.log(`Added: ${p.f} ${p.l} (${p.id}) - ${p.d} ${p.y}`);
        } else {
            // Update year if already exists
            existing.teachingYear = p.y;
            existing.department = p.d;
            await existing.save();
            console.log(`Updated: ${p.id} to ${p.d} ${p.y}`);
        }
    }
    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
