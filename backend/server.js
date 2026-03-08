// backend/server.js
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const User = require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');
const LeaveLedger = require('./models/LeaveLedger');
const Message = require('./models/Message');
const LateMark = require('./models/LateMark');
const LeaveType = require('./models/LeaveType');
const Holiday = require('./models/Holiday');
const jwt = require('jsonwebtoken');
const { authMiddleware, roleMiddleware } = require('./middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 5000;

// --- Helper: Email & Mobile Validation ---
const validateEmailFormat = (email) => {
  if (!email || typeof email !== 'string') return "Email is required";
  const parts = email.split('@');
  if (parts.length !== 2) return "Email must contain exactly one @";
  
  const [localPart, domain] = parts;
  if (!localPart) return "Email must have characters before @";
  if (!domain) return "Email must have a domain after @";
  if (email.includes(" ")) return "Email cannot contain spaces";

  if (!/^[a-zA-Z0-9._%+-]+$/.test(localPart)) return "Invalid characters in email local part";
  if (!domain.includes(".")) return "Domain must contain at least one dot (.)";
  if (domain.startsWith(".") || domain.endsWith(".")) return "Domain cannot start or end with a dot (.)";
  if (!/^[a-zA-Z0-9.-]+$/.test(domain)) return "Invalid characters in email domain";
  
  return null; // OK
};

const validateMobileFormat = (mobile) => {
  if (!mobile) return "Mobile number is required";
  if (!/^\d{10}$/.test(mobile)) return "Mobile number must contain exactly 10 digits and only numbers";
  return null; // OK
};

const validateAadhaarFormat = (aadhaar) => {
  if (!aadhaar) return "Aadhaar number is required";
  if (!/^\d{12}$/.test(aadhaar)) return "Aadhaar number must contain exactly 12 digits and only numbers";
  return null; // OK
};

const validatePanFormat = (pan) => {
  if (!pan) return "PAN number is required";
  if (!/^[a-zA-Z0-9]{10}$/.test(pan)) return "PAN number must contain exactly 10 alphanumeric characters";
  return null; // OK
};
  
const getHolidayType = (date, allHolidays) => {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  const day = d.getDay();
  const h = allHolidays.find(h => {
    const hStart = new Date(h.startDate);
    const hEnd = new Date(h.endDate);
    hStart.setHours(0,0,0,0);
    hEnd.setHours(0,0,0,0);
    return d >= hStart && d <= hEnd;
  });
  if (h) return h.type;
  if (day === 0) return 'Sunday';
  return null;
};

const isDeductibleHoliday = (date, allHolidays) => {
  const type = getHolidayType(date, allHolidays);
  return (type === 'Sunday' || (type && type !== 'Summer Holidays'));
};

// --- Nodemailer Transporter ---
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email (Nodemailer) Verification Error:", error.message);
  } else {
    console.log("✅ Email (Nodemailer) Ready to send!");
  }
});



// Ensure uploads dir exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// --- Middleware ---
app.use(cors()); // Allow Frontend to talk to Backend
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Database Connection ---
const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- API ROUTES ---

