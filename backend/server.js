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
const Adjustment = require('./models/Adjustment');
const Holiday = require('./models/Holiday');
const jwt = require('jsonwebtoken');
const { authMiddleware, roleMiddleware } = require('./middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 5000;

// --- Nodemailer Transporter ---
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
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
  console.log(`Login attempt: ID=${employeeId}, PW=${password}`);
  try {
    const user = await User.findOne({ employeeId });
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
      { employeeId: user.employeeId, role: user.role, dept: user.department },
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
        department: user.department
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

    const updateData = { ...req.body };
    // Remove protected fields
    delete updateData.employeeId;
    delete updateData.password;
    delete updateData.role;
    delete updateData.leaveBalance;

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
    // req.user comes from authMiddleware
    console.log("CHANGE PW req.user:", req.user, "currentPassword:", currentPassword);
    const user = await User.findOne({ employeeId: req.user.employeeId });
    console.log("Found user:", user?.employeeId, "password:", user?.password);
    
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

// 3. UPDATE PROFILE ROUTE
app.put('/api/user/:id', authMiddleware, async (req, res) => {
  try {
    // Restrict updatable fields as per requirements
    const { address, designation, email, mobile, profileImg } = req.body;
    const updateData = {};
    if (address !== undefined) updateData.address = address;
    if (designation !== undefined) updateData.designation = designation;
    if (email !== undefined) updateData.email = email;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (profileImg !== undefined) updateData.profileImg = profileImg;

    const updatedUser = await User.findOneAndUpdate(
      { employeeId: req.params.id },
      { $set: updateData },
      { new: true }
    );
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Update Failed", error: err.message });
  }
});

// 3c. ADJUSTMENTS ROUTES
app.post('/api/adjustments/create', authMiddleware, async (req, res) => {
  try {
    const { targetEmployeeId, requesterId, date, period, classSection, reason } = req.body;
    
    const targetUser = await User.findOne({ employeeId: targetEmployeeId });
    if (!targetUser) return res.status(404).json({ message: "Target user not found" });

    const requester = await User.findOne({ employeeId: requesterId });
    const reqName = requester ? `${requester.firstName} ${requester.lastName}` : requesterId;

    const newAdj = new Adjustment({
      requesterId,
      requesterName: reqName, 
      targetEmployeeId,
      targetName: `${targetUser.firstName} ${targetUser.lastName}`,
      date, period, classSection, reason, status: 'Pending'
    });

    await newAdj.save();
    res.json({ message: "Adjustment request sent", adjustment: newAdj });
  } catch(err) {
    res.status(500).json({ message: "Failed to create adjustment", error: err.message });
  }
});

app.get('/api/adjustments/incoming/:id', authMiddleware, async (req, res) => {
  try {
    const adjs = await Adjustment.find({ targetEmployeeId: req.params.id }).sort({ createdAt: -1 });
    res.json(adjs);
  } catch(err) {
    res.status(500).json({ message: "Failed to fetch incoming adjustments" });
  }
});

app.get('/api/adjustments/outgoing/:id', authMiddleware, async (req, res) => {
  try {
    const adjs = await Adjustment.find({ requesterId: req.params.id }).sort({ createdAt: -1 });
    res.json(adjs);
  } catch(err) {
    res.status(500).json({ message: "Failed to fetch outgoing adjustments" });
  }
});

app.post('/api/adjustments/respond', authMiddleware, async (req, res) => {
  try {
    const { requestId, status } = req.body;
    const adj = await Adjustment.findById(requestId);
    if (!adj) return res.status(404).json({ message: "Request not found" });
    
    if (adj.targetEmployeeId !== req.user.employeeId && req.user.role !== 'Admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    adj.status = status;
    await adj.save();
    res.json({ message: `Request ${status} successfully` });
  } catch(err) {
    res.status(500).json({ message: "Failed to respond to adjustment" });
  }
});


// 4. APPLY LEAVE ROUTE
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
    // --- END VALIDATION LOGIC ---

    // 1. Fetch holidays
    const allHolidays = await Holiday.find({});
    
    // Helper to check if a date is a holiday or Sunday
    const getHolidayType = (date) => {
        const d = new Date(date);
        d.setHours(0,0,0,0);
        const day = d.getDay(); // 0 is Sunday
        
        const h = allHolidays.find(h => {
             const hDate = new Date(h.date);
             hDate.setHours(0,0,0,0);
             return hDate.getTime() === d.getTime();
        });
        
        if (h) return h.type;
        if (day === 0) return 'Sunday';
        return null;
    };

    const isDeductibleHoliday = (date) => {
        const type = getHolidayType(date);
        if (type === 'Sunday') return true;
        if (type && type !== 'Summer Holidays') return true;
        return false;
    };

    const isSummerHoliday = (date) => getHolidayType(date) === 'Summer Holidays';

    // 2. Validate Start/End Restriction
    const startType = getHolidayType(startLocalDate);
    const endType = getHolidayType(endLocalDate);
    
    if (isDeductibleHoliday(startLocalDate)) {
      return res.status(400).json({ message: `Leave cannot start on a ${startType}.` });
    }
    if (isDeductibleHoliday(endLocalDate)) {
      return res.status(400).json({ message: `Leave cannot end on a ${endType}.` });
    }

    // 3. Calculate days (Inclusive of intervening deductible holidays)
    let totalDeductionDays = 0;
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

      // 4. Bridge Rule (Detect adjacent approved leaves separated only by deductible holidays)
      // Scan backwards from startDate
      let backwardBridge = 0;
      let backwardScan = new Date(startLocalDate);
      backwardScan.setDate(backwardScan.getDate() - 1);
      
      // Safety limit to avoid infinite loops if isDeductibleHoliday has issues
      let safetyCounter = 0;
      while (isDeductibleHoliday(backwardScan) && safetyCounter < 10) {
          backwardBridge++;
          backwardScan.setDate(backwardScan.getDate() - 1);
          safetyCounter++;
      }
      
      const prevEndDateStr = `${backwardScan.getFullYear()}-${String(backwardScan.getMonth() + 1).padStart(2, '0')}-${String(backwardScan.getDate()).padStart(2, '0')}`;
      const prevLeaveExists = await LeaveRequest.findOne({
          employeeId,
          status: { $in: ['Approved', 'Auto-Approved'] },
          endDate: prevEndDateStr
      });
      if (prevLeaveExists) totalDeductionDays += backwardBridge;

      // Scan forwards from endDate
      let forwardBridge = 0;
      let forwardScan = new Date(endLocalDate);
      forwardScan.setDate(forwardScan.getDate() + 1);
      
      safetyCounter = 0;
      while (isDeductibleHoliday(forwardScan) && safetyCounter < 10) {
          forwardBridge++;
          forwardScan.setDate(forwardScan.getDate() + 1);
          safetyCounter++;
      }
      
      const nextStartDateStr = `${forwardScan.getFullYear()}-${String(forwardScan.getMonth() + 1).padStart(2, '0')}-${String(forwardScan.getDate()).padStart(2, '0')}`;
      const nextLeaveExists = await LeaveRequest.findOne({
          employeeId,
          status: { $in: ['Approved', 'Auto-Approved'] },
          startDate: nextStartDateStr
      });
      if (nextLeaveExists) totalDeductionDays += forwardBridge;
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

    let remainingDays = leaveType === 'OD' ? 0 : days;
    let breakdown = { ccl: 0, cl: 0, al: 0, lop: 0 };

    // 3. The Deduction Engine
    // SPECIAL LEAVE LOGIC (AL)
    if (leaveType === 'AL') {
      const isAsstProf = user.designation && user.designation.toLowerCase().includes('assistant professor');
      if (!user.isPhdRegistered && !isAsstProf) {
        return res.status(400).json({ message: "Academic Leave (AL) is only available for PhD-registered faculty or Assistant Professors." });
      }

      // Enforce document upload for AL
      if (!documentUrl) {
        return res.status(400).json({ message: "Supporting document is mandatory for Academic Leave (AL)." });
      }

      const currentYear = new Date().getFullYear();
      const ledgerEntriesYear = await LeaveLedger.find({
        employeeId,
        leaveType: 'AL',
        transactionType: 'Debit',
        date: { $gte: new Date(currentYear, 0, 1), $lte: new Date(currentYear, 11, 31) }
      });
      const alUsed = ledgerEntriesYear.reduce((sum, e) => sum + Math.abs(e.amount), 0);
      const alLimit = 5; 
      const alAvailable = Math.max(0, alLimit - alUsed);
      
      const alToDeduct = Math.min(remainingDays, alAvailable);
      if (alToDeduct > 0) {
        breakdown.al = alToDeduct;
        remainingDays -= alToDeduct;
      }

      // AL OVERFLOW -> CL (if any AL remains un-filled or if AL limit was zero)
      if (remainingDays > 0 && user.leaveBalance.cl > 0) {
        const clToDeduct = Math.min(remainingDays, user.leaveBalance.cl);
        user.leaveBalance.cl -= clToDeduct;
        breakdown.cl = clToDeduct;
        remainingDays -= clToDeduct;
      }
    } 
    // STANDARD TIERED DEDUCTION LOGIC (CCL -> CL -> LOP)
    else if (leaveType === 'CL' || leaveType === 'Standard') {
      // Tier 1: CCL (Compensatory Casual Leave is burned first)
      if (remainingDays > 0 && user.leaveBalance.ccl > 0) {
        const cclToDeduct = Math.min(remainingDays, user.leaveBalance.ccl);
        user.leaveBalance.ccl -= cclToDeduct;
        breakdown.ccl = cclToDeduct;
        remainingDays -= cclToDeduct;
      }

      // Tier 2: CL (Burned only if CCL is depleted) - Using absolute balance
      if (remainingDays > 0 && user.leaveBalance.cl > 0) {
        const clToDeduct = Math.min(remainingDays, user.leaveBalance.cl);
        user.leaveBalance.cl -= clToDeduct;
        breakdown.cl = clToDeduct;
        remainingDays -= clToDeduct;
      }
    }
    // We removed the legacy fallback block because CL deduction is now handled precisely in the standard tier above.
    
    if (remainingDays > 0) {
      user.leaveBalance.lop += remainingDays;
      breakdown.lop = remainingDays;
      remainingDays = 0;
    }

    // Save updated balance
    await User.updateOne(
      { employeeId: user.employeeId },
      { $set: { leaveBalance: user.leaveBalance } }
    );

    // Determine exact leaveType string based on breakdown
    let finalLeaveType = leaveType;
    if (leaveType === 'Standard' || leaveType === 'AL') {
      const parts = [];
      if (breakdown.al > 0) parts.push('AL');
      if (breakdown.ccl > 0) parts.push('CCL');
      if (breakdown.cl > 0) parts.push('CL');
      if (breakdown.lop > 0) parts.push('LOP');
      if (parts.length > 0) {
        finalLeaveType = parts.join(' + ');
      } else if (leaveType === 'Standard') {
        finalLeaveType = 'Leave';
      }
    }

    // 4. Create Request
    const newLeave = new LeaveRequest({
      employeeId, leaveType: finalLeaveType, startDate, endDate, reason,
      isHalfDay: halfDayBool,
      halfDayType: finalHalfDayType,
      documentUrl, // Save the path to DB
      deductionBreakdown: breakdown,
      adjustments: adjustments, 
      status: 'Pending', 
      hodApproval: { status: 'Pending' }
    });
    await newLeave.save();

    // 5. Update Ledger
    const ledgerEntries = [];
    if (breakdown.al > 0) {
      ledgerEntries.push({
        employeeId, transactionType: 'Debit', leaveType: 'AL', amount: -breakdown.al,
        reason: `Leave Application #${newLeave._id}`, referenceId: newLeave._id, balanceAfter: user.leaveBalance.al
      });
    }
    if (breakdown.ccl > 0) {
      ledgerEntries.push({
        employeeId, transactionType: 'Debit', leaveType: 'CCL', amount: -breakdown.ccl,
        reason: `Leave Application (Priority Deduct) #${newLeave._id}`, referenceId: newLeave._id, balanceAfter: user.leaveBalance.ccl
      });
    }
    if (breakdown.cl > 0) {
      ledgerEntries.push({
        employeeId, transactionType: 'Debit', leaveType: 'CL', amount: -breakdown.cl,
        reason: `Leave Application (Priority Deduct) #${newLeave._id}`, referenceId: newLeave._id, balanceAfter: user.leaveBalance.cl
      });
    }
    if (breakdown.lop > 0) {
      ledgerEntries.push({
        employeeId, transactionType: 'Debit', leaveType: 'LOP', amount: breakdown.lop, 
        reason: `Leave Application (Priority Deduct / LOP) #${newLeave._id}`, referenceId: newLeave._id, balanceAfter: user.leaveBalance.lop
      });
    }

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

    // 1. Get User Profile for AL Policy
    const user = await User.findOne({ employeeId });
    const isAssistantProfessor = user && (user.designation === 'Assistant Professor' || user.designation?.toLowerCase().includes('phd'));
    
    // Inject Annual AL Allocation into January (Month 0) if eligible
    if (isAssistantProfessor) {
        ledgerData[0].al = 5;
    }

    // 2. Get Ledger Entries (Credits/Debits)
    const ledgerEntries = await LeaveLedger.find({ 
      employeeId, 
      date: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31) } 
    }).sort({ date: 1 }); // Sort by date for running totals

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
    const alBaseAlloc = isAssistantProf ? 5 : (user?.leaveBalance?.al || 0);
    const alRemainingNow = Math.max(0, alBaseAlloc - getNetUsed('al'));

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
       
       if (user && leave.deductionBreakdown) {
         const { al, ccl, cl, lop } = leave.deductionBreakdown;
         const ledgerEntries = [];
         
         if (al > 0) {
           user.leaveBalance.al += al;
           ledgerEntries.push({ employeeId: leave.employeeId, transactionType: 'Credit', leaveType: 'AL', amount: al, reason: `Leave Cancelled (Refund) #${leaveId}`, referenceId: leaveId, balanceAfter: user.leaveBalance.al });
         }
         if (ccl > 0) {
           user.leaveBalance.ccl += ccl;
           ledgerEntries.push({ employeeId: leave.employeeId, transactionType: 'Credit', leaveType: 'CCL', amount: ccl, reason: `Leave Cancelled (Refund) #${leaveId}`, referenceId: leaveId, balanceAfter: user.leaveBalance.ccl });
         }
         if (cl > 0) {
           user.leaveBalance.cl += cl;
           ledgerEntries.push({ employeeId: leave.employeeId, transactionType: 'Credit', leaveType: 'CL', amount: cl, reason: `Leave Cancelled (Refund) #${leaveId}`, referenceId: leaveId, balanceAfter: user.leaveBalance.cl });
         }
         if (lop > 0) {
           user.leaveBalance.lop -= lop; // Reverting LOP means subtracting
           ledgerEntries.push({ employeeId: leave.employeeId, transactionType: 'Credit', leaveType: 'LOP', amount: -lop, reason: `Leave Cancelled (Reverted LOP) #${leaveId}`, referenceId: leaveId, balanceAfter: user.leaveBalance.lop });
         }
         
         user.markModified('leaveBalance');
         await user.save();
         if (ledgerEntries.length > 0) await LeaveLedger.insertMany(ledgerEntries);
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
    const usersInDept = await User.find({ department: departmentRegex }).select('employeeId');
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
    const usersInDept = await User.find({ department: departmentRegex }).select('employeeId firstName lastName');
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

    leave.status = action;
    const actionByName = req.user ? `${req.user.firstName} ${req.user.lastName} (${req.user.role})` : 'System';
    leave.hodApproval = { status: action, comment, date: new Date(), actionBy: actionByName };

    // Refund if Rejected
    if (action === 'Rejected') {
       const user = await User.findOne({ employeeId: leave.employeeId });
       
       if (user && leave.deductionBreakdown) {
         const { al, ccl, cl, lop } = leave.deductionBreakdown;
         const ledgerEntries = [];
         
         if (al > 0) {
           user.leaveBalance.al += al;
           ledgerEntries.push({ employeeId: leave.employeeId, transactionType: 'Credit', leaveType: 'AL', amount: al, reason: `Leave Rejected (Refund) #${leaveId}`, referenceId: leaveId, balanceAfter: user.leaveBalance.al });
         }
         if (ccl > 0) {
           user.leaveBalance.ccl += ccl;
           ledgerEntries.push({ employeeId: leave.employeeId, transactionType: 'Credit', leaveType: 'CCL', amount: ccl, reason: `Leave Rejected (Refund) #${leaveId}`, referenceId: leaveId, balanceAfter: user.leaveBalance.ccl });
         }
         if (cl > 0) {
           user.leaveBalance.cl += cl;
           ledgerEntries.push({ employeeId: leave.employeeId, transactionType: 'Credit', leaveType: 'CL', amount: cl, reason: `Leave Rejected (Refund) #${leaveId}`, referenceId: leaveId, balanceAfter: user.leaveBalance.cl });
         }
         if (lop > 0) {
           user.leaveBalance.lop -= lop;
           ledgerEntries.push({ employeeId: leave.employeeId, transactionType: 'Credit', leaveType: 'LOP', amount: -lop, reason: `Leave Rejected (Reverted LOP) #${leaveId}`, referenceId: leaveId, balanceAfter: user.leaveBalance.lop });
         }
         
         user.markModified('leaveBalance');
         await user.save();
         if (ledgerEntries.length > 0) await LeaveLedger.insertMany(ledgerEntries);
       }
    }
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

    const users = await User.find(queryFilter).select('employeeId firstName lastName department designation email mobile');
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
     const pendingLeaves = await LeaveRequest.countDocuments({ status: 'Pending' });

     // Leaves today
     const today = new Date();
     const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
     const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

     const onLeaveToday = await LeaveRequest.countDocuments({
       status: { $in: ['Approved', 'Auto-Approved'] },
       startDate: { $lte: endOfDay },
       endDate: { $gte: startOfDay }
     });

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
     
     const userIds = leaves.map(l => l.employeeId);
     const users = await User.find({ employeeId: { $in: userIds } });
     
     const leavesWithNames = leaves.map(leave => {
       const user = users.find(u => u.employeeId === leave.employeeId);
       return {
         ...leave.toObject(),
         employeeName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
         department: user ? user.department : 'Unknown'
       };
     });
     
     res.json(leavesWithNames);
  } catch(err) { res.status(500).json({ message: "Server Error" }) }
});

