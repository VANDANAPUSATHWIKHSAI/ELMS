const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms').then(async () => {
    const professors = [
        { id: '868', f: 'Arjun', l: 'Reddy', d: 'CSE' },
        { id: '869', f: 'Sneha', l: 'Latha', d: 'ECE' },
        { id: '870', f: 'Vikram', l: 'Sai', d: 'IT' },
        { id: '871', f: 'Priya', l: 'Darshini', d: 'CSE' },
        { id: '872', f: 'Kiran', l: 'Kumar', d: 'ME' }
    ];

    for (const p of professors) {
        const password = p.id; // Basic password for now
        const newUser = new User({
            employeeId: p.id,
            password: password,
            role: 'Employee',
            firstName: p.f,
            lastName: p.l,
            email: `${p.f.toLowerCase()}.${p.id}@kmit.in`,
            department: p.d,
            designation: 'Assistant Professor',
            mobile: '9876543' + p.id,
            gender: 'Male',
            address: 'Hyderabad',
            teachingYear: '1st Year',
            aadhaar: '123456789' + p.id,
            pan: 'ABCDE' + p.id + 'F',
            dob: new Date('1990-01-01'),
            doj: new Date('2024-06-01'),
            leaveBalance: { cl: 12, ccl: 0, al: 5, lop: 0 }
        });
        
        const existing = await User.findOne({ employeeId: p.id });
        if (!existing) {
            await newUser.save();
            console.log(`Added: ${p.f} ${p.l} (${p.id})`);
        } else {
            console.log(`Skipped: ${p.id} already exists`);
        }
    }
    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