// 1. LOGIN ROUTE
app.post('/api/auth/login', async (req, res) => {
  const { employeeId, password } = req.body;
  console.log(`Login attempt: ID/Email=${employeeId}`);
  try {
    const user = await User.findOne({
      $or: [{ employeeId: employeeId }, { email: employeeId }]
    });
    if (!user) {
      console.log(`User not found: ${employeeId}`);
      return res.status(404).json({ message: "User not found" });
    }
    
    // Use bcrypt to compare password
    const isMatch = await user.comparePassword(password);
    console.log(`Password match result: ${isMatch}`);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { 
        employeeId: user.employeeId, 
        role: user.role, 
        department: user.department,
        teachingYear: user.teachingYear,
        firstName: user.firstName,
        lastName: user.lastName
      },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '1d' }
    );

    res.json({
      message: "Login Successful",
      token,
      user: {
        employeeId: user.employeeId,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        }
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 1b. FORGOT PASSWORD ROUTE (OTP GENERATION)
app.post('/api/auth/forgot-password', async (req, res) => {
  const { emailOrId } = req.body;
  try {
    const user = await User.findOne({ 
      $or: [{ email: emailOrId }, { employeeId: emailOrId }] 
    });

    if (!user) {
      return res.status(404).json({ message: "No user found with this Employee ID or Email" });
    }

    if (!user.email) {
      return res.status(400).json({ message: "User does not have an email associated. Contact Admin." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    // Send Email
    const mailOptions = {
      from: `"KMIT ELMS Admin" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'KMIT ELMS - Password Reset OTP',
      text: `Hello ${user.firstName},\n\nYour OTP for password reset is: ${otp}.\n\nThis OTP will expire in 10 minutes.\n\nRegards,\nKMIT ELMS Team`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("--- NODEMAILER ERROR ---");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Response:", error.response);
        console.error("-----------------------");
        
        // Don't show OTP on screen as per user request
        return res.status(500).json({ 
          message: `Failed to send OTP to your email. Please check your credentials or contact admin.`, 
          error: error.message
        });
      }
      res.json({ message: `OTP sent to ${user.email}`, employeeId: user.employeeId });
    });

  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 1c. VERIFY OTP ROUTE
app.post('/api/auth/verify-otp', async (req, res) => {
  const { employeeId, otp } = req.body;
  try {
    const user = await User.findOne({ employeeId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.resetPasswordOTP !== otp || user.resetPasswordOTPExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Generate a temporary reset token
    const resetToken = jwt.sign({ employeeId: user.employeeId }, 'temp_reset_secret', { expiresIn: '15m' });
    user.resetPasswordToken = resetToken;
    await user.save();

    res.json({ message: "OTP Verified", token: resetToken });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 1d. RESET PASSWORD ROUTE
app.post('/api/auth/reset-password', async (req, res) => {
  const { employeeId, token, newPassword } = req.body;
  try {
    const user = await User.findOne({ employeeId, resetPasswordToken: token });
    if (!user) return res.status(400).json({ message: "Invalid reset token or request expired" });

    // Update password
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;
    user.resetPasswordToken = undefined;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 2. GET PROFILE ROUTE
app.get('/api/user/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ employeeId: req.params.id });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2b. UPDATE PROFILE ROUTE
app.put('/api/user/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    // Only allow user to update their own profile unless Admin
    if (req.user.employeeId !== id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: "Unauthorized to update this profile" });
    }

    const updateData = {};
    const allowedFields = ['address', 'designation', 'email', 'mobile', 'profileImg', 'firstName', 'lastName', 'gender', 'dob', 'emergencyContact'];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { employeeId: id },
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

// 2b. CHANGE PASSWORD
app.post('/api/users/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findOne({ employeeId: req.user.employeeId });
    
    // OR use the schema's method if it exists: user.comparePassword(currentPassword)
    
    // Safety check: ensure user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Use bcrypt to securely compare the plaintext currentPassword to the hashed user.password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid current password" });
    }
    
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});


// 4. APPLY LEAVE ROUTE
// --- SANDWICH UN-BRIDGE HELPER ---
async function unbridgeAdjacentHolidays(employeeId, rejectedLeaveStartDate, rejectedLeaveEndDate, rejectedLeaveId) {
    try {
        const allHolidays = await Holiday.find({});

        const getBaseDays = (l) => {
            if (l.isHalfDay) return 0.5;
            let base = 0;
            let curr = new Date(l.startDate);
            const end = new Date(l.endDate);
            while (curr <= end) {
                if (getHolidayType(curr, allHolidays) !== 'Summer Holidays') base += 1;
                curr.setDate(curr.getDate() + 1);
            }
            return base;
        };

        const activeLeaves = await LeaveRequest.find({
            employeeId,
            status: { $in: ['Approved', 'Pending', 'Auto-Approved'] },
            _id: { $ne: rejectedLeaveId }
        });

        if (!activeLeaves.length) return;

        const user = await User.findOne({ employeeId });
        if (!user) return;
        
        const ledgerEntries = [];
        let balanceModified = false;

        const refundDays = (leave, daysToRefund) => {
            if (daysToRefund <= 0) return 0;
            if (!leave.deductionBreakdown) return 0;
            
            const breakdown = leave.deductionBreakdown;
            const getVal = (key) => typeof breakdown.get === 'function' ? breakdown.get(key) : breakdown[key];
            const setVal = (key, val) => typeof breakdown.set === 'function' ? breakdown.set(key, val) : breakdown[key] = val;
            const entries = typeof breakdown.entries === 'function' ? Array.from(breakdown.entries()) : Object.entries(breakdown);
            
            let remainingToRefund = daysToRefund;
            
            for (const [type, amount] of entries) {
                if (remainingToRefund <= 0) break;
                if (amount > 0) {
                    const toRefund = Math.min(remainingToRefund, amount);
                    const key = type.toLowerCase();
                    if (key === 'lop') {
                        user.leaveBalance.lop = (user.leaveBalance.lop || 0) - toRefund;
                        ledgerEntries.push({
                            employeeId, transactionType: 'Credit', leaveType: 'LOP', amount: -toRefund,
                            reason: `Sandwich Broken Refund (Reverted LOP) for related Leave #${leave._id}`,
                            referenceId: leave._id, balanceAfter: user.leaveBalance.lop
                        });
                    } else {
                        user.leaveBalance[key] = (user.leaveBalance[key] || 0) + toRefund;
                        ledgerEntries.push({
                            employeeId, transactionType: 'Credit', leaveType: type.toUpperCase(), amount: toRefund,
                            reason: `Sandwich Broken Refund for related Leave #${leave._id}`,
                            referenceId: leave._id, balanceAfter: user.leaveBalance[key]
                        });
                    }
                    setVal(type, amount - toRefund);
                    remainingToRefund -= toRefund;
                }
            }
            return daysToRefund - remainingToRefund;
        };

        const processAdjacentLeave = async (adjLeave, bridgeDays) => {
            const baseDays = getBaseDays(adjLeave);
            let deductedDays = 0;
            if (adjLeave.deductionBreakdown) {
                const entries = typeof adjLeave.deductionBreakdown.entries === 'function' ? Array.from(adjLeave.deductionBreakdown.entries()) : Object.entries(adjLeave.deductionBreakdown);
                for (const [k, v] of entries) deductedDays += v;
            } else if (adjLeave.days) {
                deductedDays = adjLeave.days; 
            }
            
            const extraDays = Math.max(0, deductedDays - baseDays);
            const daysToRefund = Math.min(bridgeDays, extraDays);
            
            if (daysToRefund > 0) {
                console.log(`[UN-BRIDGE] Rejecting leave broke sandwich. Refunding ${daysToRefund} days to Leave ${adjLeave._id}`);
                const refunded = refundDays(adjLeave, daysToRefund);
                if (refunded > 0) {
                    balanceModified = true;
                    adjLeave.markModified('deductionBreakdown');
                    if (adjLeave.days) adjLeave.days -= refunded;
                    await adjLeave.save();
                }
            }
        };

        const sDate = new Date(rejectedLeaveStartDate);
        const eDate = new Date(rejectedLeaveEndDate);

        // 1. Scan Backwards
        let backwardScan = new Date(sDate);
        backwardScan.setDate(backwardScan.getDate() - 1);
        let backwardBridge = 0;
        let safetyCounter = 0;
        
        while (isDeductibleHoliday(backwardScan, allHolidays) && safetyCounter < 10) {
            backwardBridge++;
            backwardScan.setDate(backwardScan.getDate() - 1);
            safetyCounter++;
        }
        
        if (backwardBridge > 0) {
            const prevEndDateStr = `${backwardScan.getFullYear()}-${String(backwardScan.getMonth() + 1).padStart(2, '0')}-${String(backwardScan.getDate()).padStart(2, '0')}`;
            const prevLeave = activeLeaves.find(l => {
                const d = new Date(l.endDate);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === prevEndDateStr;
            });
            if (prevLeave && !prevLeave.isHalfDay) await processAdjacentLeave(prevLeave, backwardBridge);
        }

        // 2. Scan Forwards
        let forwardScan = new Date(eDate);
        forwardScan.setDate(forwardScan.getDate() + 1);
        let forwardBridge = 0;
        safetyCounter = 0;
        
        while (isDeductibleHoliday(forwardScan, allHolidays) && safetyCounter < 10) {
            forwardBridge++;
            forwardScan.setDate(forwardScan.getDate() + 1);
            safetyCounter++;
        }
        
        if (forwardBridge > 0) {
            const nextStartDateStr = `${forwardScan.getFullYear()}-${String(forwardScan.getMonth() + 1).padStart(2, '0')}-${String(forwardScan.getDate()).padStart(2, '0')}`;
            const nextLeave = activeLeaves.find(l => {
                const d = new Date(l.startDate);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === nextStartDateStr;
            });
            if (nextLeave && !nextLeave.isHalfDay) await processAdjacentLeave(nextLeave, forwardBridge);
        }
        
        if (balanceModified) {
            user.markModified('leaveBalance');
            await user.save();
            if (ledgerEntries.length > 0) await LeaveLedger.insertMany(ledgerEntries);
        }
    } catch (err) {
        console.error("Error in unbridgeAdjacentHolidays:", err);
    }
}
// --- END SANDWICH UN-BRIDGE HELPER ---

// --- LEAVE RECALCULATION ENGINE ---
// Retroactively upgrades future LOP/CL leaves to CCL/CL if an older leave is rejected/cancelled
async function recalculateFutureLeaves(employeeId, rejectedLeaveDate, rejectedLeaveId) {
    try {
        const thresholdDate = new Date(rejectedLeaveDate);
        thresholdDate.setHours(0,0,0,0);

        // Find all active leaves applied or starting after this date that might need an upgrade
        const futureLeaves = await LeaveRequest.find({
            employeeId,
            _id: { $ne: rejectedLeaveId },
            status: { $in: ['Approved', 'Auto-Approved', 'Pending'] },
            $or: [
                { appliedOn: { $gte: thresholdDate } },
                { startDate: { $gte: thresholdDate } }
            ]
        }).sort({ appliedOn: 1 }); // Process chronologically

        if (!futureLeaves.length) return;

        const user = await User.findOne({ employeeId });
        if (!user) return;

        let balanceModified = false;
        const ledgerEntries = [];

        for (const leave of futureLeaves) {
            if (!leave.deductionBreakdown) continue;
            
            const breakdown = leave.deductionBreakdown;
            const getVal = (key) => {
                let v = typeof breakdown.get === 'function' ? breakdown.get(key) : breakdown[key];
                return v || 0;
            };
            const setVal = (key, val) => typeof breakdown.set === 'function' ? breakdown.set(key, val) : breakdown[key] = val;
            
            let lopDeducted = getVal('lop');
            let clDeducted = getVal('cl');
            
            let leaveModified = false;

            // 1. Try to upgrade LOP/CL to CCL
            const cclAvailable = user.leaveBalance.ccl || 0;
            if (cclAvailable > 0 && (lopDeducted > 0 || clDeducted > 0)) {
                let toUpgrade = Math.min(cclAvailable, lopDeducted + clDeducted);
                
                // Prioritize upgrading LOP to CCL first
                if (lopDeducted > 0) {
                    const upgradeLopToCcl = Math.min(toUpgrade, lopDeducted);
                    setVal('lop', lopDeducted - upgradeLopToCcl);
                    setVal('ccl', getVal('ccl') + upgradeLopToCcl);
                    
                    user.leaveBalance.lop -= upgradeLopToCcl;
                    user.leaveBalance.ccl -= upgradeLopToCcl;
                    toUpgrade -= upgradeLopToCcl;
                    lopDeducted -= upgradeLopToCcl;
                    
                    ledgerEntries.push({
                        employeeId, transactionType: 'Debit', leaveType: 'CCL', amount: -upgradeLopToCcl,
                        reason: `Balance Re-evaluation (Upgraded from LOP) #${leave._id}`, referenceId: leave._id, balanceAfter: user.leaveBalance.ccl
                    });
                    ledgerEntries.push({
                        employeeId, transactionType: 'Credit', leaveType: 'LOP', amount: -upgradeLopToCcl,
                        reason: `Balance Re-evaluation (Reverted LOP) #${leave._id}`, referenceId: leave._id, balanceAfter: user.leaveBalance.lop
                    });
                    leaveModified = true;
                }
                
                // Then upgrade CL to CCL
                if (toUpgrade > 0 && clDeducted > 0) {
                    const upgradeClToCcl = Math.min(toUpgrade, clDeducted);
                    setVal('cl', clDeducted - upgradeClToCcl);
                    setVal('ccl', getVal('ccl') + upgradeClToCcl);
                    
                    user.leaveBalance.cl += upgradeClToCcl; // Refund CL
                    user.leaveBalance.ccl -= upgradeClToCcl; // Deduct CCL
                    clDeducted -= upgradeClToCcl;
                    
                    ledgerEntries.push({
                        employeeId, transactionType: 'Credit', leaveType: 'CL', amount: upgradeClToCcl,
                        reason: `Balance Re-evaluation (Reverted CL) #${leave._id}`, referenceId: leave._id, balanceAfter: user.leaveBalance.cl
                    });
                    leaveModified = true;
                }
            }

            // 2. Try to upgrade LOP to CL
            const clAvailable = user.leaveBalance.cl || 0;
            if (clAvailable > 0 && lopDeducted > 0) {
                const upgradeLopToCl = Math.min(clAvailable, lopDeducted);
                setVal('lop', lopDeducted - upgradeLopToCl);
                setVal('cl', getVal('cl') + upgradeLopToCl);
                
                user.leaveBalance.lop -= upgradeLopToCl;
                user.leaveBalance.cl -= upgradeLopToCl;
                lopDeducted -= upgradeLopToCl;
                
                ledgerEntries.push({
                    employeeId, transactionType: 'Debit', leaveType: 'CL', amount: -upgradeLopToCl,
                    reason: `Balance Re-evaluation (Upgraded from LOP) #${leave._id}`, referenceId: leave._id, balanceAfter: user.leaveBalance.cl
                });
                ledgerEntries.push({
                    employeeId, transactionType: 'Credit', leaveType: 'LOP', amount: -upgradeLopToCl,
                    reason: `Balance Re-evaluation (Reverted LOP) #${leave._id}`, referenceId: leave._id, balanceAfter: user.leaveBalance.lop
                });
                leaveModified = true;
            }

            if (leaveModified) {
                balanceModified = true;
                
                // Update the visual leaveType string if it was mixed
                if (['Standard', 'CL'].includes(leave.leaveType.split('+')[0].trim()) || leave.leaveType.includes('LOP')) {
                    const parts = [];
                    if (getVal('al') > 0) parts.push('AL');
                    if (getVal('ccl') > 0) parts.push('CCL');
                    if (getVal('cl') > 0) parts.push('CL');
                    if (getVal('lop') > 0) parts.push('LOP');
                    leave.leaveType = parts.length > 0 ? parts.join(' + ') : leave.leaveType;
                }
                
                leave.markModified('deductionBreakdown');
                await leave.save();
                console.log(`[RECALC] Retoactively upgraded Leave #${leave._id} to utilize newly freed balances.`);
            }
        }

        if (balanceModified) {
            user.markModified('leaveBalance');
            await user.save();
            if (ledgerEntries.length > 0) await LeaveLedger.insertMany(ledgerEntries);
        }
    } catch (err) {
        console.error("Error in recalculateFutureLeaves:", err);
    }
}

// --- DYNAMIC SANDWICH BRIDGE HELPER ---
async function applySandwichBridges(leaveId) {
    try {
        const leave = await LeaveRequest.findById(leaveId);
        if (!leave || (leave.status !== 'Approved' && leave.status !== 'Auto-Approved')) return;
        if (leave.isHalfDay) return;

        const employeeId = leave.employeeId;
        const allHolidays = await Holiday.find({});

        const user = await User.findOne({ employeeId });
        if (!user) return;

        let totalBridgeDeducted = 0;
        const ledgerEntries = [];
        const breakdown = leave.deductionBreakdown || {};
        
        const getBreakdownVal = (key) => {
            if (typeof breakdown.get === 'function') return breakdown.get(key) || 0;
            return breakdown[key] || 0;
        };
        const setBreakdownVal = (key, val) => {
            if (typeof breakdown.set === 'function') breakdown.set(key, val);
            else breakdown[key] = val;
        };

        // 1. Scan Backwards
        let backwardScan = new Date(leave.startDate);
        backwardScan.setDate(backwardScan.getDate() - 1);
        let backwardBridge = 0;
        let safety = 0;
        while (isDeductibleHoliday(backwardScan, allHolidays) && safety < 10) {
            backwardBridge++;
            backwardScan.setDate(backwardScan.getDate() - 1);
            safety++;
        }
        if (backwardBridge > 0) {
            const prevEndDateStr = `${backwardScan.getFullYear()}-${String(backwardScan.getMonth() + 1).padStart(2, '0')}-${String(backwardScan.getDate()).padStart(2, '0')}`;
            const prevApproved = await LeaveRequest.findOne({
                employeeId,
                status: { $in: ['Approved', 'Auto-Approved'] },
                endDate: prevEndDateStr,
                isHalfDay: false
            });
            if (prevApproved) totalBridgeDeducted += backwardBridge;
        }

        // 2. Scan Forwards
        let forwardScan = new Date(leave.endDate);
        forwardScan.setDate(forwardScan.getDate() + 1);
        let forwardBridge = 0;
        safety = 0;
        while (isDeductibleHoliday(forwardScan, allHolidays) && safety < 10) {
            forwardBridge++;
            forwardScan.setDate(forwardScan.getDate() + 1);
            safety++;
        }
        if (forwardBridge > 0) {
            const nextStartDateStr = `${forwardScan.getFullYear()}-${String(forwardScan.getMonth() + 1).padStart(2, '0')}-${String(forwardScan.getDate()).padStart(2, '0')}`;
            const nextApproved = await LeaveRequest.findOne({
                employeeId,
                status: { $in: ['Approved', 'Auto-Approved'] },
                startDate: nextStartDateStr,
                isHalfDay: false
            });
            if (nextApproved) totalBridgeDeducted += forwardBridge;
        }

        if (totalBridgeDeducted > 0) {
            let remaining = totalBridgeDeducted;
            if (remaining > 0 && user.leaveBalance.cl > 0) {
               const use = Math.min(remaining, user.leaveBalance.cl);
               user.leaveBalance.cl -= use;
               setBreakdownVal('cl', getBreakdownVal('cl') + use);
               remaining -= use;
               ledgerEntries.push({
                   employeeId, transactionType: 'Debit', leaveType: 'CL', amount: -use,
                   reason: `Sandwich Rule (Intervening Holidays) for Leave #${leave._id}`, referenceId: leave._id, balanceAfter: user.leaveBalance.cl
               });
            }
            if (remaining > 0) {
                user.leaveBalance.lop = (user.leaveBalance.lop || 0) + remaining;
                setBreakdownVal('lop', getBreakdownVal('lop') + remaining);
                ledgerEntries.push({
                    employeeId, transactionType: 'Debit', leaveType: 'LOP', amount: -remaining,
                    reason: `Sandwich Rule (LOP) for Leave #${leave._id}`, referenceId: leave._id, balanceAfter: user.leaveBalance.lop
                });
                remaining = 0;
            }
            
            leave.deductionBreakdown = breakdown;
            leave.markModified('deductionBreakdown');
            await leave.save();
            
            user.markModified('leaveBalance');
            await user.save();
            if (ledgerEntries.length > 0) await LeaveLedger.insertMany(ledgerEntries);
            console.log(`[SANDWICH] Applied ${totalBridgeDeducted} bridge days for Leave #${leave._id}`);
        }
    } catch (err) {
        console.error("Error in applySandwichBridges:", err);
    }
}
// --- END DYNAMIC SANDWICH BRIDGE HELPER ---
// --- END LEAVE RECALCULATION ENGINE ---


// --- DYNAMIC DEDUCTION ENGINE ---
async function processLeaveDeduction(user, requestedDays, leaveType, documentUrl, bridgeNote, leaveId, isSimulation = false) {
    let remainingDays = requestedDays;
    let breakdown = { ccl: 0, cl: 0, al: 0, lop: 0 };
    const ledgerEntries = [];
    const employeeId = user.employeeId;

    if (!user.leaveBalance) user.leaveBalance = { cl: 0, ccl: 0, al: 0, lop: 0 };
    if (user.leaveBalance.cl === undefined) user.leaveBalance.cl = 0;
    if (user.leaveBalance.ccl === undefined) user.leaveBalance.ccl = 0;
    if (user.leaveBalance.al === undefined) user.leaveBalance.al = 0;
    if (user.leaveBalance.lop === undefined) user.leaveBalance.lop = 0;

    const balance = isSimulation ? JSON.parse(JSON.stringify(user.leaveBalance)) : user.leaveBalance;

    if (leaveType === 'OD') {
      remainingDays = 0; 
    } 
    else if (leaveType === 'AL') {
      const isAsstProf = user.designation && user.designation.toLowerCase().includes('assistant professor');
      if (!user.isPhdRegistered && !isAsstProf) {
        throw new Error("Academic Leave (AL) is only available for PhD-registered faculty or Assistant Professors.");
      }
      if (!documentUrl && !isSimulation) {
        throw new Error("Supporting document is mandatory for Academic Leave (AL).");
      }

      const currentYear = new Date().getFullYear();
      const LeaveLedger = require('./models/LeaveLedger');
      const ledgerEntriesYear = await LeaveLedger.find({
        employeeId, leaveType: 'AL', transactionType: 'Debit',
        date: { $gte: new Date(currentYear, 0, 1), $lte: new Date(currentYear, 11, 31) }
      });
      const alUsed = ledgerEntriesYear.reduce((sum, e) => sum + Math.abs(e.amount), 0);
      const alAvailable = Math.max(0, 5 - alUsed);
      
      const alToDeduct = Math.min(remainingDays, alAvailable);
      if (alToDeduct > 0) {
        breakdown.al = alToDeduct;
        balance.al -= alToDeduct; 
        remainingDays -= alToDeduct;
      }

      // Fallback 1: CCL
      if (remainingDays > 0 && balance.ccl > 0) {
        const cclToDeduct = Math.min(remainingDays, balance.ccl);
        balance.ccl -= cclToDeduct;
        breakdown.ccl = (breakdown.ccl || 0) + cclToDeduct;
        remainingDays -= cclToDeduct;
      }

      // Fallback 2: CL
      if (remainingDays > 0 && balance.cl > 0) {
        const clToDeduct = Math.min(remainingDays, balance.cl);
        balance.cl -= clToDeduct;
        breakdown.cl = (breakdown.cl || 0) + clToDeduct;
        remainingDays -= clToDeduct;
      }
    } 
    else if (leaveType === 'CL' || leaveType === 'Standard') {
      if (remainingDays > 0 && balance.ccl > 0) {
        const cclToDeduct = Math.min(remainingDays, balance.ccl);
        balance.ccl -= cclToDeduct;
        breakdown.ccl = cclToDeduct;
        remainingDays -= cclToDeduct;
      }
      if (remainingDays > 0 && balance.cl > 0) {
        const clToDeduct = Math.min(remainingDays, balance.cl);
        balance.cl -= clToDeduct;
        breakdown.cl = clToDeduct;
        remainingDays -= clToDeduct;
      }
      if (balance.ccl < 0) balance.ccl = 0;
      if (balance.cl < 0) balance.cl = 0;
    }
    else if (leaveType !== 'OD') {
      const balanceField = leaveType.toLowerCase();
      const currentBalance = balance[balanceField] || 0;
      if (remainingDays > currentBalance) throw new Error(`Insufficient balance for ${leaveType}. Available: ${currentBalance}, Requested: ${remainingDays}`);
      const requestedAmt = remainingDays;
      balance[balanceField] -= requestedAmt;
      breakdown[balanceField] = requestedAmt;
      remainingDays = 0; 
    }
    
    if (remainingDays > 0) {
      balance.lop += remainingDays;
      breakdown.lop = remainingDays;
      remainingDays = 0;
    }

    let finalLeaveType = leaveType;
    if (leaveType === 'Standard' || leaveType === 'AL') {
      const parts = [];
      if (breakdown.al > 0) parts.push('AL');
      if (breakdown.ccl > 0) parts.push('CCL');
      if (breakdown.cl > 0) parts.push('CL');
      if (breakdown.lop > 0) parts.push('LOP');
      if (parts.length > 0) finalLeaveType = parts.join(' + ');
      else if (leaveType === 'Standard') finalLeaveType = 'Leave';
    }

    if (!isSimulation && leaveId) {
        for (const [type, amount] of Object.entries(breakdown)) {
          if (amount <= 0 || type === '$init') continue;
          const key = type.toLowerCase();
          const displayType = type.toUpperCase();
          const signedAmt = key === 'lop' ? amount : -amount;
          ledgerEntries.push({
            employeeId, transactionType: 'Debit', leaveType: displayType, amount: signedAmt,
            reason: `Leave Application Approved #${leaveId}${bridgeNote ? ' ' + bridgeNote : ''}`, 
            referenceId: leaveId, balanceAfter: balance[key]
          });
        }
    }
    return { breakdown, finalLeaveType, balance, ledgerEntries };
}

async function recalculatePendingLeaves(employeeId) {
    const User = require('./models/User');
    const LeaveRequest = require('./models/LeaveRequest');
    const user = await User.findOne({ employeeId });
    if (!user) return;
    
    const pendingLeaves = await LeaveRequest.find({ employeeId, status: 'Pending' }).sort({ appliedOn: 1 });
    let simulatedUser = { employeeId, leaveBalance: JSON.parse(JSON.stringify(user.leaveBalance)), designation: user.designation, isPhdRegistered: user.isPhdRegistered };
    
    for (const leave of pendingLeaves) {
        let daysRequired = leave.totalDeductionDays || 0;
        if (daysRequired === 0 && leave.deductionBreakdown && leave.deductionBreakdown.size > 0) {
             const entries = leave.deductionBreakdown instanceof Map ? leave.deductionBreakdown.entries() : Object.entries(leave.deductionBreakdown);
             for (const [key, val] of entries) {
                 if (key !== '$init') daysRequired += val;
             }
        }
        
        let baseType = (leave.originalLeaveType || leave.leaveType).split('+')[0].trim();
        if (baseType === 'CCL' || baseType === 'Leave') baseType = 'Standard';

        if (daysRequired > 0 || (baseType === 'OD' && leave.isHalfDay)) {
             try {
                const { breakdown, finalLeaveType, balance } = await processLeaveDeduction(simulatedUser, daysRequired, baseType, leave.documentUrl, '', null, true);
                leave.deductionBreakdown = breakdown;
                leave.leaveType = finalLeaveType;
                leave.originalLeaveType = baseType;
                leave.totalDeductionDays = daysRequired;
                await leave.save();
                simulatedUser.leaveBalance = balance;
             } catch (e) {
                console.error("Cascade Error:", e.message);
             }
        }
    }
}
// --- END DYNAMIC ENGINE ---


app.post('/api/leave/apply', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    let { employeeId, leaveType, startDate, endDate, reason, adjustments, isHalfDay, halfDayType } = req.body;
    
    // FormData sends everything as strings, so parse adjustments and boolean
    if (typeof adjustments === 'string') {
      try { adjustments = JSON.parse(adjustments); } catch (e) { adjustments = []; }
    } else {
      adjustments = adjustments || [];
    }
    const halfDayBool = isHalfDay === 'true' || isHalfDay === true;
    const finalHalfDayType = halfDayBool ? (halfDayType || 'FN') : null;
    
    // File upload URL
    const documentUrl = req.file ? `uploads/${req.file.filename}` : null;

    // --- NEW VALIDATION LOGIC ---
    console.log("-----------------------------------------");
    console.log("LEAVE APPLICATION INCOMING REQUEST");
    console.log("BODY:", JSON.stringify(req.body, null, 2));
    console.log("FILE:", req.file ? req.file.originalname : "No File");
    console.log("-----------------------------------------");

    // Validate Substitute Employee IDs
    if (adjustments && adjustments.length > 0) {
      const subIds = adjustments.map(adj => adj.adjustedWith);
      const uniqueSubIds = [...new Set(subIds)];
      
      const foundUsers = await User.find({ employeeId: { $in: uniqueSubIds } }).select('employeeId');
      const foundIds = foundUsers.map(u => u.employeeId);
      
      const missingIds = uniqueSubIds.filter(id => !foundIds.includes(id));
      
      if (missingIds.length > 0) {
        return res.status(400).json({ 
          message: `Invalid Substitute Employee ID(s): ${missingIds.join(', ')}. Please verify that they exist.`
        });
      }
    }

    if (!startDate || !endDate) return res.status(400).json({ message: "Start and End dates are required." });
    
    if (halfDayBool && startDate !== endDate) {
      return res.status(400).json({ message: "Half-day leaves must occur on a single date." });
    }

    const [sYear, sMonth, sDay] = startDate.split('-');
    const startLocalDate = new Date(sYear, sMonth - 1, sDay);
    const [eYear, eMonth, eDay] = endDate.split('-');
    const endLocalDate = new Date(eYear, eMonth - 1, eDay);

    const now = new Date();
    const todayLocalDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (startLocalDate < todayLocalDate) return res.status(400).json({ message: "Cannot apply leave for a past date." });
    if (endLocalDate < startLocalDate) return res.status(400).json({ message: "End date cannot be earlier than start date." });
    
    if (startLocalDate.getTime() === todayLocalDate.getTime() && now.getHours() >= 16) {
      return res.status(400).json({ message: "College timings have completed for today. Please apply from tomorrow." });
    }

    // --- Holiday & Sunday Blocking Logic ---
    const allHolidays = await Holiday.find({});
    
    const getHolidayInfo = (date) => {
        const d = new Date(date);
        d.setHours(0,0,0,0);
        const day = d.getDay(); // 0 is Sunday
        
        const h = allHolidays.find(h => {
             const hStart = new Date(h.startDate);
             const hEnd = new Date(h.endDate);
             hStart.setHours(0,0,0,0);
             hEnd.setHours(0,0,0,0);
             return d >= hStart && d <= hEnd;
        });
        
        if (h) return { type: h.type, name: h.name };
        if (day === 0) return { type: 'Sunday', name: 'Sunday' };
        return null;
    };

    const startHoliday = getHolidayInfo(startLocalDate);
    if (startHoliday) {
        return res.status(400).json({ message: `Cannot apply leave starting on a holiday/Sunday: ${startHoliday.name}` });
    }

    const endHoliday = getHolidayInfo(endLocalDate);
    if (endHoliday) {
        return res.status(400).json({ message: `Cannot apply leave ending on a holiday/Sunday: ${endHoliday.name}` });
    }

    // --- Overlap Validation ---
    const overlappingLeave = await LeaveRequest.findOne({
      employeeId,
      status: { $in: ['Pending', 'Approved', 'Auto-Approved'] },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    });

    if (overlappingLeave) {
      return res.status(400).json({ 
        message: `You have already applied for leave during this period (${overlappingLeave.startDate} to ${overlappingLeave.endDate}).` 
      });
    }
    // --- END VALIDATION LOGIC ---

    // Helper to check if a date is a holiday or Sunday (for deduction logic)
    const getHolidayType = (date) => {
        const info = getHolidayInfo(date);
        return info ? info.type : null;
    };

    const isDeductibleHoliday = (date) => {
        const type = getHolidayType(date);
        if (type === 'Sunday') return true;
        if (type && type !== 'Summer Holidays') return true;
        return false;
    };

    const isSummerHoliday = (date) => getHolidayType(date) === 'Summer Holidays';

    // 2. Start/End holiday logic: Allow it, but it counts as leave (unless Summer Holiday)
    // Removed restriction per user request to allow leaves starting on holidays to be deducted.

    // 3. Calculate days (Inclusive of intervening deductible holidays)
    let totalDeductionDays = 0;
    let backwardBridge = 0;
    let forwardBridge = 0;

    if (halfDayBool) {
      totalDeductionDays = 0.5;
    } else {
      let currentCursor = new Date(startLocalDate);
      while (currentCursor <= endLocalDate) {
        if (!isSummerHoliday(currentCursor)) {
          totalDeductionDays += 1;
        }
        currentCursor.setDate(currentCursor.getDate() + 1);
      }

            // 4. Bridge Rule (Detect adjacent approved leaves separated only by holidays)
      const isAnyHoliday = (date) => getHolidayInfo(date) !== null;

      // Scan backwards from startDate
      let backwardScan = new Date(startLocalDate);
      backwardScan.setDate(backwardScan.getDate() - 1);
      
      let backwardDeductibleDays = 0;
      let safetyCounter = 0;
      
      // Keep spanning if it's ANY holiday (Summer, normal, Sunday)
      while (isAnyHoliday(backwardScan) && safetyCounter < 30) {
          if (isDeductibleHoliday(backwardScan)) {
              backwardDeductibleDays++;
          }
          backwardScan.setDate(backwardScan.getDate() - 1);
          safetyCounter++;
      }
      
      const prevEndDateStr = `${backwardScan.getFullYear()}-${String(backwardScan.getMonth() + 1).padStart(2, '0')}-${String(backwardScan.getDate()).padStart(2, '0')}`;
      const prevLeaveExists = await LeaveRequest.findOne({
          employeeId,
          status: { $in: ['Approved', 'Auto-Approved', 'Pending'] },
          endDate: prevEndDateStr
      });
      // Important: Sandwich only bridges if the bounding leave is a Full Day.
      if (prevLeaveExists && !prevLeaveExists.isHalfDay) {
          totalDeductionDays += backwardDeductibleDays;
      }

      // Scan forwards from endDate
      let forwardScan = new Date(endLocalDate);
      forwardScan.setDate(forwardScan.getDate() + 1);
      
      let forwardDeductibleDays = 0;
      safetyCounter = 0;
      
      while (isAnyHoliday(forwardScan) && safetyCounter < 30) {
          if (isDeductibleHoliday(forwardScan)) {
              forwardDeductibleDays++;
          }
          forwardScan.setDate(forwardScan.getDate() + 1);
          safetyCounter++;
      }
      
      const nextStartDateStr = `${forwardScan.getFullYear()}-${String(forwardScan.getMonth() + 1).padStart(2, '0')}-${String(forwardScan.getDate()).padStart(2, '0')}`;
      const nextLeaveExists = await LeaveRequest.findOne({
          employeeId,
          status: { $in: ['Approved', 'Auto-Approved', 'Pending'] },
          startDate: nextStartDateStr
      });
      if (nextLeaveExists && !nextLeaveExists.isHalfDay) {
          totalDeductionDays += forwardDeductibleDays;
      }
    }

    const days = totalDeductionDays;

    // 2. Check Balance
    const user = await User.findOne({ employeeId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.leaveBalance) user.leaveBalance = { cl: 0, ccl: 0, al: 0, lop: 0 };
    if (user.leaveBalance.cl === undefined) user.leaveBalance.cl = 0;
    if (user.leaveBalance.ccl === undefined) user.leaveBalance.ccl = 0;
    if (user.leaveBalance.al === undefined) user.leaveBalance.al = 0;
    if (user.leaveBalance.lop === undefined) user.leaveBalance.lop = 0;

    // --- PROJECTION DEDUCTION ---
    let finalLeaveType, breakdown;
    try {
        const sim = await processLeaveDeduction(user, days, leaveType, documentUrl, '', null, true);
        finalLeaveType = sim.finalLeaveType;
        breakdown = sim.breakdown;
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }

    // 4. Create Request (Pending)
    const newLeave = new LeaveRequest({
      employeeId, 
      leaveType: finalLeaveType, 
      originalLeaveType: leaveType, 
      totalDeductionDays: days,
      startDate, endDate, reason,
      isHalfDay: halfDayBool,
      halfDayType: finalHalfDayType,
      documentUrl, 
      deductionBreakdown: breakdown,
      adjustments: adjustments, 
      status: 'Pending', 
      hodApproval: { status: 'Pending' },
      principalApproval: { status: leaveType === 'OD' ? 'Pending' : 'N/A' }
    });
    await newLeave.save();

    res.json({ message: "Leave applied successfully!", leaveId: newLeave._id });
  } catch (err) {
    console.error("APPLY LEAVE ERROR:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 5c. GET MONTHLY LEDGER SUMMARY
app.get('/api/leave/monthly-ledger/:employeeId', authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const year = new Date().getFullYear();
    
    // Initialize months
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const ledgerData = monthNames.map(name => ({
      month: name,
      cl: 0, ccl: 0, od: 0, al: 0, 
      total: 0, lates: 0, availed: 0, remaining: 0, lop: 0
    }));

    // 2. Get Ledger Entries (Credits/Debits) - MOVED UP to fix ReferenceError for Assistant Professors
    const ledgerEntries = await LeaveLedger.find({ 
      employeeId, 
      date: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31) } 
    }).sort({ date: 1 }); // Sort by date for running totals

    // 1. Get User Profile for AL Policy
    const user = await User.findOne({ employeeId });
    const isAssistantProfessor = user && (user.designation === 'Assistant Professor' || user.designation?.toLowerCase().includes('phd'));
    
    // Inject Annual AL Allocation into January (Month 0) if eligible
    if (isAssistantProfessor) {
        // AL for Assistant Professors is typically 5, but we should reflect the actual limit based on profile + usage
        const totalUsed = ledgerEntries.filter(e => e.leaveType.toLowerCase() === 'al' && e.transactionType === 'Debit').reduce((sum, e) => sum + Math.abs(e.amount), 0);
        ledgerData[0].al = Math.max(5, (user?.leaveBalance?.al || 0) + totalUsed);
    }

    let runningCl = 0, runningCcl = 0, runningAl = isAssistantProfessor ? 5 : 0;

    ledgerEntries.forEach(entry => {
      const monthIdx = new Date(entry.date).getMonth();
      const type = entry.leaveType.toLowerCase();
      
      if (entry.transactionType === 'Credit' || entry.transactionType === 'CarryForward' || entry.transactionType === 'Reset') {
        if (type === 'cl') { ledgerData[monthIdx].cl += entry.amount; runningCl += entry.amount; }
        if (type === 'ccl') { ledgerData[monthIdx].ccl += entry.amount; runningCcl += entry.amount; }
        if (type === 'al' && !isAssistantProfessor) { 
           // Only add AL credits from ledger if NOT an assistant professor (who has a fixed limit)
           ledgerData[monthIdx].al += entry.amount; 
           runningAl += entry.amount; 
        }
      } else if (entry.transactionType === 'Debit') {
        const absAmount = Math.abs(entry.amount);
        ledgerData[monthIdx].availed += absAmount;
        if (type === 'lop') ledgerData[monthIdx].lop += absAmount;
        if (type === 'cl') runningCl -= absAmount;
        if (type === 'ccl') runningCcl -= absAmount;
        if (type === 'al') runningAl -= absAmount;
      }
    });

    // 3. Get Late Marks
    const lateMarks = await LateMark.find({
      employeeId,
      date: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31) }
    });
    lateMarks.forEach(mark => {
      const monthIdx = new Date(mark.date).getMonth();
      ledgerData[monthIdx].lates += 1;
    });

    // 3. Get OD Leaves (from LeaveRequest)
    const odLeaves = await LeaveRequest.find({
      employeeId,
      leaveType: 'OD',
      status: 'Approved',
      startDate: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31) }
    });
    odLeaves.forEach(req => {
      const monthIdx = new Date(req.startDate).getMonth();
      ledgerData[monthIdx].od += 1; 
    });

    // 4. Calculate Totals and properly carry forward remaining balances month by month
    let totalClCredits = 0;
    let totalCclCredits = 0;
    let totalAlCredits = 0;
    let totalAvailed = 0;

    ledgerData.forEach(m => {
      // Accumulate total credits up to this month
      totalClCredits += m.cl;
      totalCclCredits += m.ccl;
      totalAlCredits += m.al; 
      
      // Keep track of total availed thus far
      totalAvailed += m.availed;

      m.total = m.cl + m.ccl + m.al; // Total credits strictly for this month
      
      // Remaining is the running Total Credits minus Total Availed up to this month
      m.remaining = (totalClCredits + totalCclCredits + totalAlCredits) - totalAvailed;
    });

    res.json(ledgerData);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 5d. GET QUARTERLY LEDGER SUMMARY
