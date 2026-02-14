// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'Principal', 'HoD', 'Employee'], 
    default: 'Employee' 
  },
  
  // Personal Details
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  mobile: String,
  gender: String,
  dob: Date,
  doj: Date,
  address: String,
  
  // Professional Details
  department: String,
  designation: String,
  
  // Identity Proofs
  aadhaar: String,
  pan: String,
  jntuUid: String,
  aicteId: String,

  // Leave Balance
  leaveBalance: {
    cl: { type: Number, default: 12 },
    ccl: { type: Number, default: 0 },
    al: { type: Number, default: 0 },
    lop: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model('User', UserSchema);