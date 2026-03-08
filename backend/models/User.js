// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  teachingYear: String,
  
  // Professional Details
  department: String,
  designation: String,
  isPhdRegistered: { type: Boolean, default: false },
  
  // Identity Proofs
  aadhaar: String,
  pan: String,
  jntuUid: String,
  aicteId: String,

  // Leave Balance
  leaveBalance: {
    type: Object,
    default: { cl: 6, ccl: 0, al: 0, lop: 0 }
  },
  profileImg: String,
  resetPasswordOTP: String,
  resetPasswordOTPExpiry: Date,
  resetPasswordToken: String
});

// Hash password before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);