app.get('/api/leave/quarterly-ledger/:employeeId', authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const year = new Date().getFullYear();
    
    // Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec
    const quarterlyData = [
      { name: "Q1 (Jan-Mar)", clAllocated: 4, clUsed: 0, cclUsed: 0 },
      { name: "Q2 (Apr-Jun)", clAllocated: 4, clUsed: 0, cclUsed: 0 },
      { name: "Q3 (Jul-Sep)", clAllocated: 4, clUsed: 0, cclUsed: 0 },
      { name: "Q4 (Oct-Dec)", clAllocated: 4, clUsed: 0, cclUsed: 0 }
    ];

    const ledgerEntries = await LeaveLedger.find({ 
      employeeId, 
      date: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31) } 
    });

    // Calculate Net Ledger Sums (includes usage, refunds, admin adjustments)
    const netClLedger = ledgerEntries.filter(e => e.leaveType.toLowerCase() === 'cl').reduce((sum, e) => sum + e.amount, 0);
    const netCclLedger = ledgerEntries.filter(e => e.leaveType.toLowerCase() === 'ccl').reduce((sum, e) => sum + e.amount, 0);
    const netAlLedger = ledgerEntries.filter(e => e.leaveType.toLowerCase() === 'al').reduce((sum, e) => sum + e.amount, 0);

    // Calculate Usage (Positive sum of debits minus refunds for the "USED" display)
    const getNetUsed = (type) => {
        const typeLedger = ledgerEntries.filter(e => e.leaveType.toLowerCase() === type.toLowerCase());
        
        // Match Debits and their specific Refunds via referenceId
        const debits = typeLedger.filter(e => e.transactionType === 'Debit');
        const totalDebitAmount = debits.reduce((sum, e) => sum + Math.abs(e.amount), 0);
        
        const debitRefIds = debits.map(d => d.referenceId ? d.referenceId.toString() : null).filter(Boolean);
        const refunds = typeLedger.filter(e => 
            e.transactionType === 'Credit' && 
            e.referenceId && 
            debitRefIds.includes(e.referenceId.toString())
        );
        const totalRefundAmount = refunds.reduce((sum, e) => sum + Math.abs(e.amount), 0);
        
        return Math.max(0, totalDebitAmount - totalRefundAmount);
    };

    // Calculate quarterly usage taking refunds into account by matching referenceId
    ledgerEntries.forEach(entry => {
      const monthIdx = new Date(entry.date).getMonth();
      const quarterIdx = Math.floor(monthIdx / 3);
      const type = entry.leaveType.toLowerCase();

      if (entry.transactionType === 'Debit') {
        const absAmount = Math.abs(entry.amount);
        if (type === 'cl') quarterlyData[quarterIdx].clUsed += absAmount;
        if (type === 'ccl') quarterlyData[quarterIdx].cclUsed += absAmount;
      } else if (entry.transactionType === 'Credit' && entry.reason.includes('Refund')) {
         // Subtract refunded amount from the quarter it was originally applied to (based on the refund entry's date for simplicity, though ideally it should match the original debit's date)
         const absAmount = Math.abs(entry.amount);
         if (type === 'cl') quarterlyData[quarterIdx].clUsed = Math.max(0, quarterlyData[quarterIdx].clUsed - absAmount);
         if (type === 'ccl') quarterlyData[quarterIdx].cclUsed = Math.max(0, quarterlyData[quarterIdx].cclUsed - absAmount);
      }
    });

    // Summary calculation for the main dashboard cards
    const user = await User.findOne({ employeeId });
    const currentMonth = new Date().getMonth();
    const currentQIdx = Math.floor(currentMonth / 3);

    // CL Policy: 15 per year total, Quarterly caps at Q1=4, Q2=8, Q3=12, Q4=15.
    let clAllocatedUntilNow = (currentQIdx + 1) * 4;
    if (clAllocatedUntilNow > 15) clAllocatedUntilNow = 15;

    // We now reliably derive total usage directly from Debits minus Refunds via getNetUsed
    const clUsedTotal = getNetUsed('cl');
    
    // As per user request, the Dashboard should explicitly show the absolute remaining balance 
    // rather than artificially capping it to the quarterly limit if they have run-over or custom imports.
    const clRemainingNow = user ? (user.leaveBalance.cl || 0) : 0;

    // AL limit: 5 for Assistant Professor per request
    const isAssistantProf = user?.designation?.toLowerCase().includes('assistant professor');
    const alRemainingNow = user ? (user.leaveBalance.al || 0) : 0;
    const alBaseAlloc = isAssistantProf ? Math.max(5, alRemainingNow + getNetUsed('al')) : (user?.leaveBalance?.al || 0);

    const summary = {
      clRemaining: clRemainingNow,
      clUsed: clUsedTotal,
      cclRemaining: user ? (user.leaveBalance.ccl || 0) : 0, 
      cclUsed: getNetUsed('ccl'),
      alRemaining: alRemainingNow,
      alLimit: alBaseAlloc,
      alUsed: getNetUsed('al'),
      currentQuarterIndex: currentQIdx,
      isAssistantProf
    };

    res.json({ quarters: quarterlyData, summary });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 5. GET LEAVE HISTORY