// P3. GET GLOBAL PENDING FOR RATIFICATION
app.get('/api/principal/pending', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
     const leaves = await LeaveRequest.find({ status: 'Pending' }).sort({ appliedOn: 1 });
     const userIds = leaves.map(l => l.employeeId);
     const users = await User.find({ employeeId: { $in: userIds } });
     
     const leavesWithNames = leaves.map(leave => {
       const user = users.find(u => u.employeeId === leave.employeeId);
       return {
         ...leave.toObject(),
         employeeName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
         department: user ? user.department : 'Unknown'
       };
     });
     res.json(leavesWithNames);
  } catch(err) { res.status(500).json({ message: "Server error" }) }
});

// P4. GET GLOBAL LEAVE HISTORY
app.get('/api/principal/leave-history', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
     const leaves = await LeaveRequest.find().sort({ appliedOn: -1 }).limit(100);
     const userIds = leaves.map(l => l.employeeId);
     const users = await User.find({ employeeId: { $in: userIds } });
     
     const leavesWithNames = leaves.map(leave => {
       const user = users.find(u => u.employeeId === leave.employeeId);
       return {
         ...leave.toObject(),
         employeeName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
         department: user ? user.department : 'Unknown'
       };
     });
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
      
      const leaveCount = await LeaveRequest.countDocuments({
        status: { $in: ['Approved', 'Auto-Approved'] },
        startDate: { $lte: end },
        endDate: { $gte: start }
      });
      
      return { month: m.name, count: leaveCount };
    }));

    res.json(trends);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch trends" });
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

    const lateMarksWithDetails = await Promise.all(lateMarkSummary.map(async (item) => {
      const user = await User.findOne({ employeeId: item._id }).select('firstName lastName department');
      return {
        employeeId: item._id,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        department: user ? user.department : 'Unknown',
        count: item.count
      };
    }));

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
      employeeId, password, role, firstName, lastName, email, department,
      designation, mobile, gender, address, aadhaar, pan, aicteId, jntuUid, dob, doj 
    } = req.body;
    
    const existing = await User.findOne({ employeeId });
    if (existing) return res.status(400).json({ message: "Employee ID already exists" });

    const newUser = new User({
      employeeId, password, role: role || 'Employee', firstName, lastName, email, department,
      designation, mobile, gender, address, aadhaar, pan, aicteId, jntuUid, dob, doj
    });
    
    await newUser.save();
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
    const updatedUser = await User.findOneAndUpdate(
      { employeeId: req.params.id },
      req.body,
      { new: true }
    ).select('-password');
    
    if (!updatedUser) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee Updated", user: updatedUser });
  } catch (err) {
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
    const deleted = await Department.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Department Deleted" });
  } catch (err) { res.status(500).json({ message: "Error deleting", error: err.message }); }
});