app.get('/api/leave/history/:employeeId', authMiddleware, async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ employeeId: req.params.employeeId })
      .sort({ appliedOn: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 5b. CANCEL LEAVE ROUTE
app.put('/api/leave/cancel/:id', authMiddleware, async (req, res) => {
  try {
    const leaveId = req.params.id;
    const leave = await LeaveRequest.findById(leaveId);
    
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    // Ensure only the owner (or admin) can cancel
    if (leave.employeeId !== req.user.employeeId && req.user.role !== 'Admin') {
      return res.status(403).json({ message: "Unauthorized to cancel this leave" });
    }

    if (leave.status === 'Cancelled' || leave.status === 'Rejected') {
       return res.status(400).json({ message: "Leave is already " + leave.status });
    }

    // Refund if it was Pending or Approved
    if (leave.status === 'Pending' || leave.status === 'Approved') {
       const user = await User.findOne({ employeeId: leave.employeeId });
       
        if (user) {
          const ledgerEntries = [];
          const breakdown = leave.deductionBreakdown;
          
          if (breakdown && breakdown.size > 0) {
            // New Map-based dynamic refund
            for (const [type, amount] of breakdown.entries()) {
              if (amount <= 0) continue;
              const key = type.toLowerCase();
              if (key === 'lop') {
                user.leaveBalance.lop = (user.leaveBalance.lop || 0) - amount;
                ledgerEntries.push({ 
                  employeeId: leave.employeeId, transactionType: 'Credit', leaveType: 'LOP', amount: -amount, 
                  reason: `Leave Cancelled (Reverted LOP) #${leaveId}`, referenceId: leaveId, balanceAfter: user.leaveBalance.lop 
                });
              } else {
                user.leaveBalance[key] = (user.leaveBalance[key] || 0) + amount;
                ledgerEntries.push({ 
                  employeeId: leave.employeeId, transactionType: 'Credit', leaveType: type.toUpperCase(), amount: amount, 
                  reason: `Leave Cancelled (Refund) #${leaveId}`, referenceId: leaveId, balanceAfter: user.leaveBalance[key] 
                });
              }
            }
          } else {
            // Legacy Fallback (No stored breakdown)
            const s = new Date(leave.startDate);
            const e = new Date(leave.endDate);
            let diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
            if (leave.isHalfDay) diff = 0.5;

            // Simple split for combined types or single type
            const types = leave.leaveType.split('+').map(t => t.trim().toLowerCase());
            for (const t of types) {
              const share = diff / types.length; 
              user.leaveBalance[t] = (user.leaveBalance[t] || 0) + share;
              ledgerEntries.push({ 
                employeeId: leave.employeeId, transactionType: 'Credit', leaveType: t.toUpperCase(), amount: share, 
                reason: `Leave Cancelled (Legacy Refund) #${leaveId}`, referenceId: leaveId, balanceAfter: user.leaveBalance[t] 
              });
            }
          }
          
          user.markModified('leaveBalance');
          await user.save();
          if (ledgerEntries.length > 0) await LeaveLedger.insertMany(ledgerEntries);
          
          await unbridgeAdjacentHolidays(leave.employeeId, leave.startDate, leave.endDate, leave._id);
          // Recalculate future leaves that might have been forced into LOP because this leave previously drained balances
          await recalculateFutureLeaves(leave.employeeId, leave.appliedOn, leave._id);
        }
    }

    leave.status = 'Cancelled';
    await leave.save();
    
    res.json({ message: "Leave cancelled successfully and balance refunded." });
  } catch (err) {
    console.error("CANCEL LEAVE ERROR:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 5c. GET MONTHLY LEDGER SUMMARY moved up
// --- NEW ROUTES ADDED BELOW ---

// 6. GET PENDING LEAVES FOR HoD (By Department)
app.get('/api/leave/pending/:department', authMiddleware, roleMiddleware(['HoD', 'Admin']), async (req, res) => {
  try {
    // Find users in department (Case Insensitive)
    const departmentRegex = new RegExp(`^${req.params.department}$`, 'i');
    const userQuery = { department: departmentRegex };
    
    // If requester is HoD, further filter by their assigned teachingYear
    if (req.user.role === 'HoD' && req.user.teachingYear) {
      userQuery.teachingYear = req.user.teachingYear;
    }

    const usersInDept = await User.find(userQuery).select('employeeId');
    const employeeIds = usersInDept.map(u => u.employeeId);

    // Find pending leaves
    const leaves = await LeaveRequest.find({
      employeeId: { $in: employeeIds },
      status: 'Pending'
    }).sort({ appliedOn: 1 });

    // Attach names
    const leavesWithNames = await Promise.all(leaves.map(async (leave) => {
      const user = await User.findOne({ employeeId: leave.employeeId });
      return {
        ...leave.toObject(),
        employeeName: user ? `${user.firstName} ${user.lastName}` : 'Unknown'
      };
    }));

    res.json(leavesWithNames);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 6b. GET LEAVE HISTORY FOR HoD (By Department with Filters)
app.get('/api/hod/leave-history/:department', authMiddleware, roleMiddleware(['HoD', 'Admin']), async (req, res) => {
  try {
    const { status, month, date } = req.query;
    
    // 1. Get Users in Department (Case Insensitive)
    const departmentRegex = new RegExp(`^${req.params.department}$`, 'i');
    const userQuery = { department: departmentRegex };

    // If requester is HoD, further filter by their assigned teachingYear
    if (req.user.role === 'HoD' && req.user.teachingYear) {
      userQuery.teachingYear = req.user.teachingYear;
    }

    const usersInDept = await User.find(userQuery).select('employeeId firstName lastName');
    const employeeIds = usersInDept.map(u => u.employeeId);

    // 2. Build Leave Query
    let query = { employeeId: { $in: employeeIds } };

    // Filter by Status (Approved, Pending, Rejected, etc.)
    if (status && status !== 'All') {
      if (status === 'Approved') {
        query.status = { $in: ['Approved', 'Auto-Approved', 'Accepted'] };
      } else {
        query.status = status;
      }
    }

    // Filter by Specific Date (Day-wise)
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);
      
      query.startDate = { $lte: endOfDay };
      query.endDate = { $gte: startOfDay };
    } 
    // Filter by Month (Monthly Report)
    else if (month) {
      const [year, m] = month.split('-');
      const startOfMonth = new Date(year, m - 1, 1);
      const endOfMonth = new Date(year, m, 0, 23, 59, 59);

      query.startDate = { $lte: endOfMonth };
      query.endDate = { $gte: startOfMonth };
    }

    // 3. Fetch Leaves
    const leaves = await LeaveRequest.find(query).sort({ appliedOn: -1 });

    // 4. Attach Employee Names
    const leavesWithNames = leaves.map(leave => {
      const user = usersInDept.find(u => u.employeeId === leave.employeeId);
      return {
        ...leave.toObject(),
        employeeName: user ? `${user.firstName} ${user.lastName}` : 'Unknown'
      };
    });

    res.json(leavesWithNames);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 7. APPROVE / REJECT ACTION
app.post('/api/leave/action', authMiddleware, roleMiddleware(['HoD', 'Principal', 'Admin']), async (req, res) => {
  try {
    const { leaveId, action, comment } = req.body;
    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    const oldStatus = leave.status;
    leave.status = action;
    const fName = req.user.firstName && req.user.firstName !== 'undefined' ? req.user.firstName : (req.user.role || 'User');
    const lName = req.user.lastName && req.user.lastName !== 'undefined' ? req.user.lastName : '';
    const actionByName = `${fName} ${lName} (${req.user.role || 'Staff'})`.replace(/\s+/g, ' ').trim();
    
    if (req.user.role === 'Principal') {
      // Logic for Multi-Principal (Year-Specific)
      leave.principalApproval = { status: action, comment, date: new Date(), actionBy: actionByName };
    } else {
      leave.hodApproval = { status: action, comment, date: new Date(), actionBy: actionByName };
      // Removed auto-approval of OD leaves by Principal to allow for Principal review
    }

    const wasPending = oldStatus === 'Pending';
    const wasRejected = oldStatus === 'Rejected';
    const wasApproved = oldStatus === 'Approved' || oldStatus === 'Auto-Approved';

    if (action === 'Approved' && (wasPending || wasRejected)) {
        const user = await User.findOne({ employeeId: leave.employeeId });
        if (user) {
            let baseType = (leave.originalLeaveType || leave.leaveType).split('+')[0].trim();
            if (baseType === 'CCL' || baseType === 'Leave') baseType = 'Standard';
            
            let reqDays = leave.totalDeductionDays || 0;
            if (reqDays === 0 && leave.deductionBreakdown && (leave.deductionBreakdown.size > 0 || Object.keys(leave.deductionBreakdown).length > 0)) {
                 const entries = leave.deductionBreakdown instanceof Map ? leave.deductionBreakdown.entries() : Object.entries(leave.deductionBreakdown);
                 for (const [k, v] of entries) {
                    if (k !== '$init') reqDays += v;
                 }
            }
            
            const LeaveLedger = require('./models/LeaveLedger');
            const { breakdown, finalLeaveType, balance, ledgerEntries } = await processLeaveDeduction(user, reqDays, baseType, leave.documentUrl, "", leaveId, false);
            
            user.leaveBalance = balance;
            user.markModified('leaveBalance');
            await user.save();
            
            leave.deductionBreakdown = breakdown;
            leave.leaveType = finalLeaveType;
            if (ledgerEntries.length > 0) await LeaveLedger.insertMany(ledgerEntries);
            
            await applySandwichBridges(leaveId);
        }
    }

    if (action === 'Rejected' && wasApproved) {
        const user = await User.findOne({ employeeId: leave.employeeId });
        if (user) {
          const LeaveLedger = require('./models/LeaveLedger');
          const ledgerEntries = [];
          const breakdown = leave.deductionBreakdown;

          if (breakdown && (breakdown.size > 0 || Object.keys(breakdown).length > 0)) {
            const entries = breakdown instanceof Map ? breakdown.entries() : Object.entries(breakdown);
            for (const [type, amount] of entries) {
              if (amount <= 0 || type === '$init') continue;
              const key = type.toLowerCase();
              if (key === 'lop') {
                user.leaveBalance.lop = (user.leaveBalance.lop || 0) - amount;
                ledgerEntries.push({ employeeId: leave.employeeId, transactionType: 'Credit', leaveType: 'LOP', amount: -amount, reason: `Leave Rejected (Reverted LOP) #${leaveId}`, referenceId: leaveId, balanceAfter: user.leaveBalance.lop });
              } else {
                user.leaveBalance[key] = (user.leaveBalance[key] || 0) + amount;
                ledgerEntries.push({ employeeId: leave.employeeId, transactionType: 'Credit', leaveType: type.toUpperCase(), amount: amount, reason: `Leave Rejected (Refund) #${leaveId}`, referenceId: leaveId, balanceAfter: user.leaveBalance[key] });
              }
            }
          }
          user.markModified('leaveBalance');
          await user.save();
          if (ledgerEntries.length > 0) await LeaveLedger.insertMany(ledgerEntries);
          await unbridgeAdjacentHolidays(leave.employeeId, leave.startDate, leave.endDate, leave._id);
        }
    }
    
    await leave.save();
    try { await recalculatePendingLeaves(leave.employeeId); } catch(e) { console.error(e); }
    await leave.save();
    res.json({ message: `Leave ${action} Successfully` });
  } catch (err) {
    res.status(500).json({ message: "Action failed", error: err.message });
  }
});

// 8. EMPLOYEE SEARCH API
app.get('/api/users/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    
    let queryFilter = { role: { $in: ['Employee', 'HoD'] } };
    
    if (query) {
      const searchRegex = new RegExp(query, 'i'); // Case-insensitive
      queryFilter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { employeeId: searchRegex },
        { department: searchRegex }
      ];
    }

    const users = await User.find(queryFilter).select('employeeId firstName lastName department designation email mobile profileImg');
    console.log(`Backend Search Results for "${query}":`, users.map(u => ({ id: u.employeeId, hasImg: !!u.profileImg })));
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
});

// --- PRINCIPAL ROUTES ---

// P1. GET GLOBAL STATS
app.get('/api/principal/stats', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
      const totalStaff = await User.countDocuments({ role: { $in: ['Employee', 'HoD'] } });
      const hods = await User.find({ role: 'HoD' }).select('employeeId');
      const hodIds = hods.map(h => h.employeeId);
      
      const pendingLeaves = await LeaveRequest.countDocuments({ status: 'Pending', employeeId: { $in: hodIds } });

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const leavesToday = await LeaveRequest.find({
        status: { $in: ['Approved', 'Auto-Approved'] },
        startDate: { $lte: endOfDay },
        endDate: { $gte: startOfDay }
      });

      // Filter out leaves where user doesn't exist
      let validOnLeaveCount = 0;
      for (const l of leavesToday) {
        const u = await User.findOne({ employeeId: l.employeeId });
        if (u) validOnLeaveCount++;
      }

      const onLeaveToday = validOnLeaveCount;

      // Calculate attendance percentage (Staff - OnLeaveToday) / Staff
      const attendancePercent = totalStaff > 0 ? Math.round(((totalStaff - onLeaveToday) / totalStaff) * 100) : 100;

      res.json({ totalStaff, pendingLeaves, onLeaveToday, attendancePercent });
  } catch (err) {
     res.status(500).json({ message: "Server Error" });
  }
});

// P2. GET TODAY LEAVES ACROSS ALL DEPTS
app.get('/api/principal/today-leaves', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const leaves = await LeaveRequest.find({
        status: { $in: ['Approved', 'Auto-Approved'] },
        startDate: { $lte: endOfDay },
        endDate: { $gte: startOfDay }
      });
      
      const enriched = (await Promise.all(leaves.map(async (leave) => {
        const user = await User.findOne({ employeeId: leave.employeeId });
        if (!user) return null;
        return {
          ...leave.toObject(),
          employeeName: `${user.firstName} ${user.lastName}`,
          department: user.department || user.dept
        };
      }))).filter(l => l !== null);
      
      res.json(enriched);
  } catch(err) { res.status(500).json({ message: "Server Error" }) }
});

// P3. GET GLOBAL PENDING FOR RATIFICATION
app.get('/api/principal/pending', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
      const hods = await User.find({ role: 'HoD' }).select('employeeId');
      const hodIds = hods.map(h => h.employeeId);
      
      const leaves = await LeaveRequest.find({ status: 'Pending', employeeId: { $in: hodIds } }).sort({ appliedOn: 1 });
      const userIds = leaves.map(l => l.employeeId);
     const users = await User.find({ employeeId: { $in: userIds } });
     
     const leavesWithNames = (await Promise.all(leaves.map(async (leave) => {
       const user = await User.findOne({ employeeId: leave.employeeId });
       if (!user) return null;
       return {
         ...leave.toObject(),
         employeeName: `${user.firstName} ${user.lastName}`,
         department: user.department || 'Unknown'
       };
     }))).filter(l => l !== null);
     res.json(leavesWithNames);
   } catch(err) { res.status(500).json({ message: "Server error" }) }
 });
 
 // P4. GET GLOBAL LEAVE HISTORY
 app.get('/api/principal/leave-history', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
   try {
      const leaves = await LeaveRequest.find().sort({ appliedOn: -1 }).limit(100);
      
      const leavesWithNames = (await Promise.all(leaves.map(async (leave) => {
        const user = await User.findOne({ employeeId: leave.employeeId });
        if (!user) return null;
        return {
          ...leave.toObject(),
          employeeName: `${user.firstName} ${user.lastName}`,
          department: user.department || 'Unknown'
        };
      }))).filter(l => l !== null);
      res.json(leavesWithNames);
  } catch(err) { res.status(500).json({ message: "Server error" }) }
});

// P5. GET ALL EMPLOYEES (Institution-wide)
app.get('/api/principal/employees', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['Employee', 'HoD'] } }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch institution-wide employees" });
  }
});

// P6. GET LEAVE TRENDS (Last 6 Months)
app.get('/api/principal/analytics/trends', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth()
      });
    }

    const trends = await Promise.all(months.map(async (m) => {
      const start = new Date(m.year, m.month, 1);
      const end = new Date(m.year, m.month + 1, 0, 23, 59, 59);
      
      const leaves = await LeaveRequest.find({
        status: { $in: ['Approved', 'Auto-Approved'] },
        startDate: { $lte: end },
        endDate: { $gte: start }
      });

      let count = 0;
      for (const l of leaves) {
        const u = await User.findOne({ employeeId: l.employeeId });
        if (u) count++;
      }
      
      return { month: m.name, count };
    }));

    res.json(trends);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch trends" });
  }
});

// 12. PRINCIPAL: HOD REJECTED LEAVES
// 12. PRINCIPAL: GET ALL HOD-REVIEWED LEAVES (Approved OR Rejected by HoD, future only, not yet overruled)
app.get('/api/principal/hod-reviewed', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get leaves where HoD has decided AND startDate hasn't passed AND principal hasn't already reviewed
    const leaves = await LeaveRequest.find({
      'hodApproval.status': { $in: ['Approved', 'Rejected'] },
      startDate: { $gte: today },
      $or: [
        { 'principalApproval.status': { $exists: false } },
        { 'principalApproval.status': 'N/A' },
        { 'principalApproval.status': 'Pending' }
      ]
    }).sort({ startDate: 1 });

    const leavesWithNames = (await Promise.all(leaves.map(async (leave) => {
      const user = await User.findOne({ employeeId: leave.employeeId });
      if (!user) return null;
      return {
        ...leave._doc,
        employeeName: `${user.firstName} ${user.lastName}`,
        department: user.department || user.dept
      };
    }))).filter(l => l !== null);

    res.json(leavesWithNames);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// Keep old hod-rejected as alias for backward compatibility
app.get('/api/principal/hod-rejected', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rejectedLeaves = await LeaveRequest.find({
      status: 'Rejected',
      'hodApproval.status': 'Rejected',
      startDate: { $gte: today }
    }).sort({ startDate: 1 });
    const leavesWithNames = (await Promise.all(rejectedLeaves.map(async (leave) => {
      const user = await User.findOne({ employeeId: leave.employeeId });
      if (!user) return null;
      return {
        ...leave._doc,
        employeeName: `${user.firstName} ${user.lastName}`,
        department: user.department || user.dept || 'Unknown'
      };
    }))).filter(l => l !== null);
    res.json(leavesWithNames);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});