// --- ADMIN ROUTES: REPORTS & ANALYTICS ---

// A. Global Stats for Dashboard
app.get('/api/admin/reports/stats', authMiddleware, roleMiddleware(['Admin', 'Principal']), async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments();
    const departments = await Department.countDocuments();
    const pendingLeaves = await LeaveRequest.countDocuments({ status: 'Pending' });
    const approvedLeaves = await LeaveRequest.countDocuments({ status: 'Approved' });
    
    res.json({ totalEmployees, departments, pendingLeaves, approvedLeaves });
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
    const { month, date, status, employeeId } = req.query;
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
    if (employeeId) query.employeeId = employeeId;

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
app.post('/api/admin/holidays', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const newHoliday = new Holiday(req.body);
    await newHoliday.save();
    res.json({ message: "Holiday Created successfully", holiday: newHoliday });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/holidays/:id', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const updated = await Holiday.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Holiday not found" });
    res.json({ message: "Holiday Updated", holiday: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/holidays/:id', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ message: "Holiday Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
    await AdjustmentRequest.findByIdAndUpdate(requestId, { status });
    res.json({ message: `Request ${status}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/leave/summary/:department', authMiddleware, roleMiddleware(['HoD']), async (req, res) => {
  try {
    const usersInDept = await User.find({ department: req.params.department }).select('employeeId');
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

// --- 10. MESSAGES / CONTACT SUBMISSIONS ---

// A. Send a message
app.post('/api/messages/send', authMiddleware, async (req, res) => {
  try {
    const { recipientRole, subject, message } = req.body;
    const newMessage = new Message({
      senderId: req.user.employeeId,
      recipientRole,
      subject,
      message
    });
    await newMessage.save();
    res.json({ message: "Message sent successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// B. Get inbox for role (Admin or Principal)
app.get('/api/messages/inbox', authMiddleware, roleMiddleware(['Admin', 'Principal']), async (req, res) => {
  try {
    const messages = await Message.find({ recipientRole: req.user.role }).sort({ createdAt: -1 });
    // Attach sender names
    const enriched = await Promise.all(messages.map(async (msg) => {
      const user = await User.findOne({ employeeId: msg.senderId });
      return {
        ...msg.toObject(),
        senderName: user ? `${user.firstName} ${user.lastName} (${msg.senderId})` : msg.senderId
      };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// C. Mark as read
app.put('/api/messages/read/:id', authMiddleware, roleMiddleware(['Admin', 'Principal']), async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { status: 'Read' });
    res.json({ message: "Message marked as read" });
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

    const newType = new LeaveType({ code: code.toLowerCase(), name, defaultDays });
    await newType.save();
    res.json({ message: "Leave type created successfully", leaveType: newType });
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

// A. Send a message
app.post('/api/messages/send', authMiddleware, async (req, res) => {
  try {
    const { recipientRole, subject, message } = req.body;
    const newMessage = new Message({
      senderId: req.user.employeeId,
      recipientRole,
      subject,
      message
    });
    await newMessage.save();
    res.json({ message: 'Message sent successfully', data: newMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// B. Get inbox for Admin/Principal
app.get('/api/messages/inbox', authMiddleware, roleMiddleware(['Admin', 'Principal']), async (req, res) => {
  try {
    const messages = await Message.find({ recipientRole: req.user.role }).sort({ createdAt: -1 });
    
    // Attach employee names
    const enriched = await Promise.all(messages.map(async (msg) => {
      const user = await User.findOne({ employeeId: msg.senderId });
      return {
        ...msg.toObject(),
        senderName: user ? `${user.firstName} ${user.lastName}` : msg.senderId
      };
    }));
    
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// C. Mark message as read
app.put('/api/messages/read/:id', authMiddleware, roleMiddleware(['Admin', 'Principal']), async (req, res) => {
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

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});