// 12b. HOD: PRINCIPAL REJECTED LEAVES
app.get('/api/hod/principal-rejected/:dept', authMiddleware, roleMiddleware(['HoD', 'Admin']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const { dept } = req.params;

    const rejectedLeaves = await LeaveRequest.find({
      status: 'Rejected',
      'principalApproval.status': 'Rejected',
      startDate: { $gt: today }
    }).sort({ startDate: 1 });

    // Filter by department manually since department is on User model not LeaveRequest
    const leavesWithNames = await Promise.all(rejectedLeaves.map(async (leave) => {
      const user = await User.findOne({ employeeId: leave.employeeId });
      if (user && (user.department === dept || user.dept === dept)) {
        return {
          ...leave._doc,
          employeeName: `${user.firstName} ${user.lastName}`,
          department: user.department || user.dept
        };
      }
      return null;
    }));

    const filteredLeaves = leavesWithNames.filter(l => l !== null);
    res.json(filteredLeaves);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// P7. GET LOP & LATE MARK SUMMARIES
app.get('/api/principal/reports/lop-late-marks', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
    const lopSummary = await User.find({ 'leaveBalance.lop': { $gt: 0 } })
      .select('employeeId firstName lastName department leaveBalance.lop')
      .sort({ 'leaveBalance.lop': -1 });

    const lateMarkSummary = await LateMark.aggregate([
      { $group: { _id: "$employeeId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const lateMarksWithDetails = (await Promise.all(lateMarkSummary.map(async (item) => {
      const user = await User.findOne({ employeeId: item._id }).select('firstName lastName department');
      if (!user) return null;
      return {
        employeeId: item._id,
        name: `${user.firstName} ${user.lastName}`,
        department: user.department || 'Unknown',
        count: item.count
      };
    }))).filter(l => l !== null);

    res.json({ lopSummary, lateMarkSummary: lateMarksWithDetails });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch LOP/Late summaries" });
  }
});

// P8. GET ESCALATED LEAVES (Requests pending for more than 2 days or special types)
app.get('/api/principal/escalations', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const escalations = await LeaveRequest.find({
      status: 'Pending',
      $or: [
        { appliedOn: { $lte: twoDaysAgo } },
        { leaveType: { $in: ['AL', 'OD'] } } // These usually need ratification
      ]
    }).sort({ appliedOn: 1 });

    const userIds = escalations.map(l => l.employeeId);
    const users = await User.find({ employeeId: { $in: userIds } });
    
    const escalationsWithNames = escalations.map(leave => {
      const user = users.find(u => u.employeeId === leave.employeeId);
      return {
        ...leave.toObject(),
        employeeName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        department: user ? user.department : 'Unknown'
      };
    });

    res.json(escalationsWithNames);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch escalations" });
  }
});

// --- ADMIN ROUTES: EMPLOYEE MANAGEMENT ---

// A. Add Employee
app.post('/api/admin/employees', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const { 
      employeeId, password, firstName, lastName, email, department,
      designation, mobile, gender, address, teachingYear, aadhaar, pan, aicteId, jntuUid, dob, doj 
    } = req.body;
    
    if (!employeeId || !password || !firstName || !lastName || !email || !department || !designation || !mobile || !gender || !address || !teachingYear || !aadhaar || !pan || !dob || !doj) {
      return res.status(400).json({ message: "All employee details are required except AICTE and JNTU." });
    }

    // Strict Validation
    const emailError = validateEmailFormat(email);
    if (emailError) return res.status(400).json({ message: emailError });
    const mobileError = validateMobileFormat(mobile);
    if (mobileError) return res.status(400).json({ message: mobileError });
    const aadhaarError = validateAadhaarFormat(aadhaar);
    if (aadhaarError) return res.status(400).json({ message: aadhaarError });
    const panError = validatePanFormat(pan);
    if (panError) return res.status(400).json({ message: panError });

    const existingId = await User.findOne({ employeeId });
    if (existingId) return res.status(400).json({ message: "Employee ID already exists" });

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: "Email already exists" });

    const isAssistantProfessor = designation === 'Assistant Professor' || designation?.toLowerCase().includes('phd');
    const initialLeaveBalance = {
      cl: 6,
      ccl: 0,
      al: isAssistantProfessor ? 5 : 0,
      lop: 0
    };

    const newUser = new User({
      employeeId, password, role: 'Employee', firstName, lastName, email, department,
      designation, mobile, gender, address, teachingYear, aadhaar, pan, aicteId, jntuUid, dob, doj,
      leaveBalance: initialLeaveBalance
    });
    
    await newUser.save();

    // Auto-assign HoD to Department
    if (newUser.role === 'HoD' && newUser.department) {
      const Department = require('./models/Department');
      await Department.findOneAndUpdate(
        { name: newUser.department },
        { hodEmployeeId: newUser.employeeId }
      );
    }

    res.json({ message: "Employee Created Successfully", user: newUser });
  } catch (err) {
    res.status(500).json({ message: "Error creating employee", error: err.message });
  }
});

// B. Get All Employees
app.get('/api/admin/employees', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching employees", error: err.message });
  }
});

// C. Update Employee
app.put('/api/admin/employees/:id', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const { 
      password, firstName, lastName, email, department,
      designation, mobile, gender, address, teachingYear, aadhaar, pan, aicteId, jntuUid, dob, doj 
    } = req.body;

    if (!firstName || !lastName || !email || !department || !designation || !mobile || !gender || !address || !teachingYear || !aadhaar || !pan || !dob || !doj) {
      return res.status(400).json({ message: "All employee details are required except AICTE and JNTU." });
    }

    // Strict Validation
    const emailError = validateEmailFormat(email);
    if (emailError) return res.status(400).json({ message: emailError });
    const mobileError = validateMobileFormat(mobile);
    if (mobileError) return res.status(400).json({ message: mobileError });
    const aadhaarError = validateAadhaarFormat(aadhaar);
    if (aadhaarError) return res.status(400).json({ message: aadhaarError });
    const panError = validatePanFormat(pan);
    if (panError) return res.status(400).json({ message: panError });
    
    const user = await User.findOne({ employeeId: req.params.id });
    if (!user) return res.status(404).json({ message: "Employee not found" });

    // Update fields
    const fieldsToUpdate = [
      'firstName', 'lastName', 'email', 'department', 'designation', 
      'mobile', 'gender', 'address', 'teachingYear', 'aadhaar', 
      'pan', 'aicteId', 'jntuUid', 'dob', 'doj'
    ];
    
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    // Handle Password specifically to trigger hashing hook
    if (password && password.trim() !== "") {
      user.password = password;
    }

    await user.save();

    // Auto-assign HoD to Department
    if (user.role === 'HoD' && user.department) {
      const Department = require('./models/Department');
      await Department.findOneAndUpdate(
        { name: user.department },
        { hodEmployeeId: user.employeeId }
      );
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ message: "Employee Updated Successfully", user: userResponse });
  } catch (err) {
    console.error("ADMIN UPDATE ERROR:", err);
    res.status(500).json({ message: "Update Failed", error: err.message });
  }
});

// D. Delete Employee
app.delete('/api/admin/employees/:id', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const deleted = await User.findOneAndDelete({ employeeId: req.params.id });
    if (!deleted) return res.status(404).json({ message: "Employee not found" });
    
    res.json({ message: "Employee Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete Failed", error: err.message });
  }
});

// E. Leave Allocation / Modification
app.post('/api/admin/leaves/allocate', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const { employeeId, leaveType, amount, reason } = req.body;
    
    if (!amount || amount === 0) return res.status(400).json({ message: "Amount must be provided and cannot be zero." });

    const user = await User.findOne({ employeeId });
    if (!user) return res.status(404).json({ message: "Employee not found." });

    const balanceField = leaveType ? leaveType.toLowerCase() : null;
    if (!balanceField) return res.status(400).json({ message: "Invalid leave type." });

    // Update Balance
    if (user.leaveBalance[balanceField] === undefined) user.leaveBalance[balanceField] = 0;
    user.leaveBalance[balanceField] += Number(amount);
    user.markModified('leaveBalance');
    await user.save();

    // Create a Ledger Entry
    await LeaveLedger.create({
      employeeId, 
      transactionType: amount > 0 ? 'Credit' : 'Debit', 
      leaveType, 
      amount: Number(amount),
      reason: reason || 'Admin Manual Adjustment', 
      balanceAfter: user.leaveBalance[balanceField]
    });

    res.json({ message: `Successfully allocated ${amount} ${leaveType} to ${employeeId}.` });
  } catch (err) {
    res.status(500).json({ message: "Failed to allocate leave.", error: err.message });
  }
});

const Department = require('./models/Department');

// --- ADMIN ROUTES: DEPARTMENT MANAGEMENT ---

app.post('/api/admin/departments', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const { name, hodEmployeeId, description } = req.body;
    const existing = await Department.findOne({ name });
    if (existing) return res.status(400).json({ message: "Department already exists" });

    const newDept = new Department({ name, hodEmployeeId, description });
    await newDept.save();
    res.json({ message: "Department Created", department: newDept });
  } catch (err) { res.status(500).json({ message: "Error mapping department", error: err.message }); }
});

app.get('/api/admin/departments', authMiddleware, async (req, res) => {
  // Allow normal users to read departments (e.g. for dropdowns), but only Admin can edit
  try {
    const depts = await Department.find();
    res.json(depts);
  } catch (err) { res.status(500).json({ message: "Error fetching departments", error: err.message }); }
});

app.put('/api/admin/departments/:id', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const updated = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Department Updated", department: updated });
  } catch (err) { res.status(500).json({ message: "Error updating", error: err.message }); }
});

app.delete('/api/admin/departments/:id', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: "Department not found" });

    // Check for employees
    const employeeCount = await User.countDocuments({ department: dept.name });
    if (employeeCount > 0) {
      return res.status(400).json({ message: `Cannot delete department. There are ${employeeCount} employees assigned to it.` });
    }

    const deleted = await Department.findByIdAndDelete(req.params.id);
    res.json({ message: "Department Deleted" });
  } catch (err) { res.status(500).json({ message: "Error deleting", error: err.message }); }
});

// --- ADMIN ROUTES: REPORTS & ANALYTICS ---

// A. Global Stats for Dashboard
// A. Global Stats for Dashboard
app.get('/api/admin/reports/stats', authMiddleware, roleMiddleware(['Admin', 'Principal']), async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments();
    const totalDepartments = await Department.countDocuments();
    const pendingLeaves = await LeaveRequest.countDocuments({ status: 'Pending' });
    const approvedLeaves = await LeaveRequest.countDocuments({ status: { $in: ['Approved', 'Auto-Approved'] } });
    
    res.json({ totalEmployees, totalDepartments, pendingLeaves, approvedLeaves });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// B. Global Leave History (All Departments)
app.get('/api/admin/reports/history', authMiddleware, roleMiddleware(['Admin', 'Principal']), async (req, res) => {
  try {
    const leaves = await LeaveRequest.find().sort({ appliedOn: -1 }).limit(100);
    
    const enriched = await Promise.all(leaves.map(async (leave) => {
      const user = await User.findOne({ employeeId: leave.employeeId });
      return {
        ...leave.toObject(),
        employeeName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        department: user ? user.department : 'Unknown'
      };
    }));
    
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// B2. Advanced Reports (Filters for Month, Day, Status, Employee)
app.get('/api/admin/reports/advanced', authMiddleware, roleMiddleware(['Admin', 'Principal']), async (req, res) => {
  try {
    const { month, date, status, employeeId, searchName } = req.query;
    let query = {};

    

    // Filter by Exact Month (YYYY-MM)
    if (month) {
      const [year, m] = month.split('-');
      const startDate = new Date(year, parseInt(m) - 1, 1);
      const endDate = new Date(year, parseInt(m), 0, 23, 59, 59);
      query.$or = [
        { startDate: { $lte: endDate, $gte: startDate } },
        { endDate: { $lte: endDate, $gte: startDate } }
      ];
    }

    // Filter by Exact Date (YYYY-MM-DD)
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.$and = [
        { startDate: { $lte: endOfDay } },
        { endDate: { $gte: startOfDay } }
      ];
    }

    if (status) query.status = status;
    
    // Explicit Employee ID Match
    if (employeeId) {
      query.employeeId = employeeId;
    } 
    // Partial Name Search
    else if (searchName) {
      const searchRegex = new RegExp(searchName, 'i');
      const matchingUsers = await User.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { employeeId: searchRegex }
        ]
      });
      const matchingIds = matchingUsers.map(u => u.employeeId);
      query.employeeId = { $in: matchingIds };
    }

    const leaves = await LeaveRequest.find(query).sort({ appliedOn: -1 }).limit(500);
    
    const enriched = await Promise.all(leaves.map(async (leave) => {
      const user = await User.findOne({ employeeId: leave.employeeId });
      return {
        ...leave.toObject(),
        employeeName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        department: user ? user.department : 'Unknown'
      };
    }));
    
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// C. HOD: Today's Leaves in Department
app.get('/api/hod/today-leaves/:department', authMiddleware, roleMiddleware(['HoD', 'Admin', 'Principal']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usersInDept = await User.find({ department: req.params.department }).select('employeeId firstName lastName');
    const employeeIds = usersInDept.map(u => u.employeeId);
    const userMap = {};
    usersInDept.forEach(u => userMap[u.employeeId] = `${u.firstName} ${u.lastName}`);

    // Find leaves where today falls between start and end date inclusive
    const leavesToday = await LeaveRequest.find({
      employeeId: { $in: employeeIds },
      status: 'Approved',
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    const enrichedResult = leavesToday.map(leave => ({
      ...leave.toObject(),
      employeeName: userMap[leave.employeeId] || 'Unknown'
    }));

    res.json(enrichedResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// D. HOD: Department Leave History
app.get('/api/hod/leave-history/:department', authMiddleware, roleMiddleware(['HoD', 'Admin', 'Principal']), async (req, res) => {
  try {
    const usersInDept = await User.find({ department: req.params.department }).select('employeeId firstName lastName');
    const employeeIds = usersInDept.map(u => u.employeeId);
    const userMap = {};
    usersInDept.forEach(u => userMap[u.employeeId] = `${u.firstName} ${u.lastName}`);

    const history = await LeaveRequest.find({
      employeeId: { $in: employeeIds },
      status: { $in: ['Approved', 'Rejected', 'Auto-Approved'] }
    }).sort({ appliedOn: -1 }).limit(100);

    const enrichedResult = history.map(leave => ({
      ...leave.toObject(),
      employeeName: userMap[leave.employeeId] || 'Unknown'
    }));

    res.json(enrichedResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});



// --- ADMIN ROUTES: HOLIDAYS ---

/**
 * Automatically refunds leave balances if a new holiday overlaps an existing leave.
 * 
 * SANDWICH RULE: If the holiday falls STRICTLY between the leave's start and end date
 * (i.e., interior day), it is considered "sandwiched" → NO refund.
 * 
 * Refund IS given if the holiday matches the leave's start date OR end date
 * (even for a single-day leave where start === end === holiday).
 * 
 * Handles multi-day holiday ranges by iterating each day in the range.
 */
async function processHolidayRefunds(holidayStartDate, holidayEndDate) {
  try {
    const toUTCMidnight = (d) => {
      const iso = (d instanceof Date) ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);
      const [y, m, day] = iso.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, day));
    };

    const toUTCDateStr = (d) => toUTCMidnight(d).toISOString().slice(0, 10);

    const startRange = toUTCMidnight(holidayStartDate);
    const endRange   = toUTCMidnight(holidayEndDate);

    let currentHDate = new Date(startRange);

    while (currentHDate <= endRange) {
      const hDateStr   = toUTCDateStr(currentHDate);
      const hDateQuery = new Date(currentHDate);

      const affectedLeaves = await LeaveRequest.find({
        status: { $in: ['Approved', 'Pending', 'Auto-Approved'] },
        startDate: { $lte: hDateQuery },
        endDate:   { $gte: hDateQuery }
      });

      console.log(`[HOLIDAY REFUND] ${hDateStr}: processing ${affectedLeaves.length} affected leave(s).`);

      for (const leave of affectedLeaves) {
        const sStr = toUTCDateStr(leave.startDate);
        const eStr = toUTCDateStr(leave.endDate);

        // --- SANDWICH RULE ---
        if (sStr < hDateStr && hDateStr < eStr) {
          console.log(`[HOLIDAY REFUND] Leave #${leave._id} is SANDWICHED. No refund.`);
          continue;
        }

        if (hDateStr === sStr || hDateStr === eStr) {
          console.log(`[HOLIDAY REFUND] Leave #${leave._id} eligible for refund on ${hDateStr}.`);

          const user = await User.findOne({ employeeId: leave.employeeId });
          if (!user) continue;

          const refundAmount = leave.isHalfDay ? 0.5 : 1.0;
          let breakdown = leave.deductionBreakdown;
          const ledgerEntries = [];
          
          // Use a plain object for tracking remaining to refund
          let remaining = refundAmount;

          // HELPER: Get value from Breakdown (handles Map or Object)
          const getVal = (key) => {
            if (!breakdown) return 0;
            if (typeof breakdown.get === 'function') return breakdown.get(key) || 0;
            return breakdown[key] || 0;
          };

          // HELPER: Set value in Breakdown
          const setVal = (key, val) => {
            if (!breakdown) return;
            if (typeof breakdown.set === 'function') breakdown.set(key, val);
            else breakdown[key] = val;
          };

          // 1. DYNAMIC REFUND (If breakdown exists)
          const refundPriority = ['lop', 'al', 'cl', 'ccl'];
          let hasBreakdown = false;
          for (const type of refundPriority) {
             if (getVal(type) > 0) hasBreakdown = true;
          }

          if (hasBreakdown) {
            for (const type of refundPriority) {
              if (remaining <= 0) break;
              const currentDeducted = getVal(type);
              if (currentDeducted > 0) {
                const toRefund = Math.min(remaining, currentDeducted);
                
                if (type === 'lop') {
                  user.leaveBalance.lop = Math.max(0, (user.leaveBalance.lop || 0) - toRefund);
                } else {
                  user.leaveBalance[type] = (user.leaveBalance[type] || 0) + toRefund;
                }

                setVal(type, currentDeducted - toRefund);
                remaining -= toRefund;

                ledgerEntries.push({
                  employeeId: leave.employeeId,
                  transactionType: 'Credit',
                  leaveType: type.toUpperCase(),
                  amount: type === 'lop' ? -toRefund : toRefund,
                  reason: `Holiday Refund (${hDateStr}) for Leave #${leave._id}`,
                  referenceId: leave._id,
                  balanceAfter: user.leaveBalance[type] ?? user.leaveBalance.lop
                });
              }
            }
          } 
          else {
            // 2. LEGACY FALLBACK (If no breakdown)
            console.log(`[HOLIDAY REFUND] Leave #${leave._id} has no breakdown. Using Legacy Fallback.`);
            const types = leave.leaveType.split('+').map(t => t.trim().toLowerCase());
            // Filter out LOP to prioritize it last, but for legacy we'll just try the first type
            const targetType = types[0] || 'cl';
            const key = targetType === 'leave' ? 'cl' : targetType;

            if (key === 'lop') {
              user.leaveBalance.lop = Math.max(0, (user.leaveBalance.lop || 0) - remaining);
            } else {
              user.leaveBalance[key] = (user.leaveBalance[key] || 0) + remaining;
            }

            ledgerEntries.push({
              employeeId: leave.employeeId,
              transactionType: 'Credit',
              leaveType: key.toUpperCase(),
              amount: key === 'lop' ? -remaining : remaining,
              reason: `Holiday Refund (Legacy) (${hDateStr}) for Leave #${leave._id}`,
              referenceId: leave._id,
              balanceAfter: user.leaveBalance[key] ?? user.leaveBalance.lop
            });
            remaining = 0;
          }

          user.markModified('leaveBalance');
          await user.save();
          leave.markModified('deductionBreakdown');
          await leave.save();

          if (ledgerEntries.length > 0) {
            await LeaveLedger.insertMany(ledgerEntries);
            console.log(`[HOLIDAY REFUND] Leave #${leave._id}: Processed refunds. Remaining: ${remaining}`);
          }
        }
      }
      currentHDate.setUTCDate(currentHDate.getUTCDate() + 1);
    }
    console.log(`[HOLIDAY REFUND] Done. Range: ${toUTCDateStr(holidayStartDate)} → ${toUTCDateStr(holidayEndDate)}`);
  } catch (err) {
    console.error('[HOLIDAY REFUND] Error:', err);
  }
}

/**
 * REVERSE REFUND: When a holiday is DELETED or its range changes, we must
 * re-deduct the leave days that were previously refunded.
 */
async function processHolidayReverseRefunds(holidayStartDate, holidayEndDate) {
  try {
    const toUTCMidnight = (d) => {
      const iso = (d instanceof Date) ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);
      const [y, m, day] = iso.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, day));
    };

    const toUTCDateStr = (d) => toUTCMidnight(d).toISOString().slice(0, 10);

    const startRange = toUTCMidnight(holidayStartDate);
    const endRange   = toUTCMidnight(holidayEndDate);

    let currentHDate = new Date(startRange);

    while (currentHDate <= endRange) {
      const hDateStr = toUTCDateStr(currentHDate);
      
      console.log(`[HOLIDAY REVERSAL] Processing date: ${hDateStr}...`);

      // Find all ledger entries that were "Holiday Refunds" for this specific date
      // We look for "Holiday Refund" in the reason
      const refundEntries = await LeaveLedger.find({
        transactionType: 'Credit',
        reason: new RegExp(`Refund.*${hDateStr}`, 'i')
      });

      console.log(`[HOLIDAY REVERSAL] Found ${refundEntries.length} refund entry(ies) to reverse.`);

      for (const entry of refundEntries) {
        const leave = await LeaveRequest.findById(entry.referenceId);
        const user  = await User.findOne({ employeeId: entry.employeeId });

        if (!leave || !user) {
          console.warn(`[HOLIDAY REVERSAL] Leave or User missing for ledger entry ${entry._id}. skipping.`);
          continue;
        }

        const type = entry.leaveType.toLowerCase();
        const amount = Math.abs(entry.amount); // The amount we previously credited (or LOP we reduced)

        console.log(`[HOLIDAY REVERSAL] Reversing ${amount} ${type} for ${user.employeeId} (Leave #${leave._id})`);

        // Update user balances (Debit)
        if (type === 'lop') {
          // LOP is a positive number representing days owed. Crediting it made it smaller.
          // Debiting it (reversing) makes it larger again.
          user.leaveBalance.lop = (user.leaveBalance.lop || 0) + amount;
        } else {
          user.leaveBalance[type] = Math.max(0, (user.leaveBalance[type] || 0) - amount);
        }

        // Update leave breakdown (restore the deduction)
        let breakdown = leave.deductionBreakdown;
        const setVal = (key, val) => {
          if (!breakdown) return;
          if (typeof breakdown.set === 'function') breakdown.set(key, val);
          else breakdown[key] = val;
        };
        const getVal = (key) => {
          if (!breakdown) return 0;
          if (typeof breakdown.get === 'function') return breakdown.get(key) || 0;
          return breakdown[key] || 0;
        };

        setVal(type, getVal(type) + amount);

        // Save updates
        user.markModified('leaveBalance');
        await user.save();
        leave.markModified('deductionBreakdown');
        await leave.save();

        // Add a NEW Debit entry to show the reversal
        await new LeaveLedger({
          employeeId: user.employeeId,
          transactionType: 'Debit',
          leaveType: entry.leaveType,
          amount: type === 'lop' ? amount : -amount, // Debit is negative for AL/CL, positive for LOP (owed)
          reason: `Holiday Cancelled/Shifted - Re-deducting leave for ${hDateStr}`,
          referenceId: leave._id,
          balanceAfter: user.leaveBalance[type] ?? user.leaveBalance.lop
        }).save();
      }

      currentHDate.setUTCDate(currentHDate.getUTCDate() + 1);
    }
    console.log(`[HOLIDAY REVERSAL] Done. Range: ${toUTCDateStr(holidayStartDate)} → ${toUTCDateStr(holidayEndDate)}`);
  } catch (err) {
    console.error('[HOLIDAY REVERSAL] Error:', err);
  }
}

app.post('/api/admin/holidays', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    console.log("[ADMIN HOLIDAY] Received POST:", req.body);
    const { name, startDate, endDate, type } = req.body;
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: "Name, StartDate, and EndDate are required." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return res.status(400).json({ message: "Start date cannot be after end date." });
    }

    // Overlap Check
    const overlapping = await Holiday.findOne({
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });
    if (overlapping) {
      return res.status(400).json({ message: `Holiday range overlaps with existing holiday: ${overlapping.name}` });
    }

    const newHoliday = new Holiday({ name, startDate, endDate, type });
    await newHoliday.save();
    console.log("[ADMIN HOLIDAY] Holiday saved, processing refunds...");
    
    // Trigger Refund Logic for the range
    await processHolidayRefunds(startDate, endDate);
    
    res.json({ message: "Holiday Created successfully and affected leaves refunded.", holiday: newHoliday });
  } catch (err) { 
    console.error("[ADMIN HOLIDAY] Error in POST:", err);
    res.status(500).json({ error: err.message }); 
  }
});

app.put('/api/admin/holidays/:id', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    console.log("[ADMIN HOLIDAY] Received PUT for ID:", req.params.id, "Body:", req.body);
    const { name, startDate, endDate, type } = req.body;
    
    // FETCH OLD STATE FIRST to reverse old refunds if dates change
    const oldHoliday = await Holiday.findById(req.params.id);
    if (!oldHoliday) return res.status(404).json({ message: "Holiday not found" });

    // Normalize dates to YYYY-MM-DD for comparison
    const norm = (d) => new Date(d).toISOString().slice(0, 10);
    const datesChanged = norm(oldHoliday.startDate) !== norm(startDate) || 
                        norm(oldHoliday.endDate) !== norm(endDate);

    if (datesChanged) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        return res.status(400).json({ message: "Start date cannot be after end date." });
      }

      // Overlap Check (excluding current)
      const overlapping = await Holiday.findOne({
        _id: { $ne: req.params.id },
        $or: [
          { startDate: { $lte: end }, endDate: { $gte: start } }
        ]
      });
      if (overlapping) {
        return res.status(400).json({ message: `New holiday range overlaps with another holiday: ${overlapping.name}` });
      }
    }

    const updated = await Holiday.findByIdAndUpdate(req.params.id, { name, startDate, endDate, type }, { new: true });
    
    if (datesChanged) {
      console.log("[ADMIN HOLIDAY] Holiday dates changed. Reversing old refunds and applying new ones...");
      await processHolidayReverseRefunds(oldHoliday.startDate, oldHoliday.endDate);
      await processHolidayRefunds(startDate, endDate);
    }

    res.json({ message: "Holiday Updated and affected leaves checked for adjustments.", holiday: updated });
  } catch (err) { 
    console.error("[ADMIN HOLIDAY] Error in PUT:", err);
    res.status(500).json({ error: err.message }); 
  }
});

app.delete('/api/admin/holidays/:id', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    console.log("[ADMIN HOLIDAY] Received DELETE for ID:", req.params.id);
    
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      console.warn("[ADMIN HOLIDAY] Holiday not found for deletion:", req.params.id);
      return res.status(404).json({ message: "Holiday not found" });
    }

    // FIRST reverse any refunds given for this holiday
    console.log(`[ADMIN HOLIDAY] Reversing refunds for ${holiday.name} (${holiday.startDate.toISOString()} -> ${holiday.endDate.toISOString()})`);
    await processHolidayReverseRefunds(holiday.startDate, holiday.endDate);

    // THEN delete it
    await Holiday.findByIdAndDelete(req.params.id);
    console.log("[ADMIN HOLIDAY] Holiday deleted successfully.");
    
    res.json({ message: "Holiday Deleted and leave balances adjusted." });
  } catch (err) { 
    console.error("[ADMIN HOLIDAY] Error in DELETE:", err);
    res.status(500).json({ error: err.message }); 
  }
});

// GET Holidays (Public for all logged in)
app.get('/api/holidays', authMiddleware, async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json(holidays);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const AdjustmentRequest = require('./models/AdjustmentRequest');

// --- 9. ADJUSTMENT MODULE ---

// A. Get list of colleagues (for dropdown)
app.get('/api/users/list', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['Employee', 'HoD'] } })
      .select('employeeId firstName lastName department');
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// B. Create Adjustment Request
app.post('/api/adjustments/create', authMiddleware, async (req, res) => {
  try {
    const { date } = req.body;
    if (date) {
      const targetDate = new Date(date);
      const isHoliday = await Holiday.findOne({
        startDate: { $lte: targetDate },
        endDate: { $gte: targetDate }
      });
      if (isHoliday) {
        return res.status(400).json({ message: `Cannot apply adjustment on a holiday: ${isHoliday.name}` });
      }
    }
    const newRequest = new AdjustmentRequest(req.body);
    await newRequest.save();
    res.json({ message: "Adjustment Request Sent!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// C. Get Incoming Requests (Requests sent TO me)
app.get('/api/adjustments/incoming/:id', authMiddleware, async (req, res) => {
  try {
    const requests = await AdjustmentRequest.find({ targetEmployeeId: req.params.id }).sort({ createdAt: -1 });
    
    // Attach Requester Names manually
    const enriched = await Promise.all(requests.map(async (req) => {
      const user = await User.findOne({ employeeId: req.requesterId });
      return { ...req.toObject(), requesterName: user ? `${user.firstName} ${user.lastName}` : req.requesterId };
    }));
    
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// D. Get Outgoing Requests (Requests sent BY me)
app.get('/api/adjustments/outgoing/:id', authMiddleware, async (req, res) => {
  try {
    const requests = await AdjustmentRequest.find({ requesterId: req.params.id }).sort({ createdAt: -1 });
    
    // Attach Target Names manually
    const enriched = await Promise.all(requests.map(async (req) => {
      const user = await User.findOne({ employeeId: req.targetEmployeeId });
      return { ...req.toObject(), targetName: user ? `${user.firstName} ${user.lastName}` : req.targetEmployeeId };
    }));
    
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// E. Accept/Reject Request
app.post('/api/adjustments/respond', authMiddleware, async (req, res) => {
  try {
    const { requestId, status } = req.body;
    
    const adj = await AdjustmentRequest.findById(requestId);
    if (!adj) return res.status(404).json({ message: "Request not found" });

    // Authorization check
    if (adj.targetEmployeeId !== req.user.employeeId && req.user.role !== 'Admin') {
      return res.status(403).json({ message: "Access denied: You can only respond to requests sent to you." });
    }

    adj.status = status;
    await adj.save();
    res.json({ message: `Request ${status}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/leave/summary/:department', authMiddleware, roleMiddleware(['HoD']), async (req, res) => {
  try {
    const departmentRegex = new RegExp(`^${req.params.department}$`, 'i');
    const userQuery = { department: departmentRegex };

    // Filter by the HoD's assigned teaching year so counts are year-specific
    if (req.user.role === 'HoD' && req.user.teachingYear) {
      userQuery.teachingYear = req.user.teachingYear;
    }

    const usersInDept = await User.find(userQuery).select('employeeId');
    const employeeIds = usersInDept.map(u => u.employeeId);
    
    // Count specific statuses
    const pendingCount = await LeaveRequest.countDocuments({ employeeId: { $in: employeeIds }, status: 'Pending' });
    const autoApprovedCount = await LeaveRequest.countDocuments({ employeeId: { $in: employeeIds }, status: 'Auto-Approved' });
    
    res.json({ pending: pendingCount, autoApproved: autoApprovedCount });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// --- GET DEPT ADJUSTMENTS (For HoD Reports) ---
app.get('/api/adjustments/department/:department', authMiddleware, roleMiddleware(['HoD', 'Admin']), async (req, res) => {
  try {
    // 1. Find all employees in this HoD's department
    const usersInDept = await User.find({ department: req.params.department }).select('employeeId firstName lastName');
    const deptEmployeeIds = usersInDept.map(u => u.employeeId);
    
    // Create a lookup map for names
    const userMap = {};
    usersInDept.forEach(u => userMap[u.employeeId] = `${u.firstName} ${u.lastName}`);

    // 2. Find all adjustments requested by employees in this department
    const adjustments = await AdjustmentRequest.find({
      requesterId: { $in: deptEmployeeIds }
    }).sort({ date: -1 });

    // 3. Attach names for UI
    const enriched = await Promise.all(adjustments.map(async (adj) => {
      let targetName = userMap[adj.targetEmployeeId];
      if (!targetName) {
        const targetUser = await User.findOne({ employeeId: adj.targetEmployeeId });
        targetName = targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : adj.targetEmployeeId;
      }
      return {
        ...adj.toObject(),
        requesterName: userMap[adj.requesterId] || adj.requesterId,
        targetName: targetName
      };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 11. LATE MARKS TRACKING ---

// A. Add a late mark (Admin)
app.post('/api/admin/late-marks', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const { employeeId, date, reason } = req.body;
    
    // Verify user exists
    const user = await User.findOne({ employeeId });
    if (!user) return res.status(404).json({ message: "Employee not found" });

    const newLateMark = new LateMark({
      employeeId,
      date,
      reason,
      addedBy: req.user.employeeId
    });
    
    await newLateMark.save();
    res.json({ message: "Late mark added successfully", lateMark: newLateMark });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// B. Get all late marks for an employee (Employee & Admin/HoD)
app.get('/api/late-marks/:employeeId', authMiddleware, async (req, res) => {
  try {
    const marks = await LateMark.find({ employeeId: req.params.employeeId }).sort({ date: -1 });
    res.json(marks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// C. Get all late marks globally (Admin view)
app.get('/api/admin/late-marks/all', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const marks = await LateMark.find().sort({ date: -1 });
    
    // Attach employee names
    const enriched = await Promise.all(marks.map(async (mark) => {
      const user = await User.findOne({ employeeId: mark.employeeId });
      return {
        ...mark.toObject(),
        employeeName: user ? `${user.firstName} ${user.lastName}` : 'Unknown'
      };
    }));
    
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 12. DYNAMIC LEAVE TYPES ---

// A. Add a Leave Type
app.post('/api/admin/leave-types', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const { code, name, defaultDays } = req.body;
    const existing = await LeaveType.findOne({ code: code.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Leave type with this code already exists" });

    const newType = new LeaveType({ code: code.toLowerCase(), name, defaultDays: Number(defaultDays) });
    await newType.save();

    // AUTO-CREDIT: Give this leave to all existing employees
    if (Number(defaultDays) > 0) {
      const balanceField = code.toLowerCase();
      await User.updateMany(
        { role: 'Employee' }, 
        { $set: { [`leaveBalance.${balanceField}`]: Number(defaultDays) } }
      );
    }

    res.json({ message: "Leave type created successfully and credited to all employees", leaveType: newType });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// B. Get all Leave Types (Public for logged in users)
app.get('/api/leave-types', authMiddleware, async (req, res) => {
  try {
    const types = await LeaveType.find().sort({ code: 1 });
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// C. Update Leave Type
app.put('/api/admin/leave-types/:id', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const { name, defaultDays } = req.body;
    const updated = await LeaveType.findByIdAndUpdate(req.params.id, { name, defaultDays }, { new: true });
    if (!updated) return res.status(404).json({ message: "Leave type not found" });
    res.json({ message: "Leave type updated", leaveType: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// D. Delete Leave Type
app.delete('/api/admin/leave-types/:id', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const deleted = await LeaveType.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Leave type not found" });
    res.json({ message: "Leave type deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 13. MESSAGES / CONTACT HR ---

// A. Send a message (Employee → Admin/Principal/HoD)
app.post('/api/messages/send', authMiddleware, async (req, res) => {
  try {
    const { recipientRole, subject, message } = req.body;
    
    let recipientDepartment = null;
    let recipientTeachingYear = null;

    if (recipientRole === 'HoD') {
      // For HoD, target the sender's own department and year
      const sender = await User.findOne({ employeeId: req.user.employeeId });
      if (sender) {
        recipientDepartment = sender.department;
        recipientTeachingYear = sender.teachingYear;
      }
    }

    const newMessage = new Message({
      senderId: req.user.employeeId,
      senderRole: req.user.role,
      recipientRole,
      recipientDepartment,
      recipientTeachingYear,
      subject,
      message
    });
    await newMessage.save();
    res.json({ message: 'Message sent successfully', data: newMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// A2. Send a message to a specific employee (Admin/Principal → Employee)
app.post('/api/messages/send-to-employee', authMiddleware, roleMiddleware(['Admin', 'Principal', 'HoD']), async (req, res) => {
  try {
    const { recipientId, subject, message } = req.body;
    if (!recipientId || !subject || !message) {
      return res.status(400).json({ message: 'Recipient Employee ID, subject, and message are required' });
    }
    
    const recipient = await User.findOne({ employeeId: recipientId });
    if (!recipient) return res.status(404).json({ message: `No employee found with ID: ${recipientId}` });
    
    const newMessage = new Message({
      senderId: req.user.employeeId,
      senderRole: req.user.role,
      recipientId: recipientId,
      subject,
      message
    });
    await newMessage.save();
    res.json({ message: `Message sent to ${recipient.firstName} ${recipient.lastName}`, data: newMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// A3. Get messages received by an employee (sent by Admin/Principal/HoD directly to them)
app.get('/api/messages/received', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ recipientId: req.user.employeeId }).sort({ createdAt: -1 });
    const enriched = await Promise.all(messages.map(async (msg) => {
      const sender = await User.findOne({ employeeId: msg.senderId });
      return {
        ...msg.toObject(),
        senderName: sender ? `${sender.firstName} ${sender.lastName} (${sender.role})` : `User ${msg.senderId}`
      };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// A3.5 Get messages sent BY the current user (including those they replied to)
app.get('/api/messages/sent', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ 
      $or: [
        { senderId: req.user.employeeId },
        { repliedBy: req.user.employeeId }
      ]
    }).sort({ createdAt: -1 });

    const enriched = await Promise.all(messages.map(async (msg) => {
      let recipientName = msg.recipientRole || 'Unknown';
      if (msg.recipientId) {
        const recipient = await User.findOne({ employeeId: msg.recipientId });
        recipientName = recipient ? `${recipient.firstName} ${recipient.lastName} (${msg.recipientId})` : `User ${msg.recipientId}`;
      }
      return {
        ...msg.toObject(),
        recipientName
      };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// A3.8 Get unread message count for the logged-in user (sidebar badge)
app.get('/api/messages/unread-count', authMiddleware, async (req, res) => {
  try {
    let count = 0;
    
    if (['Admin', 'Principal', 'HoD'].includes(req.user.role)) {
      count = await Message.countDocuments({
        $or: [
          {
            recipientRole: req.user.role,
            ...(req.user.role === 'HoD' ? {
              recipientDepartment: req.user.department,
              recipientTeachingYear: req.user.teachingYear
            } : {})
          },
          { recipientId: req.user.employeeId }
        ],
        status: 'Unread'
      });
    } else {
      // For Employee
      count = await Message.countDocuments({ recipientId: req.user.employeeId, status: 'Unread' });
    }
    
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// A4. Mark a received message as read (employee)
app.put('/api/messages/received/read/:id', authMiddleware, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    msg.status = 'Read';
    await msg.save();
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// B. Get inbox for Admin/Principal/HoD
app.get('/api/messages/inbox', authMiddleware, roleMiddleware(['Admin', 'Principal', 'HoD']), async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        {
          recipientRole: req.user.role,
          ...(req.user.role === 'HoD' ? {
            recipientDepartment: req.user.department,
            recipientTeachingYear: req.user.teachingYear
          } : {})
        },
        { recipientId: req.user.employeeId }
      ]
    }).sort({ createdAt: -1 });
    
    // Attach employee names
    const enriched = await Promise.all(messages.map(async (msg) => {
      const user = await User.findOne({ employeeId: msg.senderId });
      return {
        ...msg.toObject(),
        senderName: user ? `${user.firstName} ${user.lastName} (${msg.senderId})` : `Employee ${msg.senderId}`
      };
    }));
    
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// C. Mark message as read (Admin/Principal/HoD)
app.put('/api/messages/read/:id', authMiddleware, roleMiddleware(['Admin', 'Principal', 'HoD']), async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    
    msg.status = 'Read';
    await msg.save();
    res.json({ message: 'Message marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// D. Reply to a message (Admin/Principal/HoD only)
app.post('/api/messages/reply/:id', authMiddleware, roleMiddleware(['Admin', 'Principal', 'HoD']), async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply) return res.status(400).json({ message: 'Reply text is required' });
    
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    
    msg.reply = reply;
    msg.repliedAt = new Date();
    msg.repliedBy = req.user.employeeId;
    msg.status = 'Read'; // Mark as read when replied
    await msg.save();
    
    res.json({ message: 'Reply sent successfully', data: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// E. Get replies for the logged-in employee (for their sent messages)
app.get('/api/messages/my-replies', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ 
      senderId: req.user.employeeId, 
      reply: { $ne: null }
    }).sort({ repliedAt: -1 });
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Start Server ---
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please kill the process using it.`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
  }
});
